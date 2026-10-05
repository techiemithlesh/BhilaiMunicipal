<?php

namespace App\Bll\SWM;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerDemand;
use App\Trait\SWM\ConsumerTrait;
use Carbon\Carbon;

class DemandReceiptBll
{
    use ConsumerTrait;

    public $_CONSUMERId;
    public $_CONSUMER;
    public $_demandUpto;
    public $_tranDate;
    public $_DemandList;
    public $_RateDemandList ;
    public $_otherPenaltyList;
    public $_demandAmount;
    public $_latePenalty;
    public $_advanceAmount;
    public $_fromDate;
    public $_uptoDate;
    public $_lastPaymentIsClear = true;
    public $_otherPenalty = 0;
    public $_UlbDetail;
    public $_oldWard;
    public $_newWard;
    public $_application;
    public $_owners;
    public $_tblRow;
    public $_GRID;

    public function __construct($consumerId,$tranDate=null,$demandUpto=null)
    {
        $this->_CONSUMERId = $consumerId;
        $this->_tranDate = Carbon::parse($tranDate)->format("Y-m-d");
        $this->_demandUpto = Carbon::parse($demandUpto)->format("Y-m-d");
        $this->_CONSUMER = Consumer::find($this->_CONSUMERId);   
        $this->_CONSUMER = $this->adjustValue($this->_CONSUMER); 
    }

    private function consumerReceipt(){
        $objConsumerDueBll = new ConsumerDueBll($this->_CONSUMER->id,$this->_tranDate);
        $objConsumerDueBll->getConsumerDue();
        $this->_UlbDetail = UlbMaster::find($this->_CONSUMER->ulb_id);
        if($this->_UlbDetail){
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/'.$this->_UlbDetail->logo_img) : "";
            $this->_UlbDetail->left_logo =  url('/'."UlbLog/swm.png") ;
            $this->_UlbDetail->right_logo =  url('/'."UlbLog/swachh_bharat.png") ;
        }
        $this->_oldWard = UlbWardMaster::find($this->_CONSUMER->ward_mstr_id);
        $this->_owners = collect($this->_CONSUMER->getOwners())->sortBy("id");
        $this->_DemandList = $objConsumerDueBll->_GRID["demandList"];        
        $this->_GRID = $objConsumerDueBll->_GRID;
        $this->_GRID["rateDemandList"] = $this->generateMeterRange();
        $this->_GRID["totalRateDemand"] = roundFigure(collect($this->_GRID["rateDemandList"])->sum("balance"));

        $this->_GRID = collect($this->_GRID)->merge([
                "description"=>"SOLID WASTE USER CHARGE DEMAND",
                "department" => "Health Section",
                "accountDescription" => "Solid Waste User Charge & Others",
                "printDate"=>Carbon::now()->format("Y-m-d"),
                "wardNo" =>$this->_oldWard->ward_no??"N/A",
                "consumer_no" => $this->_CONSUMER->consumer_no??"",
                "holding_no"=>$this->_CONSUMER->holding_no??"",
                "address" => $this->_CONSUMER->address??"",
                "ownerName" =>$this->_owners->implode("owner_name",", "),
                "mobile_no" =>$this->_owners->pluck("mobile_no")->unique()->implode(", "),
                "amountInWords" => getIndianCurrency($this->_GRID["payableAmount"]),
                "consumerDtl"=>$this->_CONSUMER,
                "ulbDtl" => $this->_UlbDetail,
                "ownerDtl" => $this->_owners,
            ])->toArray();
    }

    public function generateMeterRange()
    {
        $demands = collect($this->_DemandList) 
                    ->sortBy('demand_from')        
                    ->values();
        $result = collect();
        $current = null;

        foreach ($demands as $item) {
            $from = Carbon::parse($item->demand_from);
            $upto = Carbon::parse($item->demand_upto);

            if (!$current) {
                // Start first range
                $current = [
                    'rate' => $item->rate,
                    'demand_from' => $from->toDateString(),
                    'demand_upto' => $upto->toDateString(),
                    "latePenalty"=> $item->latePenalty,
                    'balance' => $item->balance,
                ];
                continue;
            }

            // If same rate and consecutive month, extend the range
            $expectedNext = Carbon::parse($current['demand_upto'])->addDay(); // next day after last range
            if ($item->rate == $current['rate'] && $from->equalTo($expectedNext)) {
                $current['demand_upto'] = $upto->toDateString();
                $current['latePenalty'] += $item->latePenalty;
                $current['balance'] += $item->balance;
            } else {
                // Push the current range and start a new one
                $result->push($current);
                $current = [
                    'rate' => $item->rate,
                    'demand_from' => $from->toDateString(),
                    'demand_upto' => $upto->toDateString(),
                    "latePenalty"=> $item->latePenalty,
                    'balance' => $item->balance,
                ];
            }
        }

        // push last one
        if ($current) {
            $result->push($current);
        }

        return $result->values();

    }

    public function generateReceipt(){
        $this->consumerReceipt();
    }
}
