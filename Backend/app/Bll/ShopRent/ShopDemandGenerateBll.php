<?php

namespace App\BLL\ShopRent;

use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopDemand;
use App\Models\ShopRent\ShopRent;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ShopDemandGenerateBll
{
    /**
     * Create a new class instance.
     */
    public $_REQ;
    public $_ShopId;
    public $_DemandUpto;
    public $_DemandFrom;
    public $_DemandArray;
    public $_Shop;
    public $_ShopRent;
    public $_user;
    public $_lastDemand;

    private $_ObjShop;
    private $_ObjShopRent;
    private $_ObjShopDemand;
    public function __construct($request)
    {
        $this->_REQ = $request;
        $this->_ShopId = $request->id;
        $this->_DemandUpto = $this->_REQ->currentDate ? $this->_REQ->currentDate : Carbon::now()->format('Y-m-d');
                
        $this->_user = Auth::user();
        $this->_ObjShop = new Shop();
        $this->_ObjShopRent = new ShopRent();
        $this->_ObjShopDemand = new ShopDemand();
        $this->loadParam();
        $this->_DemandArray = collect();
    }

    protected function loadParam(){   
        $this->_ObjShopRent = new ShopRent();
        $this->_Shop = $this->_ObjShop->find($this->_ShopId); 
        $this->_ShopRent = $this->_Shop->getCurrentRent()->first();
        
        $minRateEffectivDate = $this->_ShopRent->effective_date;
        $this->_lastDemand = $this->_Shop->getDemand()->orderBy("demand_upto","desc")->first();
        $this->_DemandFrom = $minRateEffectivDate ;
        if($this->_lastDemand){
            $this->_DemandFrom = Carbon::parse($this->_lastDemand->demand_upto)->addDay()->format("Y-m-d");
        }    
    }

    private function generateMonthlyDemand(){       
        $counter=1;      
        $currentDate = Carbon::parse($this->_DemandUpto)->endOfMonth();
        $demandFrom = Carbon::parse($this->_DemandFrom);
        
        while($demandFrom->lte($currentDate)){            
            ++$counter;
            $uptoDate = $demandFrom->copy()->endOfMonth();         
            $dayDiff = $demandFrom->copy()->diffInDays($uptoDate) + 1;
            $totalDay  = $demandFrom->copy()->daysInMonth;
            $montlyRate = $this->_ShopRent->monthly_rate;
            $unitRate = $montlyRate/$totalDay;
            $amount = $unitRate * $dayDiff;
            $this->_DemandArray->push([
                "shopId"=>$this->_Shop->id,
                "wardMstrId"=>$this->_Shop->ward_mstr_id,
                "generationDate"=>Carbon::now()->format("Y-m-d"),
                "userId"=>$this->_user?->id,
                "rate"=>$montlyRate,
                "diffDay"=>$dayDiff,
                "demandFrom"=>$demandFrom->format('Y-m-d'),
                "demandUpto"=>$uptoDate->format('Y-m-d'),
                "totalDemand"=>roundFigure($amount),
                "amount"=>roundFigure($amount),
                "balance"=>roundFigure($amount),
                "dueAmount"=>roundFigure($amount),
                "unitAmount"=>$unitRate,
                "demandType"=>"Fixed",
                "shopRentId"=>$this->_ShopRent->id,
            ]);
            $demandFrom = $uptoDate->addDay();
            
        }
    }

    public function generateDemand(){
        $this->generateMonthlyDemand();
        if($this->_DemandArray->count()){          
            foreach($this->_DemandArray as $demand){
                $demandRequest = new Request($demand);
                $this->_ObjShopDemand->store($demandRequest);
            }
        }
    }
}
