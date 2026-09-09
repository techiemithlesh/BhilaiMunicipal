<?php
namespace App\Bll\Property;

use App\Models\Citizen;
use App\Models\Property\SwmChequeDetail;
use App\Models\Property\SwmConsumer;
use App\Models\Property\SwmConsumerDemand;
use App\Models\Property\SwmConsumerDemandsCollection;
use App\Models\Property\SwmConsumerTransaction;
use App\Models\Property\SwmConsumerTransactionFineRebateDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class SwmPaymentBll{

    public $_REQUEST;
    public $_PropTranId;
    public $_SWMId;
    public $_SwmConsumer;
    public $_Demand;
    public $_DemandList;
    public $_tranDate;

    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_SWMId = $request->id;
        $this->_PropTranId = $request->propTranId;
        $this->_tranDate = Carbon::parse($request->tranDate);
        $this->_SwmConsumer = SwmConsumer::find($this->_SWMId);
         
        $swmDemandBll = new SwmDemandBll($this->_SWMId,$this->_tranDate);
        $swmDemandBll->getConsumerDue();
        $this->_Demand = $swmDemandBll->_GRID;
        $this->_DemandList = $swmDemandBll->_GRID["demandList"];
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
            "propTransactionId"=>$this->_PropTranId,
            "consumerId"=>$this->_SwmConsumer->id,
            "payableAmt"=>$this->_REQUEST->amount,
            "userId"=> $user->id??null,
            "userType"=>$userType,
            "paymentStatus"=>$paymentStatus,
            "tranType"=>$this->_REQUEST->paymentType,
            "requestDemandAmount"=>$this->_Demand["payableAmount"],
        ];
        $this->_REQUEST->merge($metaData);

    }

    public function adjustDemand($amount,$demandId){
        $currentDemand = collect($this->_DemandList)->where("id",$demandId)->values();
        $totalBalance = $currentDemand->sum("balance");
        $totalMonthlyPenalty = $currentDemand->sum("monthlyPenalty");
        $totalTax = $totalBalance + $totalMonthlyPenalty;
        $paidAmount = $amount;
        $remainAmount = $amount - $totalTax;
        if($remainAmount > 0){
            $paidAmount = $totalTax;
        }
        if($remainAmount<=0){
            $remainAmount = 0;
        }
        $dueBalancePercent = $totalBalance /($totalTax== 0 ? 1 : $totalTax);
        $dueTotalMonthlyPenaltyPercent = $totalMonthlyPenalty /($totalTax== 0 ? 1 : $totalTax);

        $paidTotalBalance = $paidAmount;
        
        $paidTotalBalanceTax = $paidAmount * $dueBalancePercent;
        $paidTotalMonthlyPenaltyTax = $paidAmount * $dueTotalMonthlyPenaltyPercent;

        $total = $paidTotalBalance ;
            
        $returnData =  [
            "demandList" => $currentDemand,
            "demandId" => $demandId,
            "remainingAmount" => $remainAmount,
            "paid_monthly_penalty"=>roundFigure($paidTotalMonthlyPenaltyTax),
            "paid_balance" => roundFigure($paidTotalBalance),
            "totalTax"=> roundFigure($total),
            "fromDate"=>$currentDemand->max("demand_from"),
            "uptoDate"=>$currentDemand->max("demand_upto"),
        ];
        return $returnData;

    }

    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("demand_from");
        $advanceAmount = $this->_Demand["advanceAmount"];
        $OtherPenalty = $this->_Demand["OtherPenalty"];

        $remainAmount = ($this->_REQUEST->amount + $advanceAmount ) - ( $OtherPenalty ) ;
        
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
        $paidTotalMonthlyPenalty = collect($paidDemand)->sum("paid_monthly_penalty");
        $fromDate = collect($paidDemand)->min("fromDate");
        $uptoDate = collect($paidDemand)->max("uptoDate");
        $metaData=[
            "penaltyAmt" => roundFigure($paidTotalMonthlyPenalty  + $OtherPenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("paid_balance_tax")),
            "discountAmt" =>  roundFigure($advanceAmount),
            "fromDate"=>$fromDate,
            "uptoDate" => $uptoDate,
        ];
        $this->_REQUEST->merge($metaData);
        if($paidTotalMonthlyPenalty>0){
            $penalty->push(["amount"=>roundFigure($paidTotalMonthlyPenalty),"head_name"=>"Monthly Penalty"]);
        }
        
        

        $objSwmTran = new SwmConsumerTransaction();
        $objSwmCollection = new SwmConsumerDemandsCollection();
        $objSwmTranFineRebate = new SwmConsumerTransactionFineRebateDetail();
        $objSwmChequeDtl = new SwmChequeDetail();

        # insert Transaction
        $tranId = $objSwmTran->store($this->_REQUEST);
        
        if(!in_array($this->_REQUEST->paymentMode,["CASH","ONLINE","CARD","UPI"])){
            $chequeRequest = new Request();
            $chequeRequest->merge([
                "transaction_id"=>$tranId,
                "cheque_no"=>$this->_REQUEST->chequeNo,
                "cheque_date"=>$this->_REQUEST->chequeDate,
                "bank_name"=>$this->_REQUEST->bankName,
                "branch_name"=>$this->_REQUEST->branchName,
            ]);
            $chequeId = $objSwmChequeDtl->store($chequeRequest);
        }

        # update demand and insert collection
        foreach($paidDemand as $paid){            
            $swmDemand = SwmConsumerDemand::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "consumerId"=>$this->_REQUEST->consumerId,
                "consumerDemandId"=>$paid["demandId"],
                "demand_from"=>$swmDemand["demand_from"],
                "demand_upto" => $swmDemand["demand_upto"],
                "amount"=>$paid["paid_balance"],
                "penalty"=>$paid["paid_monthly_penalty"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objSwmCollection->store($newRequest);

            # update demand
            $swmDemand->balance = $swmDemand->balance - $paid["paid_balance"];

            $swmDemand->paid_status = true ;
            if($swmDemand->balance<=0){
                $swmDemand->is_full_paid = true;
            }
            $swmDemand->update();

        }

        #insert penalty and rebates
        foreach($penalty as $p){
            $newPenaltyRequest = new Request($p);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId]);
            $id = $objSwmTranFineRebate->store($newPenaltyRequest);
        }
        
        foreach($OtherPenaltys as $p){
            $newPenaltyRequest = new Request();
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"amount"=>$p->penalty_amt,"headName"=>$p->penalty_type,"is_rebate"=>false]);
            $id = $objSwmTranFineRebate->store($newPenaltyRequest);
            $p->transaction_id = $tranId;
            $p->paid_status =true;
            $p->update();
        }
        foreach($rebates as $r){
            $newPenaltyRequest = new Request($r);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"is_rebate"=>true]);
            $id = $objSwmTranFineRebate->store($newPenaltyRequest);
        }
        return[
            "tranId"=>$tranId
        ];
    }
}