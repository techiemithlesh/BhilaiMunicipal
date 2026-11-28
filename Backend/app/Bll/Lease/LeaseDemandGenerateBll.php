<?php

namespace App\Bll\Lease;

use App\Models\Lease\Lease;
use App\Models\Lease\LeaseDemand;
use App\Models\Lease\LeaseRent;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class LeaseDemandGenerateBll
{
    public $_REQ;
    public $_LeaseId;
    public $_CurrentDate;
    public $_WaterConstant;
    public $_user;
    public $_ulbTypeId;
    public $_TaxArray;
    public $_DemandArray;
    public $_taxId;
    private $_Lease;
    private $_fromYear;
    private $_ConsumerConnection;
    private $_ConnectionDetail;
    private $_RateMaster;
    private $_lastDemand;

    public function __construct($request)
    {
        $this->_REQ = $request;
        $this->_LeaseId = $request->id;
        $this->_CurrentDate = $this->_REQ->currentDate ? $this->_REQ->currentDate : Carbon::now()->format('Y-m-d');
        $this->loadParam();
        $this->_TaxArray = collect();
        $this->_DemandArray = collect();
    }

    public function loadParam(){     
        $this->_user = Auth::user();  
        $this->_Lease = Lease::find($this->_LeaseId); 
        $this->_RateMaster = new LeaseRent(); 
        $this->_ConnectionDetail = LeaseRent::find($this->_Lease->current_rate_id);
        $this->_lastDemand = $this->_Lease->getDemand()->orderBy("fyear","desc")->first();
        $minRateEffectivYear = getFY($this->_ConnectionDetail->effective_date);
        $this->_fromYear =  $minRateEffectivYear ;

        if($this->_lastDemand){
            list($fromYear, $toYear) = explode("-", $this->_lastDemand->fyear);
            $nextFrom = (int)$fromYear + 1;
            $nextTo = (int)$toYear + 1;
            $this->_fromYear  = $nextFrom . "-" . $nextTo;
        }
        
        $consumerRequest = camelCase($this->_Lease->toArray())->toArray();
        $this->_REQ->merge($consumerRequest);     
    }

    public function generateMeterDemand(){       
        $counter=1;      
        $currentFyear = getFY();
        $demandFromYear = $this->_fromYear;
        
        while($demandFromYear <= $currentFyear){
                        
            ++$counter;
            $this->_DemandArray->push([
                "leaseId"=>$this->_Lease->id,
                "leaseRentId"=>$this->_ConnectionDetail->id,
                "ulb_id"=>$this->_Lease->ulb_id,
                "ward_mstr_id"=>$this->_Lease->ward_mstr_id,
                "fyear"=>$demandFromYear,
                "amount"=>$this->_ConnectionDetail->yearly_rate,
                "balance"=>$this->_ConnectionDetail->yearly_rate,
                "userId"=>$this->_user?->id,
            ]);
            list($fromYear, $toYear) = explode("-", $demandFromYear);
            $nextFrom = (int)$fromYear + 1;
            $nextTo = (int)$toYear + 1;
            $demandFromYear = $nextFrom . "-" . $nextTo;
            
        }
    }

    public function generateDemand(){
        $this->generateMeterDemand();
        $objDemand = new LeaseDemand();
        if($this->_DemandArray->count()){                       
            foreach($this->_DemandArray as $demand){
                $demandRequest = new Request($demand);
                $objDemand->store($demandRequest);
            }
        }
    }

}
