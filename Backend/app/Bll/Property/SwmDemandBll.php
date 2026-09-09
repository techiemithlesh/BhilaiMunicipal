<?php

namespace App\Bll\Property;

use App\Models\Property\SwmConsumer;
use App\Models\Property\SwmConsumerDemand;
use Carbon\Carbon;

class SwmDemandBll{
    public $_GRID;
    public $_SWMId;    
    public $_SwmConsumer;
    public $_tranDate;

    
    public $_tranDateFyear ;
    public $_isVacantLand = false ;
    public $_demandAmount = 0;
    public $_DemandList;
    public $_otherPenaltyList;
    public $_monthlyPenalty = 0;
    public $_demandFrom;
    public $_demandUpto;
    public $_otherPenalty = 0;

    public $_advanceAmount = 0 ;

    public $_lastPaymentIsClear = true;

    function __construct($swmId,$tranDate=null)
    {
        $this->_SWMId = $swmId;
        $this->_tranDate = Carbon::parse($tranDate);
        $this->_tranDateFyear = getFY($this->_tranDate->copy()->format("Y-m-d"));
        $this->_SwmConsumer = SwmConsumer::find($this->_SWMId);     
        $this->setDemandList();
        $this->testLastTran();
    }

    public function testLastTran(){
        $last = $this->_SwmConsumer->getLastTran();
        if($last && $last->payment_status==2){
            $this->_lastPaymentIsClear = false;
        }
    }

    // public function getOnePercentPenalty($demandList){
    //     $penalty = 0 ;
    //     $monthDiff = 0;
    //     // if(getFY($demandList->demand_upto)<getFY())
    //     // {
    //     //     $monthDiff = floor(Carbon::parse($demandList->due_date)->diffInMonths($this->_tranDate));
    //     //     $penalty = roundFigure(($demandList->balance * $monthDiff * 1.5)/100);
    //     // }
    //     // if(getFY($demandList->due_date)==getFY()  && $this->_tranDate->copy()->format("Y-m-d")>=FyearQutFromDate(getFY(),3) ){
    //     //     $monthDiff = floor(Carbon::parse(FyearQutUptoDate(getFY(),2))->diffInMonths($this->_tranDate));
    //     //     $penalty = roundFigure(($demandList->balance * $monthDiff * 1.5)/100);
    //     // }
    //     $demandList->monthDiff = $monthDiff;
    //     $demandList->monthlyPenalty = $penalty;
    //     return $demandList;
    // }

    // public function getAdvanceAmount(){
    //     $AdvanceDetail = new AdvanceDetail();
    //     $this->_advanceAmount = $AdvanceDetail->getPropAdvanceAmount($this->_PROPId)->advance_amount??0;
    // }

    public function getOnePercentPenalty($demandList){
        $penalty = 0 ;
        $monthDiff = 0;
        # one percent penalty applicable
        // if($demandList->due_date >='2017-06-30' && $demandList->due_date < $this->_tranDate->copy()->format("Y-m-d")){
        //     $monthDiff = floor(Carbon::parse($demandList->due_date)->diffInMonths($this->_tranDate));
        //     $penalty = roundFigure(($demandList->balance_tax * $monthDiff)/100);
        // }
        if(getFY($demandList->due_date)<getFY())
        {
            $monthDiff = floor(Carbon::parse($demandList->due_date)->diffInMonths($this->_tranDate));
            $penalty = roundFigure(($demandList->balance_tax * $monthDiff * 1.5)/100);
        }
        if(getFY($demandList->due_date)==getFY()  && $this->_tranDate->copy()->format("Y-m-d")>=FyearQutFromDate(getFY(),3) ){
            $monthDiff = floor(Carbon::parse(FyearQutUptoDate(getFY(),2))->diffInMonths($this->_tranDate));
            $penalty = roundFigure(($demandList->balance_tax * $monthDiff * 1.5)/100);
        }
        $demandList->monthDiff = $monthDiff;
        $demandList->monthlyPenalty = $penalty;
        return $demandList;
    }

    public function setDemandList(){   
        $swmDemand = new SwmConsumerDemand();
        $this->_DemandList = collect($swmDemand->getDueDemand($this->_SWMId));
        $this->_DemandList = $this->_DemandList->map(function($item){                                
                                $item = $this->getOnePercentPenalty($item);
                                return $item;
                            });
        $this->_monthlyPenalty = roundFigure($this->_DemandList->sum("monthlyPenalty"));
        $this->_demandAmount = roundFigure($this->_DemandList->sum("balance"));
                
        $this->_demandFrom = $this->_DemandList->min("demand_from");
        $this->_demandUpto = $this->_DemandList->max("demand_upto");
    }

    public function generateDemand(){
        $this->_GRID = [
            "lastPaymentClear" => $this->_lastPaymentIsClear,
            "demandList"=>$this->_DemandList,
            "grantTax"=>$this->generateGrantTax($this->_DemandList),
            "otherPenaltyList"=>$this->_otherPenaltyList,
            "demandAmount"=>$this->_demandAmount,
            "advanceAmount" => $this->_advanceAmount,
            "OtherPenalty"=>$this->_otherPenalty,
            "monthlyPenalty"=>$this->_monthlyPenalty,
            "fromDate"=>$this->_demandFrom,
            "uptoDate"=>$this->_demandUpto,
            "payableAmount" => roundFigure(($this->_demandAmount +  $this->_otherPenalty + $this->_monthlyPenalty ) - ( $this->_advanceAmount) ),
        ];
        $this->_GRID["payableAmountInWord"] = getIndianCurrency($this->_GRID["payableAmount"]);
    }

    public function generateGrantTax($demandList){
        $demandList = collect($demandList);
        $returnData = [
            "amount"=>roundFigure($demandList->sum("amount")),
            "balance"=> roundFigure($demandList->sum("balance")),
            "monthlyPenalty"=> roundFigure($demandList->sum("monthlyPenalty")),
        ];
        return collect($returnData);
    }

    public function getConsumerDue(){
        // $this->getAdvanceAmount();
        // $this->getOtherPenalty();
        $this->generateDemand();
    }
}