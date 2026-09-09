<?php

namespace App\Bll\Water;

use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterConnectionCharge;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WaterApplicationDemandBll
{
    public $_GRID;
    public $_APPId;
    public $_tranDate;
    public $_tranDateFyear ;
    public $_APPLICATION;
    public $_DemandList;
    public $_otherPenaltyList;
    public $_connectionFee =0;
    public $_demandAmount = 0;
    public $_realizationPenalty = 0;
    public $_discount;
    public $_otherPenalty = 0;
    public $_advanceAmount = 0 ;
    public $_lastPaymentIsClear = true;

    function __construct($id,$tranDate=null)
    {
        $this->_APPId = $id;
        $this->_tranDate = Carbon::parse($tranDate);
        $this->_APPLICATION = WaterActiveApplication::find($this->_APPId);
        if(!$this->_APPLICATION){
            $this->_APPLICATION = WaterApplication::find($this->_APPId);
        }        
        $this->setDemandList();
        $this->testLastTran();
    }

    public function testLastTran(){
        $last = $this->_APPLICATION->getLastTran();
        if($last && $last->payment_status==2){
            $this->_lastPaymentIsClear = false;
        }
    }
    public function setDemandList(){   
        $demand = new WaterConnectionCharge();
        $this->_DemandList = collect($demand->getDueDemand($this->_APPId));
        $this->_DemandList = $this->_DemandList->map(function($item){                                
                                $this->getTenPerDiscount($item);
                                return $item;
                            });
        $this->_realizationPenalty = roundFigure($this->_DemandList->sum("penalty"));
        $this->_demandAmount = roundFigure($this->_DemandList->sum("amount"));
        $this->_connectionFee = roundFigure($this->_DemandList->sum("conn_fee"));
        $this->_discount = roundFigure($this->_DemandList->sum("discount"));
    }

    public function getTenPerDiscount($item){
        $item->discount = 0;
        if($item->charge_for=="New Connection"){
            $item->discount = round(($item->penalty /100)*10);
        }
    }

    public function generateDemand(){
        $this->_GRID = [
            "lastPaymentClear" => $this->_lastPaymentIsClear,
            "demandList"=>$this->_DemandList,
            "otherPenaltyList"=>$this->_otherPenaltyList??[],
            "connectionFee"=>$this->_connectionFee,
            "realizationPenalty"=>$this->_realizationPenalty,
            "otherPenalty"=>$this->_otherPenalty,
            "advanceAmount" => $this->_advanceAmount,
            "discountAmount"=>$this->_discount,
            "description"=>$this->_discount!=0?(" 10% (".$this->_discount.") Discount When Full Payment On Regularization") : "",
            "demandAmount"=>$this->_demandAmount,
            "payableAmount" => roundFigure(($this->_connectionFee + $this->_otherPenalty + $this->_realizationPenalty) - ($this->_discount +  $this->_advanceAmount) ),
        ];
    }
}
