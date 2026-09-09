<?php

namespace App\Bll\Water;

use App\Exceptions\CustomException;
use App\Models\DBSystem\UlbMaster;
use App\Models\Water\Consumer;
use App\Models\Water\ConsumerDemand;
use App\Models\Water\FixedMeterRateMaster;
use App\Models\Water\FixedRateMaster;
use App\Models\Water\MeterRateMaster;
use App\Models\Water\MeterReading;
use App\Models\Water\MeterUlbTypeMultyFactorMaster;
use App\Models\Water\TaxDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class BiharConsumerDemandGenerateBll
{
    /**
     * Create a new class instance.
     */
    public $_REQUEST;
    public $_ConsumerId;
    public $_CurrentDate;
    public $_WaterConstant;
    public $_user;
    public $_ulbTypeId;
    public $_TaxArray;
    public $_DemandArray;
    public $_taxId;
    private $_propertyTypeId;
    private $_category;
    private $_areaSqrt;
    private $_Consumer;
    private $_demandFrom;
    private $_connectionTypeId;
    private $_rateMaster;
    private $_FixedRateMaster;
    private $_MeterRates;
    private $_mutlyFactor;
    private $_initialMeterReadingDtl;
    private $_fromReading;
    private $_currentReading;
    private $_dayDifference;
    private $_minFromDate;
    private $_meterFixedMaxDate;
    private $_UlbId;
    private $_UlbTypeId;
    
    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_ConsumerId = $request->id;
        $this->_CurrentDate = $this->_REQUEST->currentDate ? $this->_REQUEST->currentDate : Carbon::now()->format('Y-m-d');
        $this->_WaterConstant = Config::get("WaterConstant");
        $this->loadParam();
        $this->_TaxArray = collect();
        $this->_DemandArray = collect();
    }
    public function loadParam(){  
        $this->_user = Auth::user();  
        $this->_Consumer = Consumer::find($this->_ConsumerId); 
        $this->_currentReading = $this->_REQUEST->lastReading??0;  
        $ulbDtl = UlbMaster::find($this->_Consumer->ulb_id);
        $this->_ulbTypeId = $ulbDtl->ulb_type_id; 
        $lastDemand = $this->_Consumer->getDemand()->orderBy("demand_upto","desc")->first();
        $currentConnection = $this->_Consumer->getCurrentConnection;
        $this->_initialMeterReadingDtl =  $currentConnection->getLastReading();
        $this->_fromReading = $this->_initialMeterReadingDtl?->reading;
        $this->_connectionTypeId = $currentConnection->meter_type_id;
        $this->_demandFrom = $lastDemand ? Carbon::parse($lastDemand->demand_upto)->addDay()->format("Y-m-d") : $currentConnection->connection_date;
        
        $this->_propertyTypeId = $this->_Consumer->property_type_id;
        $this->_category = $this->_Consumer->category;
        $this->_areaSqrt = $this->_Consumer->area_sqft;

        $this->_UlbId = $this->_Consumer->ulb_id;
        $this->_UlbTypeId = $ulbDtl?->ulb_type_id;

        // Corrected: Eagerly load all relevant rates before the loop.
        // $this->_FixedMeterRates = FixedMeterRateMaster::where("lock_status", false)->get();
        $this->_FixedRateMaster = FixedRateMaster::where("lock_status", false)->get();
        $this->_MeterRates = MeterRateMaster::where("lock_status", false)->get();

        $this->_mutlyFactor = MeterUlbTypeMultyFactorMaster::find($this->_ulbTypeId)->multy_factor;        
        $this->_minFromDate = $this->_FixedRateMaster->min("effective_from");
        $this->_meterFixedMaxDate = $this->_MeterRates->min("effective_from");
        if($this->_demandFrom<$this->_minFromDate){
            $this->_demandFrom = $this->_minFromDate;
        }
        $this->_dayDifference = dateDiff($this->_demandFrom,$this->_CurrentDate)+1;//Carbon::parse($this->_demandFrom)->diffInDays($this->_CurrentDate)
    }

    public function generateMeterDemand(){
        $unitConsume = ($this->_currentReading - $this->_fromReading);
        $oneDayReading =  $unitConsume / ($this->_dayDifference ? $this->_dayDifference : 1);         
        $counter=1;
        $reading = $this->_fromReading;        
        while($this->_demandFrom <= $this->_CurrentDate){
            ++$counter;
            $uptoDate =  Carbon::parse($this->_demandFrom)->endOfMonth()->format("Y-m-d");
            if($uptoDate > $this->_CurrentDate){
                $uptoDate = $this->_CurrentDate;
            }
            $dayDiff=(dateDiff($this->_demandFrom,$uptoDate) +1 );
            $uptoReading = $dayDiff* $oneDayReading;
            $multyFactore = 1;
            
            if($this->_demandFrom<$this->_meterFixedMaxDate){
                // Corrected: Use collection methods to filter the pre-fetched data.
                $rate = $this->_FixedMeterRates
                    ->where("property_type_id", $this->_propertyTypeId)
                    ->where("meter_type_id", $this->_connectionTypeId)
                    ->where("from_area", "<=", $this->_areaSqrt)
                    ->where("upto_area", ">=", $this->_areaSqrt)
                    ->where("effective_from", "<=", $this->_demandFrom)
                    ->filter(function($item)use($uptoDate) {
                        return (Carbon::parse($item->effective_upto)->gte(Carbon::parse($uptoDate)) || is_null($item->effective_upto));
                    })
                    ->sortBy("effective_from")
                    ->first();
            } else {
                // Corrected: Use collection methods to filter the pre-fetched data.
                $multyFactore = $this->_mutlyFactor;
                $rate = $this->_MeterRates
                    ->where("property_type_id", $this->_propertyTypeId);
                if($this->_propertyTypeId==1){
                    $rate = $rate->where("category",$this->_category);
                }
                
               $rate = $rate
                    ->where("from_unit", "<=", $uptoReading)
                    ->where("upto_unit", ">=", $uptoReading)
                    ->where("effective_from", "<=", $this->_demandFrom)
                    ->filter(function($item) use($uptoDate) {
                        return (Carbon::parse($item->effective_upto)->gte(Carbon::parse($uptoDate)) || is_null($item->effective_upto));
                    })
                    ->sortBy("effective_from")
                    ->first();
            }
            $unitRate = $rate->rate * $multyFactore;
            $amount = $unitRate * $uptoReading;
            $reading += $uptoReading;
            $this->_DemandArray->push([
                "consumerId"=>$this->_Consumer->id,
                "wardMstrId"=>$this->_Consumer->ward_mstr_id,
                "generationDate"=>Carbon::now()->format("Y-m-d"),
                "userId"=>$this->_user?->id,
                "rate"=>$rate,
                "diffDay"=>$dayDiff,
                "oneDayReading"=>$oneDayReading,
                "demandFrom"=>$this->_demandFrom,
                "demandUpto"=>$uptoDate,
                "amount"=>roundFigure($amount),
                "balance"=>roundFigure($amount),
                "thisMonthReading"=>$uptoReading,
                "fromReading"=> ($reading - $uptoReading),
                "currentMeterReading"=>$reading,
                "unitAmount"=>$unitRate,
                "demandType"=>flipConstants($this->_WaterConstant["CONNECTION_TYPE"])[$this->_connectionTypeId],
            ]);
            $this->_demandFrom = Carbon::parse($uptoDate)->addDay()->format("Y-m-d");
        }
    }

    public function generateFixedDemand(){
        $this->_currentReading = null; 
        if (Carbon::parse($this->_currentReading)->day != Carbon::parse($this->_CurrentDate)->lastOfMonth()->day) {
            $this->_CurrentDate = Carbon::parse($this->_CurrentDate)->subMonth()->endOfMonth()->format("Y-m-d");
        }
        while($this->_demandFrom <= $this->_CurrentDate){
            $uptoDate =  Carbon::parse($this->_demandFrom)->endOfMonth()->format("Y-m-d");
            if($uptoDate > $this->_CurrentDate){
                $uptoDate = $this->_CurrentDate;
            }
            $dayDiff=(dateDiff($this->_demandFrom,$uptoDate) +1 );
            
            $rate = $this->_FixedRateMaster
                    ->where("property_type_id",$this->_propertyTypeId)
                    ->where("ulb_type_id",$this->_UlbTypeId)                    
                    ->where("effective_from",'<=',$this->_demandFrom)
                    ->filter(function($item)use($uptoDate) {
                        return (Carbon::parse($item->effective_upto)->gte(Carbon::parse($uptoDate)) || is_null($item->effective_upto));
                    });
            if(in_array($this->_propertyTypeId,[1])){
                $rate->where("category",$this->_category);
            }
            $rate = $rate->where("lock_status",false)
                    ->sortBy("effective_from")
                    ->first();
            
            $unitRate = $rate->rate ;
            $amount = $unitRate;
            $this->_DemandArray->push([
                "consumerId"=>$this->_Consumer->id,
                "wardMstrId"=>$this->_Consumer->ward_mstr_id,
                "generationDate"=>Carbon::now()->format("Y-m-d"),
                "userId"=>$this->_user?->id,
                "rate"=>$rate,
                "diffDay"=>$dayDiff,
                "oneDayReading"=>0,
                "demandFrom"=>$this->_demandFrom,
                "demandUpto"=>$uptoDate,
                "amount"=>roundFigure($amount),
                "balance"=>roundFigure($amount),
                "thisMonthReading"=>0,
                "currentMeterReading"=>0,
                "unitAmount"=>$unitRate,
                "demandType"=>flipConstants($this->_WaterConstant["CONNECTION_TYPE"])[$this->_connectionTypeId],
            ]);
            $this->_demandFrom = Carbon::parse($uptoDate)->addDay()->format("Y-m-d");
        }
    }

    public function generateDemand(){
        switch($this->_connectionTypeId){
            case $this->_WaterConstant["CONNECTION_TYPE"]["Meter"] : 
                $this->generateMeterDemand();
                break;
            case $this->_WaterConstant["CONNECTION_TYPE"]["Fixed"] :
                $this->generateFixedDemand();
                break; 
            default : throw new CustomException("Please Update Connection Type First");
        }
        $objMeterReading = new MeterReading();
        $objTaxDetail = new TaxDetail();
        $objDemand = new ConsumerDemand();
        $newReadingInsert = [
            "meterStatusId"=>$this->_Consumer->meter_status_id,
            "reading"=>$this->_currentReading,
            "docPath"=>$this->_REQUEST->docPath,
            "userId"=>$this->_user?->id,
        ];
        $uptoReadingId=null;
        if($this->_WaterConstant["CONNECTION_TYPE"]["Meter"] == $this->_connectionTypeId){
            $newReadingRequest = new Request($newReadingInsert);
            $uptoReadingId = $objMeterReading->store($newReadingRequest);
        }
        if($this->_DemandArray->count()){

            $this->_TaxArray=[
                "consumerId"=>$this->_Consumer->id,
                "meterStatusId"=>$this->_Consumer->meter_status_id,
                "taxType"=>$this->_DemandArray->unique("demandType")->implode(","),
                "taxType"=>$this->_DemandArray->unique("demandType")->implode(","),
                "initialReading"=>$this->_fromReading,
                "initialMeterReading"=>$this->_initialMeterReadingDtl?->id,
                "finalReading"=>$this->_currentReading,
                "finalMeterReading"=>$uptoReadingId,
                "totalAmount"=>$this->_DemandArray->sum("amount"),
                "taxJson"=>$this->_DemandArray
            ];
            $newTaxRequest = new Request($this->_TaxArray);
            $this->_taxId = $objTaxDetail->store($newTaxRequest);
            foreach($this->_DemandArray as $demand){
                $demandRequest = new Request($demand);
                $demandRequest->merge(["taxDetailId"=>$this->_taxId]);
                $objDemand->store($demandRequest);
            }
        }
    }
}