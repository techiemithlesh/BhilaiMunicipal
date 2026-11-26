<?php

namespace App\Bll\SWM;

use App\Models\SWM\AdvanceDetail;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerDemand;
use App\Trait\SWM\ConsumerTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ConsumerDueBll
{
    use ConsumerTrait;
    public $_CONSUMERId;
    public $_CONSUMER;
    public $_owners;
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
    public $_endDateOfFyear ;
    public $_startDateOfFyear ;    
    private $_demandUptoList; 
    private $_currentDemandList;
    private $_previousDemandList;
    private $_currentDemandAmount;
    private $_arrearDemandAmount;

    public function __construct($consumerId,$tranDate=null,$demandUpto=null)
    {
        $this->_CONSUMERId = $consumerId;
        $this->_tranDate = Carbon::parse($tranDate)->endOfMonth()->format("Y-m-d");
        list($this->_startDateOfFyear,$this->_endDateOfFyear) = FyearFromUptoDate(getFY($tranDate));
        // $this->_demandUpto = Carbon::parse($demandUpto)->format("Y-m-d");
        $this->_demandUpto = $demandUpto ? Carbon::parse($demandUpto)->format("Y-m-d") : $this->_endDateOfFyear;
        $this->_CONSUMER = Consumer::find($this->_CONSUMERId);
        $this->_CONSUMER = $this->adjustValue($this->_CONSUMER);  
        $this->_owners = collect($this->_CONSUMER->getOwners())->sortBy("id");             
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
        $this->_demandUptoList = $objDemand
                ->select(DB::raw("DISTINCT demand_upto AS demand_upto"))
                ->where("consumer_id",$this->_CONSUMERId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("demand_upto","DESC")
                ->get();
        $this->_DemandList = collect($objDemand->getDueDemand($this->_CONSUMERId))
                            ->where("demand_upto","<=",$this->_demandUpto);
                            
        $this->_DemandList = $this->_DemandList->map(function($item){                                
                                $item = $this->getLatePenalty($item);
                                return $item;
                            });
        $this->_latePenalty = roundFigure($this->_DemandList->sum("latePenalty"));
        $this->_demandAmount = roundFigure($this->_DemandList->sum("balance"));
        $this->_fromDate = $this->_DemandList->min("demand_from");
        $this->_uptoDate = $this->_DemandList->max("demand_upto");

        $this->_currentDemandList = $currentDemand = $this->_DemandList->where("demand_upto",">=",$this->_startDateOfFyear);
        $this->_previousDemandList = $previousDemand = $this->_DemandList->where("demand_upto","<",$this->_startDateOfFyear);

        $currentDemandAmt = $currentDemand->sum("balance");
        $currentLatePenalty = $currentDemand->sum("latePenalty");

        $previousDemandAmt = $previousDemand->sum("balance");
        $previousLatePenalty = $previousDemand->sum("latePenalty");

        $this->_currentDemandAmount = roundFigure($currentDemandAmt+$currentLatePenalty);
        $this->_arrearDemandAmount = roundFigure($previousDemandAmt+$previousLatePenalty);
    }

    private function getLatePenalty($demandList){
        $penalty = 0 ;
        $monthDiff = 0;
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
            "demand_from"=>$demandList->min("demand_from"),
            "demand_upto"=>$demandList->max("demand_upto"),
            "amount"=>roundFigure($demandList->sum("amount")),
            "balance"=> roundFigure($demandList->sum("balance")),
            "latePenalty"=> roundFigure($demandList->sum("latePenalty")),
            "totalTax"=> roundFigure($demandList->sum("balance")+$demandList->sum("latePenalty")),
        ];
        return collect($returnData);
    }

    private function generateDemand(){
        $this->_GRID = [            
            "demandUptoList"=>$this->_demandUptoList,
            "lastPaymentClear" => $this->_lastPaymentIsClear,
            "demandList"=>$this->_DemandList,
            "otherPenaltyList"=>$this->_otherPenaltyList??[],
            "grantTax"=>$this->generateGrantTax($this->_DemandList),
            "previousDemand"=> $this->_previousDemandList,
            "currentDemand"=> $this->_currentDemandList,
            "previousDemandReceipt"=>$this->generateGrantTax($this->_previousDemandList),
            "currentDemandReceipt"=>$this->generateGrantTax($this->_currentDemandList),

            "demandAmount"=>$this->_demandAmount,
            "advanceAmount" => $this->_advanceAmount,
            "otherPenalty"=>$this->_otherPenalty,
            "latePenalty" => $this->_latePenalty,
            "fromDate"=>$this->_fromDate,
            "uptoDate"=>$this->_uptoDate,
            "payableAmount" => roundFigure(($this->_demandAmount + $this->_latePenalty + $this->_otherPenalty) - ($this->_advanceAmount) ),

            "printingDate"=>Carbon::now()->format("Y-m-d H:i:s"),
            "consumer"=>$this->_CONSUMER,
            "address" => $this->_PROPERTY->prop_address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "relationType" =>$this->_owners->unique("relation_type")->pluck("relation_type")->implode(", "),
            "guardianName" =>$this->_owners->implode("guardian_name",", "),
            "mobileNo"=>$this->_owners->implode("mobile_no",", "),
        ];
    }

    public function getConsumerDue(){
        $this->getAdvanceAmount();
        $this->generateDemand();
    }

}