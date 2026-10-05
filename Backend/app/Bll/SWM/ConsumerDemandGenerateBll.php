<?php

namespace App\Bll\SWM;

use App\Models\DBSystem\UlbMaster;
use App\Models\SWM\ConnectionDetail;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerConnection;
use App\Models\SWM\ConsumerDemand;
use App\Models\SWM\RateMaster;
use App\Models\SWM\TaxDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConsumerDemandGenerateBll
{
    public $_REQUEST;
    public $_ConsumerId;
    public $_CurrentDate;
    public $_WaterConstant;
    public $_user;
    public $_ulbTypeId;
    public $_TaxArray;
    public $_DemandArray;
    public $_taxId;
    private $_Consumer;
    private $_demandFrom;
    private $_ConsumerConnection;
    private $_ConnectionDetail;
    private $_RateMaster;
    private $_lastDemand;

    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_ConsumerId = $request->id;
        $this->_CurrentDate = $this->_REQUEST->currentDate ? $this->_REQUEST->currentDate : Carbon::now()->format('Y-m-d');
        $this->loadParam();
        $this->_TaxArray = collect();
        $this->_DemandArray = collect();
    }

    public function loadParam(){         
        $this->_RateMaster = new RateMaster();
        $this->_user = Auth::user();  
        $this->_Consumer = Consumer::find($this->_ConsumerId); 
        $this->_ConsumerConnection = ConsumerConnection::find($this->_Consumer->current_connection_id);  
        $this->_ConnectionDetail = ConnectionDetail::where("consumer_connection_id",$this->_Consumer->current_connection_id)->get();
        $ulbDtl = UlbMaster::find($this->_Consumer->ulb_id);
        $this->_lastDemand = $this->_Consumer->getDemand()->orderBy("demand_upto","desc")->first();
        $minRateEffectivDate = $this->_RateMaster->where("lock_status",false)
                                ->whereIn("sub_category_type_master_id",$this->_ConnectionDetail->pluck("sub_category_type_master_id"))
                                ->min("effective_from");
        $this->_demandFrom = $this->_ConsumerConnection->date_of_effective < $minRateEffectivDate ? $minRateEffectivDate : $this->_ConsumerConnection->date_of_effective ;
        if($this->_lastDemand){
            $this->_demandFrom = Carbon::parse($this->_lastDemand->demand_upto)->addDay()->format("Y-m-d");
        }
        
        $consumerRequest = camelCase($this->_Consumer->toArray())->toArray();
        $this->_REQUEST->merge($consumerRequest);     
    }

    public function generateMeterDemand(){       
        $counter=1;      
        $currentDate = Carbon::parse($this->_CurrentDate)->endOfMonth();
        $demandFrom = Carbon::parse($this->_demandFrom)->startOfDay();
        $rates = $this->_RateMaster->getRateList();
        
        while($demandFrom->lte($currentDate)){
            $rateDtl = $this->_ConnectionDetail->map(function($conn) use($demandFrom,$rates){
                $rate = $rates->filter(function ($item) use ($demandFrom,$conn){
                    $effectiveFrom = Carbon::parse($item->effective_from);
                    $effectiveUpto = $item->effective_upto ? Carbon::parse($item->effective_upto) : null;
    
                    return $item->sub_category_type_master_id == $conn->sub_category_type_master_id
                        && $effectiveFrom->lte($demandFrom)
                        && (!$effectiveUpto || $effectiveUpto->gte($demandFrom))
                        && !$item->lock_status;
                })->sortByDesc('effective_from')->first();
                if(!$rate && $this->_lastDemand) {
                    throw new Exception("Rate Not Found");
                }
                
                $houseRate = (($rate->rate_per_month??0) * ($conn->total_no_of_house_area_room_truck??0));
                $restaurantRate = $conn->has_restaurant ? (($rate->restaurant_rate_per_month??0) * ($conn->total_no_of_restaurant??0)) : 0 ;
                $gardenRate = $conn->has_garden ? (($rate->garden_rate_per_month??0) * ($conn->total_no_of_garden??0)) : 0;
                $banquetHallRate = $conn->has_banquet_hall ? (($rate->banquet_hall_rate_per_month??0) * ($conn->total_no_of_banquet_hall??0)) : 0;

                $monthly_rate = roundFigure($houseRate + $restaurantRate + $gardenRate + $banquetHallRate);
                $conn->monthly_rate = $monthly_rate;
                $conn->rate = $rate;                
                return $conn;
            });
            
            ++$counter;
            $uptoDate = $demandFrom->copy()->endOfMonth()->startOfDay();            
            $dayDiff = $demandFrom->copy()->diffInDays($uptoDate) + 1;
            $totalDay  = $demandFrom->copy()->daysInMonth;
            $newRequest = new Request();
            $newRequest->merge(["dateOfEffective"=>$this->_demandFrom]);
            $newRequest->merge($this->_REQUEST->all());
            $montlyRate = $rateDtl->sum("monthly_rate");
            $unitRate = $montlyRate/$totalDay;
            $amount = $unitRate * $dayDiff;
            $this->_DemandArray->push([
                "consumerId"=>$this->_Consumer->id,
                "wardMstrId"=>$this->_Consumer->ward_mstr_id,
                "generationDate"=>Carbon::now()->format("Y-m-d"),
                "userId"=>$this->_user?->id,
                "rate"=>$montlyRate,
                "diffDay"=>$dayDiff,
                "demandFrom"=>$demandFrom->format('Y-m-d'),
                "demandUpto"=>$uptoDate->format('Y-m-d'),
                "amount"=>roundFigure($amount),
                "balance"=>roundFigure($amount),
                "unitAmount"=>$unitRate,
                "demandType"=>"Fixed",
                "rateDtl"=>$rateDtl,
            ]);
            $demandFrom = $uptoDate->addDay();
            
        }
    }

    public function generateDemand(){
        $this->generateMeterDemand();
        $objDemand = new ConsumerDemand();
        $objTaxDetail = new TaxDetail();
        if($this->_DemandArray->count()){
            $taxArray=[
                "consumerId"=>$this->_Consumer->id,
                "taxType"=>$this->_DemandArray->unique("demandType")->implode(","),
                "totalAmount"=>$this->_DemandArray->sum("amount"),
                "taxJson"=>$this->_DemandArray
            ];
            $newTaxRequest = new Request($taxArray);
            $this->_taxId = $objTaxDetail->store($newTaxRequest);            
            foreach($this->_DemandArray as $demand){
                $demandRequest = new Request($demand);
                $demandRequest->merge(["taxDetailId"=>$this->_taxId]);
                $objDemand->store($demandRequest);
            }
        }
    }

}
