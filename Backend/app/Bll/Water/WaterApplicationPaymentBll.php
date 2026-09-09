<?php

namespace App\Bll\Water;

use App\Models\Citizen;
use App\Models\User;
use App\Models\Water\AdjustmentDetail;
use App\Models\Water\AdvanceDetail;
use App\Models\Water\ChequeDetail;
use App\Models\Water\ConnectionChargeCollection;
use App\Models\Water\TransactionFineRebateDetail;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterConnectionCharge;
use App\Models\Water\WaterTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class WaterApplicationPaymentBll
{
    public $_REQUEST;
    public $_APPId;
    public $_APPLICATION;
    public $_Demand;
    public $_DemandList;
    public $_tranDate;

    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_APPId = $request->id;
        $this->_tranDate = Carbon::parse($request->tranDate);
        $this->_APPLICATION = WaterActiveApplication::find($this->_APPId);
        if(!$this->_APPLICATION){
            $this->_APPLICATION = WaterApplication::find($this->_APPId);
        } 
        $waterApplicationDemandBll = new WaterApplicationDemandBll($this->_APPId,$this->_tranDate);
        $waterApplicationDemandBll->generateDemand();
        $this->_Demand = $waterApplicationDemandBll->_GRID;
        $this->_DemandList = $waterApplicationDemandBll->_GRID["demandList"];
        $this->setParams();
    }

    public function setParams(){
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
            "ulbId"=>$this->_APPLICATION->ulb_id,
            "applicationId"=>$this->_APPLICATION->id,
            "wardMstrId"=>$this->_APPLICATION->ward_mstr_id,
            "payableAmt"=>$this->_REQUEST->amount,
            "userId"=> $user->id??null,
            "userType"=>$userType,
            "paymentStatus"=>$paymentStatus,
            "tranType"=>$this->_REQUEST->paymentType,
        ];
        $this->_REQUEST->merge($metaData);

    }

    public function adjustDemand($amount,$demandId){
        $currentDemand = collect($this->_DemandList)->where("id",$demandId)->values();
        $totalBalance = $totalTax = $currentDemand->sum("amount");
        $connectionFee = $currentDemand->sum("conn_fee");
        $penalty = $currentDemand->sum("penalty");
        $discount = $currentDemand->sum("discount");
        $paidAmount = $amount;
        $remainAmount = $amount - $totalTax;
        if($remainAmount > 0){
            $paidAmount = $totalTax;
        }
        if($remainAmount<=0){
            $remainAmount = 0;
        }
        $dueBalancePercent = $totalBalance /($totalTax== 0 ? 1 : $totalTax);
        $dueConnectionFeePercent = $connectionFee /($totalTax== 0 ? 1 : $totalTax);
        $duePenaltyPercent = $penalty /($totalTax== 0 ? 1 : $totalTax);
        $dueDiscountPercent = $discount /($totalTax== 0 ? 1 : $totalTax);
        
        
        $paidTotalBalance = $paidAmount;

        
        $paidTotalBalanceTax = $paidAmount * $dueBalancePercent;
        $paidTotalConnectionFee = $paidAmount * $dueConnectionFeePercent;
        $paidPenalty = $paidAmount * $duePenaltyPercent;
        $paidDiscount = $paidAmount * $dueDiscountPercent;

        $total = $paidTotalConnectionFee + $paidPenalty  ;
            
        $returnData =  [
            "demandList" => $currentDemand,
            "demandId" => $demandId,
            "remainingAmount" => $remainAmount,
            "paid_penalty"=>roundFigure($paidPenalty),
            "paid_conn_fee" => roundFigure($paidTotalConnectionFee),
            "paid_discount"=>roundFigure($paidDiscount),
            "totalTax"=> roundFigure($total),
        ];
        return $returnData;

    }


    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("id");
        $connectionFee = $this->_Demand["connectionFee"];
        $realizationPenalty = $this->_Demand["realizationPenalty"];
        $otherPenalty = $this->_Demand["otherPenalty"];
        $advanceAmount = $this->_Demand["advanceAmount"];
        $discountAmount = $this->_Demand["discountAmount"];

        $remainAmount = ($this->_REQUEST->amount + $advanceAmount + $discountAmount) - ( $otherPenalty) ;
        
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
        $paidTotalMonthlyPenalty = collect($paidDemand)->sum("paid_penalty");
        $paidTotalDiscount = collect($paidDemand)->sum("paid_discount");
        $metaData=[
            "chargeType"=>collect($demandList)->first()["charge_for"]??"Application",
            "penaltyAmt" => roundFigure($paidTotalMonthlyPenalty +  $otherPenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("totalTax")),
            "discountAmt" =>  roundFigure($advanceAmount + $paidTotalDiscount),
            "request_demand_amount"=>roundFigure(collect($demandList)->sum("amount")),
            
        ];
        $this->_REQUEST->merge($metaData);
        if($paidTotalMonthlyPenalty>0){
            $penalty->push(["amount"=>roundFigure($paidTotalMonthlyPenalty),"head_name"=>"Regularization Penalty"]);
        }
        if($paidTotalDiscount>0){
            $rebates->push(["amount"=>roundFigure($paidTotalDiscount),"head_name"=>"Regularization 10% Discount"]);
        }

        $objWaterTran = new WaterTransaction();
        $objWaterCollection = new ConnectionChargeCollection();
        $objTranFineRebate = new TransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();
        $objAdvance = new AdvanceDetail();
        $objAdjustment = new AdjustmentDetail();
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
            $applicationDemand = WaterConnectionCharge::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "application_id"=>$this->_REQUEST->applicationId,
                "connection_charge_id"=>$paid["demandId"],
                "amount"=>$paid["totalTax"],
                "penalty" => $paid["paid_penalty"],
                "conn_fee"=>$paid["paid_conn_fee"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objWaterCollection->store($newRequest);
            $applicationDemand->paid_status = true ;            
            $applicationDemand->update();

        }

        #insert penalty and rebates
        foreach($penalty as $p){
            $newPenaltyRequest = new Request($p);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        
        foreach($OtherPenaltys as $p){
            $newPenaltyRequest = new Request($p);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId]);
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
        return[
            "tranId"=>$tranId
        ];
    }
}
