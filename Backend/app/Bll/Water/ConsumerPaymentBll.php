<?php

namespace App\Bll\Water;

use App\Models\Citizen;
use App\Models\User;
use App\Models\Water\AdjustmentDetail;
use App\Models\Water\AdvanceDetail;
use App\Models\Water\ChequeDetail;
use App\Models\Water\Consumer;
use App\Models\Water\ConsumerDemand;
use App\Models\Water\ConsumerDemandsCollection;
use App\Models\Water\TransactionFineRebateDetail;
use App\Models\Water\WaterTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class ConsumerPaymentBll
{
    public $_REQUEST;
    public $_APPId;
    public $_CONSUMER;
    public $_Demand;
    public $_DemandList;
    public $_tranDate;

    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_APPId = $request->id;
        $this->_tranDate = Carbon::parse($request->tranDate)->format("Y-m-d");
        $this->_CONSUMER = Consumer::find($this->_APPId);
       
        $ConsumerDueBll = new ConsumerDueBll($this->_APPId,$this->_tranDate);
        $ConsumerDueBll->getConsumerDue();
        $this->_Demand = $ConsumerDueBll->_GRID;
        $this->_DemandList = $ConsumerDueBll->_GRID["demandList"];
        $this->setParams();
    }

    private function setParams(){
        if(!$this->_REQUEST->amount){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["payableAmount"]]);
        }
        if($this->_REQUEST->paymentType=="FULL"){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["payableAmount"]]);
        }

        $user = Auth()->user();

        if($this->_REQUEST->userId && $this->_REQUEST->typeOfUser=="citizens"){
            $user = Citizen::find($this->_REQUEST->userId);
        }
        if($this->_REQUEST->userId && $this->_REQUEST->typeOfUser!="citizens"){
            $user = User::find($this->_REQUEST->userId);
        }
        $userType = "ONLINE";
        if($user && $user->getTable()=="users"){
            $role = $user->getRoleDetailsByUserId()->first();
            $roleName = strtoupper($role->role_name??"");
            $userType = Config::get("SystemConstant.USER-TYPE-SHORT-NAME.".$roleName);
        }
        $paymentStatus = 1;
        if(!in_array($this->_REQUEST->paymentMode,["CASH","ONLINE","CARD","UPI"])){
            $paymentStatus = 2;
        }
        $metaData = [
            "tranDate"=>$this->_tranDate,
            "ulbId"=>$this->_CONSUMER->ulb_id,
            "consumerId"=>$this->_CONSUMER->id,
            "wardMstrId"=>$this->_CONSUMER->ward_mstr_id,
            "payableAmt"=>$this->_REQUEST->amount,
            "userId"=> $user->id??null,
            "userType"=>$userType,
            "paymentStatus"=>$paymentStatus,
            "tranType"=>$this->_REQUEST->paymentType,
        ];
        $this->_REQUEST->merge($metaData);

    }

    private function adjustDemand($amount,$demandId){
        $currentDemand = collect($this->_DemandList)->where("id",$demandId)->values();
        $totalBalance = $currentDemand->sum("balance");
        $latePenalty = $currentDemand->sum("latePenalty");
        $totalTax = $totalBalance + $latePenalty;
        $paidAmount = $amount;
        $remainAmount = (float)roundFigure($amount - $totalTax);
        if($remainAmount > 0){
            $paidAmount = $totalTax;
        }
        if($remainAmount<=0){
            $remainAmount = 0;
        }
        $dueBalancePercent = $totalBalance /($totalTax== 0 ? 1 : $totalTax);
        $dueLatePenaltyPercent = $latePenalty /($totalTax== 0 ? 1 : $totalTax);        
        $paidTotalBalance = $paidAmount;

        
        $paidTotalBalanceTax = $paidAmount * $dueBalancePercent;
        $paidLatePenalty = $paidAmount * $dueLatePenaltyPercent;

        $total = $paidTotalBalanceTax + $paidLatePenalty  ;
        $returnData =  [
            "demandList" => $currentDemand,
            "demandId" => $demandId,
            "remainingAmount" => $remainAmount,
            "demand_from"=>$currentDemand->min("demand_from"),
            "demand_upto"=>$currentDemand->max("demand_upto"),
            "paid_late_penalty"=>roundFigure($paidLatePenalty),
            "paid_balance" => roundFigure($paidTotalBalanceTax),
            "totalTax"=> roundFigure($total),
        ];
        return $returnData;

    }


    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("demand_upto");
        $otherPenalty = $this->_Demand["otherPenalty"];
        $advanceAmount = $this->_Demand["advanceAmount"];
        

        $remainAmount = ($this->_REQUEST->amount + $advanceAmount ) - ( $otherPenalty) ;
        
        foreach($demandList as $demand){            
            if($remainAmount<=0){
                break;
            }
            $paidTax = $this->adjustDemand($remainAmount,$demand->id);
            $remainAmount = $paidTax["remainingAmount"];
            $paidDemand[] = $paidTax;
        }
        $OtherPenaltys = collect($this->_Demand["otherPenaltyList"]);
        $penalty = collect();
        $rebates = collect();
        $paidTotalLatePenalty = collect($paidDemand)->sum("paid_late_penalty");
        $fromDate = collect($paidDemand)->min("demand_from");
        $uptoDate = collect($paidDemand)->max("demand_upto");
        // dd($paidDemand);
        $metaData=[
            "fromDate"=>$fromDate,
            "uptoDate"=>$uptoDate,
            "chargeType"=>"Demand Collection",
            "penaltyAmt" => roundFigure($paidTotalLatePenalty +  $otherPenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("paid_balance")),
            "discountAmt" =>  roundFigure($advanceAmount),
            "request_demand_amount"=>roundFigure(collect($demandList)->sum("balance")),
            
        ];
        $this->_REQUEST->merge($metaData);
        if($paidTotalLatePenalty>0){
            $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalLatePenalty),"head_name"=>"Late Penalty"]);
        }
        
        $objWaterTran = new WaterTransaction();
        $objWaterCollection = new ConsumerDemandsCollection();
        $objTranFineRebate = new TransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();
        $objAdvance = new AdvanceDetail();
        $objAdjustment = new AdjustmentDetail();
        $test = collect();
        # insert Transaction
        $tranId = $objWaterTran->store($this->_REQUEST);
        if(!in_array($this->_REQUEST->paymentMode,["CASH","ONLINE","CARD","UPI"])){
            $chequeRequest = new Request();
            $chequeRequest->merge([
                "transaction_id"=>$tranId,
                "cheque_no"=>$this->_REQUEST->chequeNo,
                "cheque_date"=>$this->_REQUEST->chequeDate,
                "bank_name"=>$this->_REQUEST->bankName,
                "branch_name"=>$this->_REQUEST->branchName,
            ]);
            $chequeId = $objChequeDtl->store($chequeRequest);
        }
        # update demand and insert collection
        foreach($paidDemand as $paid){            
            $applicationDemand = ConsumerDemand::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "consumer_id"=>$applicationDemand->consumer_id,
                "consumer_demand_id"=>$paid["demandId"],
                "demand_from"=>$applicationDemand->demand_from,
                "demand_upto"=>$applicationDemand->demand_upto,
                "amount" => $paid["paid_balance"],
                "penalty"=>$paid["paid_late_penalty"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objWaterCollection->store($newRequest);
            $applicationDemand->paid_status = true ; 
            $applicationDemand->balance = ($applicationDemand->balance - $paid["paid_balance"]);
            if($applicationDemand->balance<=0){
                $applicationDemand->balance =0 ;
                $applicationDemand->is_full_paid = true;
            }        
            $applicationDemand->update();
            $test->push($applicationDemand);
        }

        #insert penalty and rebates
        foreach($penalty as $p){
            $newPenaltyRequest = new Request($p);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        
        foreach($OtherPenaltys as $p){
            $newPenaltyRequest = new Request($p);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"is_rebate"=>false]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        foreach($rebates as $r){
            $newPenaltyRequest = new Request($r);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"is_rebate"=>true]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        # Advance Adjust and new Advance Insert
        //Advance
        if($remainAmount>0){
            $advance=[
                "applicationId"=>$this->_REQUEST->applicationId,
                "applicationId"=>$this->_REQUEST->applicationId,
                "amount"=>$remainAmount,
                "reason"=>"Advance Payment",
                "transactionId"=>$tranId,
                "userId"=>$this->_REQUEST->userId,
            ];
            $newAdvanceRequest = new Request($advance);
            $objAdvance->store($newAdvanceRequest);
        }
        //Adjustment
        if($advanceAmount>0){
            $adjustment=[
                "applicationId"=>$this->_REQUEST->applicationId,
                "applicationId"=>$this->_REQUEST->applicationId,
                "amount"=>$advanceAmount,
                "transactionId"=>$tranId,
                "userId"=>$this->_REQUEST->userId,
            ];
            $newAdjustmentRequest = new Request($adjustment);
            $objAdjustment->store($newAdjustmentRequest);
        }
        
        // dd($objWaterTran->find($tranId),$objWaterCollection->where("transaction_id",$tranId)->get(),$objTranFineRebate->where("transaction_id",$tranId)->get(),$test);
        return[
            "tranId"=>$tranId
        ];
    }
}
