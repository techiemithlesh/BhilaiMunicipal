<?php

namespace App\Bll\Property;

use App\Models\Citizen;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ChequeDetail;
use App\Models\Property\PropTransaction;
use App\Models\Property\SafCollection;
use App\Models\Property\SafDemand;
use App\Models\Property\SafDetail;
use App\Models\Property\TransactionFineRebateDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

class SafPaymentBll {

    public $_REQUEST;
    public $_SAFId;
    public $_SAF;
    public $_Demand;
    public $_DemandList;
    public $_tranDate;
    
    
    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_SAFId = $request->id;
        $this->_tranDate = Carbon::parse($request->tranDate);
        $this->_SAF = ActiveSafDetail::find($this->_SAFId);
        if(!$this->_SAF){
            $this->_SAF = SafDetail::find($this->_SAFId);
        } 
        $safDemandBll = new SafDemandBll($this->_SAFId,$this->_tranDate);
        $safDemandBll->getSafDue();
        $this->_Demand = $safDemandBll->_GRID;
        $this->_DemandList = $safDemandBll->_GRID["demandList"];
        $this->setParams();
    }

    public function setParams(){
        if(!$this->_REQUEST->amount){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["payableAmount"]]);
        }
        if($this->_REQUEST->paymentType=="FULL"){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["payableAmount"]]);
        }
        if($this->_REQUEST->paymentType=="ARREAR"){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["arrearPayableAmount"]]);
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
            "ulbId"=>$this->_SAF->ulb_id,
            "safDetailId"=>$this->_SAF->id,
            "wardMstrId"=>$this->_SAF->ward_mstr_id,
            "payableAmt"=>$this->_REQUEST->amount,
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
        $totalBalance = $currentDemand->sum("balance_tax");
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
        
        $dueHoldingTaxPercent = $currentDemand->sum("due_holding_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        $dueLatrineTaxPercent = $currentDemand->sum("due_latrine_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        $dueWaterTaxPercent = $currentDemand->sum("due_water_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        $dueHealthCessTaxPercent = $currentDemand->sum("due_health_cess_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        $dueEducationCessTaxPercent = $currentDemand->sum("due_education_cess_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        $dueRWHPercent = $currentDemand->sum("due_rwh_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        $dueFineTaxPercent = $currentDemand->sum("due_fine_tax")/($totalBalance == 0 ? 1 : $totalBalance);
        
        $paidTotalBalance = $paidAmount;

        
        $paidTotalBalanceTax = $paidAmount * $dueBalancePercent;
        $paidTotalMonthlyPenaltyTax = $paidAmount * $dueTotalMonthlyPenaltyPercent;

        $paidHoldingTax = ($paidTotalBalanceTax * $dueHoldingTaxPercent);
        $paidLatrineTax = $paidTotalBalanceTax * $dueLatrineTaxPercent ;
        $paidWaterTax = $paidTotalBalanceTax * $dueWaterTaxPercent ;
        $paidHealthCessTax = $paidTotalBalanceTax * $dueHealthCessTaxPercent ;
        $paidEducationCessTax = $paidTotalBalanceTax * $dueEducationCessTaxPercent ;
        $paidRWH = $paidTotalBalanceTax * $dueRWHPercent ;
        $paidFineTax = $paidTotalBalanceTax * $dueFineTaxPercent ;

        $total = $paidHoldingTax + $paidLatrineTax + $paidWaterTax + $paidHealthCessTax + $paidEducationCessTax + $paidRWH + $paidFineTax ;
            
        $returnData =  [
            "demandList" => $currentDemand,
            "demandId" => $demandId,
            "fyear"=>$currentDemand->max("fyear"),
            "qtr"=>$currentDemand->max("qtr"),
            "remainingAmount" => $remainAmount,
            "paid_monthly_penalty"=>roundFigure($paidTotalMonthlyPenaltyTax),
            "paid_balance_tax" => roundFigure($paidTotalBalance),
            "paid_due_holding_tax"=> roundFigure($paidHoldingTax),
            "paid_due_water_tax" => roundFigure($paidWaterTax),
            "paid_due_education_cess_tax"=> roundFigure($paidEducationCessTax),
            "paid_due_health_cess_tax"=> roundFigure($paidHealthCessTax),
            "paid_due_latrine_tax"  => roundFigure($paidLatrineTax),
            "paid_due_rwh_tax" => roundFigure($paidRWH),
            "paid_due_fine_tax" => roundFigure($paidFineTax),
            "totalTax"=> roundFigure($total),
        ];
        return $returnData;

    }

   
    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("fyear");
        $lateAssessmentPenalty = $this->_Demand["lateAssessmentPenalty"];
        $advanceAmount = $this->_Demand["advanceAmount"];
        $OtherPenalty = $this->_Demand["OtherPenalty"];
        $rebateAmount = $this->_Demand["rebateAmount"];
        $specialRebate = $this->_Demand["specialRebate"];

        $remainAmount = ($this->_REQUEST->amount + $advanceAmount + $rebateAmount + $specialRebate ) - ($lateAssessmentPenalty + $OtherPenalty) ;
        
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
        $fromYear = collect($paidDemand)->min("fyear");
        $uptoYear = collect($paidDemand)->max("fyear");
        $fromQtr = collect($paidDemand)->where("fyear",$fromYear)->min("qtr");
        $uptoQtr = collect($paidDemand)->where("fyear",$uptoYear)->max("qtr");
        $metaData=[
            "penaltyAmt" => roundFigure($paidTotalMonthlyPenalty + $lateAssessmentPenalty + $OtherPenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("paid_balance_tax")),
            "discountAmt" =>  roundFigure($advanceAmount + $rebateAmount + $specialRebate),
            "fromFyear"=>$fromYear,
            "fromQtr" => $fromQtr,
            "uptoFyear" => $uptoYear,
            "uptoQtr"=> $uptoQtr,
        ];
        $this->_REQUEST->merge($metaData);
        if($paidTotalMonthlyPenalty>0){
            $penalty->push(["amount"=>roundFigure($paidTotalMonthlyPenalty),"head_name"=>"1% Monthly Penalty"]);
        }
        if($lateAssessmentPenalty>0){
            $penalty->push(["amount"=>roundFigure($lateAssessmentPenalty),"head_name"=>"Late Assessment Fine"]);
        }
        if($rebateAmount>0){
            if($this->_Demand["firstQuatreRebate"]>0 && $this->_REQUEST->amount >= $this->_Demand["payableAmount"]){
                $rebates->push(["amount"=>roundFigure($this->_Demand["firstQuatreRebate"]),"head_name"=>"First Qtr Rebate"]);
            }
            if($this->_Demand["onlineRebate"]>0){
                $rebates->push(["amount"=>roundFigure($this->_Demand["onlineRebate"]),"head_name"=>"Online Rebate"]);
            }
            if($this->_Demand["jskRebate"]>0){
                $rebates->push(["amount"=>roundFigure($this->_Demand["jskRebate"]),"head_name"=>"JSK Rebate"]);
            }
        }
        if($specialRebate>0){
            $rebates->push(["amount"=>roundFigure($specialRebate),"head_name"=>"Special Rebate"]);
        }

        $objPropTran = new PropTransaction();
        $objSafCollection = new SafCollection();
        $objTranFineRebate = new TransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();

        # insert Transaction
        $tranId = $objPropTran->store($this->_REQUEST);
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
            $safDemand = SafDemand::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "saf_detail_id"=>$this->_REQUEST->safDetailId,
                "saf_demand_id"=>$paid["demandId"],
                "fyear"=>$paid["fyear"],
                "qtr" => $paid["qtr"],
                "total_tax"=>$paid["paid_balance_tax"],
                "holding_tax"=>$paid["paid_due_holding_tax"],
                "latrine_tax"=>$paid["paid_due_latrine_tax"],
                "water_tax"=>$paid["paid_due_water_tax"],
                "health_cess_tax"=>$paid["paid_due_health_cess_tax"],
                "education_cess_tax"=>$paid["paid_due_education_cess_tax"],
                "rwh_tax"=>$paid["paid_due_rwh_tax"],

                
                "fine_months"=>$paid["monthDiff"]??null,
                "due_date"=>$safDemand->due_date,
                "fine_amt"=>$paid["paid_due_fine_tax"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objSafCollection->store($newRequest);

            # update demand
            $safDemand->balance_tax = $safDemand->balance_tax - $paid["paid_balance_tax"];
            $safDemand->due_holding_tax = $safDemand->due_holding_tax - $paid["paid_due_holding_tax"];
            $safDemand->due_latrine_tax = $safDemand->due_latrine_tax - $paid["paid_due_latrine_tax"];
            $safDemand->due_water_tax = $safDemand->due_water_tax - $paid["paid_due_water_tax"];
            $safDemand->due_health_cess_tax = $safDemand->due_health_cess_tax - $paid["paid_due_health_cess_tax"];
            $safDemand->due_education_cess_tax = $safDemand->due_education_cess_tax - $paid["paid_due_education_cess_tax"];
            $safDemand->due_rwh_tax = $safDemand->due_rwh_tax - $paid["paid_due_rwh_tax"];

            $safDemand->paid_status = true ;
            if($safDemand->balance_tax<=0){
                $safDemand->is_full_paid = true;
            }
            $safDemand->update();

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
        return[
            "tranId"=>$tranId
        ];
    }
}