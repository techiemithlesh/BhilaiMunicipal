<?php

namespace App\Bll\Lease;

use App\Models\Citizen;
use App\Models\Lease\AdjustmentDetail;
use App\Models\Lease\AdvanceDetail;
use App\Models\Lease\ChequeDetail;
use App\Models\Lease\Lease;
use App\Models\Lease\LeaseCollection;
use App\Models\Lease\LeaseDemand;
use App\Models\Lease\LeaseTransaction;
use App\Models\Lease\LeaseTransactionFineRebateDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

class LeasePaymentBll
{
    public $_REQ;
    public $_APPId;
    public $_Lease;
    public $_Demand;
    public $_DemandList;
    public $_tranDate;
    public $_demandUpto;

    public function __construct($request)
    {
        $this->_REQ = $request;
        $this->_APPId = $request->id;
        $this->_tranDate = Carbon::parse($request->tranDate)->format("Y-m-d");
        $this->_demandUpto = $request->demandUpto;
        $this->_Lease = Lease::find($this->_APPId);
       
        $ConsumerDueBll = new LeaseDueBll($this->_APPId,$this->_tranDate,$request->fyear??null);
        $ConsumerDueBll->getConsumerDue();
        $this->_Demand = $ConsumerDueBll->_GRID;
        $this->_DemandList = $ConsumerDueBll->_GRID["demandList"];
        $this->setParams();
    }

    private function setParams(){
        if(!$this->_REQ->amount){
            $this->_REQ->merge(["amount"=>$this->_Demand["payableAmount"]]);
        }
        if($this->_REQ->paymentType=="FULL"){
            $this->_REQ->merge(["amount"=>$this->_Demand["payableAmount"]]);
        }

        $user = Auth::user();

        if($this->_REQ->userId && $this->_REQ->typeOfUser=="citizens"){
            $user = Citizen::find($this->_REQ->userId);
        }
        if($this->_REQ->userId && $this->_REQ->typeOfUser!="citizens"){
            $user = User::find($this->_REQ->userId);
        }
        $userType = "ONLINE";
        if($user && $user->getTable()=="users"){
            $role = $user->getRoleDetailsByUserId()->first();
            $roleName = strtoupper($role->role_name??"");
            $userType = $roleName;
        }
        $paymentStatus = 1;
        if(!in_array($this->_REQ->paymentMode,["CASH","ONLINE","CARD","UPI"])){
            $paymentStatus = 2;
        }
        $metaData = [
            "tranDate"=>$this->_tranDate,
            "ulbId"=>$this->_Lease->ulb_id,
            "leaseId"=>$this->_Lease->id,
            "wardMstrId"=>$this->_Lease->ward_mstr_id,
            "prevGst"=>roundFigure(($this->_REQ->prevGstAmt??0)),
            "payableAmt"=>roundFigure($this->_REQ->amount +  ($this->_REQ->prevGstAmt??0)),
            "userId"=> $user->id??null,
            "userType"=>$userType,
            "paymentStatus"=>$paymentStatus,
            "tranType"=>$this->_REQ->paymentType,
        ];
        $this->_REQ->merge($metaData);

    }

    private function adjustDemand($amount,$demandId){
        $currentDemand = collect($this->_DemandList)->where("id",$demandId)->values();
        $totalBalance = $currentDemand->sum("balance");
        $totalPenalty = $currentDemand->sum("due_penalty");

        $latePenalty = $currentDemand->sum("latePenalty");
        $cgstTax = $currentDemand->sum("cgst");
        $sgstTax = $currentDemand->sum("sgst");

        $cgstTaxWeaveOff = $currentDemand->sum("cgst_weave_off");
        $sgstTaxWeaveOff = $currentDemand->sum("sgst_weave_off");

        $totalTax = (($totalBalance + $latePenalty +  $cgstTax + $sgstTax)-($cgstTaxWeaveOff+$sgstTaxWeaveOff)) ;
        $paidAmount = $amount;
        $remainAmount = (float)roundFigure($amount - $totalTax);
        if($remainAmount > 0){
            $paidAmount = $totalTax;
        }
        if($remainAmount<=0){
            $remainAmount = 0;
        }
        $dueBalancePercent = $totalBalance /($totalTax== 0 ? 1 : $totalTax);
        $duePenaltyPercent = $totalPenalty/($totalBalance == 0 ? 1 : $totalBalance); 

        $dueLatePenaltyPercent = $latePenalty /($totalTax== 0 ? 1 : $totalTax);
        $dueCgstTaxPercent = $cgstTax /($totalTax== 0 ? 1 : $totalTax);        
        $dueSgstTaxPercent = $sgstTax /($totalTax== 0 ? 1 : $totalTax);  

        $dueCgstTaxWeaveOffPercent = $cgstTaxWeaveOff /($totalTax== 0 ? 1 : $totalTax);        
        $dueSgstTaxWeaveOffPercent = $sgstTaxWeaveOff /($totalTax== 0 ? 1 : $totalTax);  

        
        $paidTotalBalanceTax = $paidAmount * $dueBalancePercent;
        $paidPenalty = $duePenaltyPercent * $dueBalancePercent;

        $paidLatePenalty = $paidAmount * $dueLatePenaltyPercent;
        $paidCgstTax = $paidAmount * $dueCgstTaxPercent;
        $paidSgstTax = $paidAmount * $dueSgstTaxPercent;

        $paidCgstTaxWeaveOff = $paidAmount * $dueCgstTaxWeaveOffPercent;
        $paidSgstTaxWeaveOff = $paidAmount * $dueSgstTaxWeaveOffPercent;

        $total = (($paidTotalBalanceTax + $paidLatePenalty  + $paidCgstTax + $paidSgstTax) - ($paidCgstTaxWeaveOff + $paidSgstTaxWeaveOff)) ;
        $returnData =  [
            "demandList" => $currentDemand,
            "demandId" => $demandId,
            "remainingAmount" => $remainAmount,
            "fyear"=>$currentDemand->min("fyear"),

            "paid_balance" => roundFigure($paidTotalBalanceTax),
            "paid_amount" => roundFigure($paidAmount),
            "paid_penalty" => roundFigure($paidPenalty),

            "paid_late_penalty"=>roundFigure($paidLatePenalty),
            "paid_cgst_tax"=>roundFigure($paidCgstTax),
            "paid_sgst_tax"=>roundFigure($paidSgstTax),

            "paid_cgst_tax_weave_off"=>roundFigure($paidCgstTaxWeaveOff),
            "paid_sgst_tax_weave_off"=>roundFigure($paidSgstTaxWeaveOff),

            "totalTax"=> roundFigure($total),
        ];
        return $returnData;

    }


    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("demand_upto");
        $advanceAmount = $this->_Demand["advanceAmount"];        
        $additionalTaxList = collect($this->_Demand["additionalTaxList"]);
        

        $remainAmount = ($this->_REQ->amount + $advanceAmount ) ;
        
        foreach($demandList as $demand){            
            if($remainAmount<=0){
                break;
            }
            $paidTax = $this->adjustDemand($remainAmount,$demand->id);
            $remainAmount = $paidTax["remainingAmount"];
            $paidDemand[] = $paidTax;
        }
        $penalty = collect();
        $rebates = collect();
        $paidTotalLatePenalty = collect($paidDemand)->sum("paid_late_penalty");
        $paidTotalCgstTax = collect($paidDemand)->sum("paid_cgst_tax");
        $paidTotalSgstTax = collect($paidDemand)->sum("paid_sgst_tax");
        $paidTotalCgstTaxWeaveOff = collect($paidDemand)->sum("paid_cgst_tax_weave_off");
        $paidTotalSgstTaxWeaveOff = collect($paidDemand)->sum("paid_sgst_tax_weave_off");
        $fromDate = collect($paidDemand)->min("fyear");
        $uptoDate = collect($paidDemand)->max("fyear");
        $metaData=[
            "fromYear"=>$fromDate,
            "uptoYear"=>$uptoDate,
            "govTaxAmt"=>roundFigure($paidTotalCgstTax + $paidTotalSgstTax),
            "weaveOffGstTaxAmt"=>roundFigure($paidTotalCgstTaxWeaveOff + $paidTotalSgstTaxWeaveOff),
            "penaltyAmt" => roundFigure($paidTotalLatePenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("paid_balance")),
            "discountAmt" =>  roundFigure($advanceAmount),
            "request_demand_amount"=>roundFigure(collect($demandList)->sum("balance")),
            
        ];
        $this->_REQ->merge($metaData);
        if($paidTotalLatePenalty>0){
            $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalLatePenalty),"head_name"=>"Penalty"]);
        }
        if(($paidTotalCgstTax + $paidTotalSgstTax)!=0){
            $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalCgstTax),"head_name"=>"CGST"]);
            $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalSgstTax),"head_name"=>"SGST"]);
        }

        if(($paidTotalCgstTaxWeaveOff + $paidTotalSgstTaxWeaveOff)!=0){
            $penalty->push(["is_rebate"=>true,"amount"=>roundFigure($paidTotalCgstTaxWeaveOff),"head_name"=>"Weave Off CGST"]);
            $penalty->push(["is_rebate"=>true,"amount"=>roundFigure($paidTotalSgstTaxWeaveOff),"head_name"=>"Weave Off SGST"]);
        }

        

        
        
        $objLeaseTran = new LeaseTransaction();
        $objLeaseCollection = new LeaseCollection();
        $objTranFineRebate = new LeaseTransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();
        $objAdvance = new AdvanceDetail();
        $objAdjustment = new AdjustmentDetail();
        $test = collect();
        # insert Transaction
        $tranId = $objLeaseTran->store($this->_REQ);
        
        if(!in_array($this->_REQ->paymentMode,["CASH","ONLINE","CARD","UPI"])){
            $chequeRequest = new Request();
            $chequeRequest->merge([
                "transaction_id"=>$tranId,
                "cheque_no"=>$this->_REQ->chequeNo,
                "cheque_date"=>$this->_REQ->chequeDate,
                "bank_name"=>$this->_REQ->bankName,
                "branch_name"=>$this->_REQ->branchName,
            ]);
            $chequeId = $objChequeDtl->store($chequeRequest);
        }
        # update demand and insert collection
        foreach($paidDemand as $paid){            
            $leaseDemand = LeaseDemand::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "lease_id"=>$leaseDemand->lease_id,
                "lease_demand_id"=>$paid["demandId"],
                "fyear"=>$leaseDemand->fyear,
                "amount" => $paid["paid_amount"],
                "penalty" => $paid["paid_penalty"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objLeaseCollection->store($newRequest);
            $leaseDemand->paid_status = true ; 
            $leaseDemand->balance = ($leaseDemand->balance - $paid["paid_balance"]);
            $leaseDemand->due_penalty = ($leaseDemand->due_penalty - $paid["paid_penalty"]);
            if($leaseDemand->balance<=0){
                $leaseDemand->balance =0 ;
                $leaseDemand->is_full_paid = true;
            }        
            $leaseDemand->update();
            $test->push($leaseDemand);
        }
        # update Additional Tax
        foreach($additionalTaxList as $tax){
            $tax->transaction_id = $tranId;
            $tax->paid_status =true;
            $tax->update();
        }

        #insert penalty and rebates
        foreach($penalty as $p){
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
                "lease_id"=>$this->_REQ->leaseId,
                "amount"=>$remainAmount,
                "reason"=>"Advance Payment",
                "transactionId"=>$tranId,
                "userId"=>$this->_REQ->userId,
            ];
            $newAdvanceRequest = new Request($advance);
            $objAdvance->store($newAdvanceRequest);
        }
        //Adjustment
        if($advanceAmount>0){
            $adjustment=[
                "lease_id"=>$this->_REQ->leaseId,
                "amount"=>$advanceAmount,
                "transactionId"=>$tranId,
                "userId"=>$this->_REQ->userId,
            ];
            $newAdjustmentRequest = new Request($adjustment);
            $objAdjustment->store($newAdjustmentRequest);
        }
        
        return[
            "tranId"=>$tranId
        ];
    }
}
