<?php

namespace App\Bll\Water;

use App\Models\Water\AdvanceDetail;
use App\Models\Water\Consumer;
use App\Models\Water\ConsumerDemand;
use Carbon\Carbon;

class ConsumerDueBll
{
    public $_CONSUMERId;
    public $_CONSUMER;
    public $_demandUpto;
    public $_tranDate;
    public $_DemandList;
    public $_otherPenaltyList;
    public $_demandAmount;
    public $_latePenalty;
    public $_advanceAmount;
    public $_fromDate;
    public $_uptoDate;
    public $_lastPaymentIsClear = true;
    public $_otherPenalty = 0;
    public $_GRID;
    public function __construct($consumerId,$tranDate=null,$demandUpto=null)
    {
        $this->_CONSUMERId = $consumerId;
        $this->_tranDate = Carbon::parse($tranDate)->format("Y-m-d");
        $this->_demandUpto = Carbon::parse($demandUpto)->format("Y-m-d");
        $this->_CONSUMER = Consumer::find($this->_CONSUMERId);               
        $this->setDemandList();
        $this->testLastTran();
    }

    private function testLastTran(){
        $last = $this->_CONSUMER->getLastTran();
        if($last && $last->payment_status==2){
            $this->_lastPaymentIsClear = false;
        }
    }

    private function setDemandList(){
        $objDemand = new ConsumerDemand();
        $this->_DemandList = collect($objDemand->getDueDemand($this->_CONSUMERId))->where("demand_upto","<=",$this->_demandUpto)->where("demand_upto","<=",$this->_tranDate);
        $this->_DemandList = $this->_DemandList->map(function($item){                                
                                $item = $this->getLatePenalty($item);
                                return $item;
                            });
        $this->_latePenalty = roundFigure($this->_DemandList->sum("latePenalty"));
        $this->_demandAmount = roundFigure($this->_DemandList->sum("balance"));
        $this->_fromDate = $this->_DemandList->min("demand_from");
        $this->_uptoDate = $this->_DemandList->max("demand_upto");
    }

    private function getLatePenalty($demandList){
        $penalty = 0 ;
        $monthDiff = 0;
        # on meter after 3 month of demand generation 1.5% of balance per month
        // if($demandList->generation_date>="2021-01-01" && strtolower($demandList->demand_type)=="meter"){
        //    $monthDiff = monthDiff($demandList->generation_date,$this->_tranDate);
        //    $monthDiff = $monthDiff>2 ? $monthDiff-2 : 0;
        //    $penalty = ($monthDiff * 1.5 * $demandList->balance)/100;
        // }
        // # on fixed after 1 month of demand generation 10% of balance
        // elseif($demandList->generation_date>="2015-07-01" && strtolower($demandList->demand_type)=="fixed"){
        //     $monthDiff = monthDiff($demandList->generation_date,$this->_tranDate);            
        //     $penalty = $monthDiff>1 ? (($demandList->balance * 10)/100) : 0 ;
        // }
        $demandList->monthDiff = $monthDiff;
        $demandList->latePenalty = $penalty;
        $demandList->totalTax = roundFigure($demandList->latePenalty + $demandList->balance);
        return $demandList;
    }

    private function getAdvanceAmount(){
        $AdvanceDetail = new AdvanceDetail();
        $this->_advanceAmount = $AdvanceDetail->getConsumerAdvanceAmount($this->_CONSUMERId)->advance_amount??0;
    }

    private function generateGrantTax($demandList){
        $demandList = collect($demandList);
        $returnData = [
            "amount"=>roundFigure($demandList->sum("amount")),
            "balance"=> roundFigure($demandList->sum("balance")),
            "latePenalty"=> roundFigure($demandList->sum("latePenalty")),
        ];
        return collect($returnData);
    }

    private function generateDemand(){
        $this->_GRID = [
            "lastPaymentClear" => $this->_lastPaymentIsClear,
            "demandList"=>$this->_DemandList,
            "otherPenaltyList"=>$this->_otherPenaltyList??[],
            "grantTax"=>$this->generateGrantTax($this->_DemandList),
            "demandAmount"=>$this->_demandAmount,
            "advanceAmount" => $this->_advanceAmount,
            "otherPenalty"=>$this->_otherPenalty,
            "latePenalty" => $this->_latePenalty,
            "fromDate"=>$this->_fromDate,
            "uptoDate"=>$this->_uptoDate,
            "payableAmount" => roundFigure(($this->_demandAmount + $this->_latePenalty + $this->_otherPenalty) - ($this->_advanceAmount) ),
        ];
    }

    public function getConsumerDue(){
        $this->getAdvanceAmount();
        $this->generateDemand();
    }

}
