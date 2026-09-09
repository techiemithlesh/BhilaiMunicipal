<?php
namespace App\Bll\Property;

use App\Models\Citizen;
use App\Models\Property\AdjustmentDetail;
use App\Models\Property\AdvanceDetail;
use App\Models\Property\ChequeDetail;
use App\Models\Property\PropertyCollection;
use App\Models\Property\PropertyDemand;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyNotice;
use App\Models\Property\PropTransaction;
use App\Models\Property\TransactionFineRebateDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class PropertyPaymentBll{

    public $_REQUEST;
    public $_PROPId;
    public $_PROPERTY;
    public $_Demand;
    public $_DemandList;
    public $_tranDate;
    
    
    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_PROPId = $request->id;
        $this->_tranDate = Carbon::parse($request->tranDate);
        $this->_PROPERTY = PropertyDetail::find($this->_PROPId);
         
        $propDemandBll = new PropDemandBll($this->_PROPId,$this->_tranDate);
        $propDemandBll->getPropDue();
        $this->_Demand = $propDemandBll->_GRID;
        $this->_DemandList = $propDemandBll->_GRID["demandList"];
        $this->setParams();
    }

    public function setParams(){
        if(!$this->_REQUEST->amount){
            $this->_REQUEST->merge([
                "amount"=>$this->_Demand["totalPayableAmount"],
                "propertyPaidAmount"=>$this->_Demand["payableAmount"],
                "swmPaidAmount"=>$this->_Demand["swmPayableAmount"],
            ]);
        }
        if($this->_REQUEST->paymentType=="FULL"){
            $this->_REQUEST->merge([
                "amount"=>$this->_Demand["totalPayableAmount"],                
                "propertyPaidAmount"=>$this->_Demand["payableAmount"],
                "swmPaidAmount"=>$this->_Demand["swmPayableAmount"],
        ]);
        }
        if($this->_REQUEST->paymentType=="ARREAR"){
            $this->_REQUEST->merge([
                "amount"=>$this->_Demand["arrearPayableAmount"],
                "propertyPaidAmount"=>$this->_Demand["arrearPayableAmount"],
                "swmPaidAmount"      => 0,
            ]);
        }
        if($this->_REQUEST->paymentType=="PART"){
            $amount = roundFigure($this->_REQUEST->amount);

            // Cap amount to total payable
            $amount = min($amount, roundFigure($this->_Demand["totalPayableAmount"]));

            $proPayable = roundFigure($this->_Demand["payableAmount"]);
            $swmPayable = roundFigure($this->_Demand["swmPayableAmount"]);

            if ($amount <= $proPayable) {

                // Partial property payment only
                $propertyPaid = $amount;
                $swmPaid = 0;

            } else {

                // Property fully paid, remaining to SWM
                $propertyPaid = $proPayable;
                $remaining = roundFigure($amount - $proPayable);
                $swmPaid = min($remaining, $swmPayable);
            }

            $this->_REQUEST->merge([
                "amount"             => roundFigure($propertyPaid + $swmPaid),
                "propertyPaidAmount" => $propertyPaid,
                "swmPaidAmount"      => $swmPaid,
            ]);

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
            "ulbId"=>$this->_PROPERTY->ulb_id,
            "propertyDetailId"=>$this->_PROPERTY->id,
            "wardMstrId"=>$this->_PROPERTY->ward_mstr_id,
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
            "paid_balance_tax" => roundFigure($paidTotalBalanceTax),
            "paid_due_holding_tax"=> roundFigure($paidHoldingTax),
            "paid_due_water_tax" => roundFigure($paidWaterTax),
            "paid_due_education_cess_tax"=> roundFigure($paidEducationCessTax),
            "paid_due_health_cess_tax"=> roundFigure($paidHealthCessTax),
            "paid_due_latrine_tax"  => roundFigure($paidLatrineTax),
            "paid_due_rwh_tax" => roundFigure($paidRWH),
            "paid_due_fine_tax" => roundFigure($paidFineTax),
            "totalTax"=> roundFigure($total),
            "apidAmount"=>$paidAmount
        ];
        return $returnData;

    }

   
    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("fyear");
        $advanceAmount = $this->_Demand["advanceAmount"];
        $OtherPenalty = $this->_Demand["OtherPenalty"];
        $additionalTax =  $this->_Demand["additionalTax"];
        $rebateAmount = $this->_Demand["rebateAmount"];
        $specialRebate = $this->_Demand["specialRebate"];
        $noticePenalty = $this->_Demand["noticePenalty"];
        $noticeAdditionalPenalty = $this->_Demand["noticeAdditionalPenalty"];

        $remainAmount = ($this->_REQUEST->amount + $advanceAmount + $rebateAmount + $specialRebate ) - ( $OtherPenalty + $additionalTax + $noticePenalty + $noticeAdditionalPenalty ) ;
        
        foreach($demandList as $demand){            
            if($remainAmount<=0){
                break;
            }
            $paidTax = $this->adjustDemand($remainAmount,$demand->id);
            $remainAmount = $paidTax["remainingAmount"];
            $paidDemand[] = $paidTax;
        }
        $OtherPenaltys = collect($this->_Demand["otherPenaltyList"]);
        $additionalTaxList = collect($this->_Demand["additionalTaxList"]);
        $penalty = collect();
        $rebates = collect();
        $paidTotalMonthlyPenalty = collect($paidDemand)->sum("paid_monthly_penalty");
        $fromYear = collect($paidDemand)->min("fyear");
        $uptoYear = collect($paidDemand)->max("fyear");
        $fromQtr = collect($paidDemand)->where("fyear",$fromYear)->min("qtr");
        $uptoQtr = collect($paidDemand)->where("fyear",$uptoYear)->max("qtr");
        $metaData=[
            "penaltyAmt" => roundFigure($paidTotalMonthlyPenalty  + $OtherPenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("paid_balance_tax")),
            "discountAmt" =>  roundFigure($advanceAmount + $rebateAmount + $specialRebate),
            "fromFyear"=>$fromYear,
            "fromQtr" => $fromQtr,
            "uptoFyear" => $uptoYear,
            "uptoQtr"=> $uptoQtr,
        ];
        $this->_REQUEST->merge($metaData);
        if($paidTotalMonthlyPenalty>0){
            $penalty->push(["amount"=>roundFigure($paidTotalMonthlyPenalty),"head_name"=>"1.5% Monthly Penalty"]);
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
        $objPropCollection = new PropertyCollection();
        $objTranFineRebate = new TransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();
        $objPropNotice = new PropertyNotice();
        $objAdvance = new AdvanceDetail();
        $objAdjustment = new AdjustmentDetail();

        # insert Transaction
        $tranId = $objPropTran->store($this->_REQUEST);
        # deactivate All Demand Notice
        $notice = $objPropNotice
                ->where("property_detail_id",$this->_PROPERTY->id)
                ->where("notice_type","Demand")
                ->where("lock_status",false)
                ->where("is_clear",false)
                ->get();
        foreach($notice as $not){
            $not->clear_by_id = $tranId;
            $not->is_clear = true;
            $not->update();
        }
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
            $propDemand = PropertyDemand::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "property_detail_id"=>$this->_REQUEST->propertyDetailId,
                "property_demand_id"=>$paid["demandId"],
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
                "due_date"=>$propDemand->due_date,
                "fine_amt"=>$paid["paid_due_fine_tax"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objPropCollection->store($newRequest);

            # update demand
            $propDemand->balance_tax = $propDemand->balance_tax - $paid["paid_balance_tax"];
            $propDemand->due_holding_tax = $propDemand->due_holding_tax - $paid["paid_due_holding_tax"];
            $propDemand->due_latrine_tax = $propDemand->due_latrine_tax - $paid["paid_due_latrine_tax"];
            $propDemand->due_water_tax = $propDemand->due_water_tax - $paid["paid_due_water_tax"];
            $propDemand->due_health_cess_tax = $propDemand->due_health_cess_tax - $paid["paid_due_health_cess_tax"];
            $propDemand->due_education_cess_tax = $propDemand->due_education_cess_tax - $paid["paid_due_education_cess_tax"];
            $propDemand->due_rwh_tax = $propDemand->due_rwh_tax - $paid["paid_due_rwh_tax"];

            $propDemand->paid_status = true ;
            if($propDemand->balance_tax<=0){
                $propDemand->is_full_paid = true;
            }
            
            $propDemand->update();

        }

        #insert penalty and rebates
        foreach($penalty as $p){
            $newPenaltyRequest = new Request($p);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        
        foreach($OtherPenaltys as $p){
            $newPenaltyRequest = new Request();
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"amount"=>$p->penalty_amt,"headName"=>$p->penalty_type,"is_rebate"=>false]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
            $p->transaction_id = $tranId;
            $p->paid_status =true;
            $p->update();
        }

        foreach($additionalTaxList as $tax){
            $tax->transaction_id = $tranId;
            $tax->paid_status =true;
            $tax->update();
        }
        if($noticePenalty>0){
            $newPenaltyRequest = new Request();
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"amount"=>$noticePenalty,"headName"=>"Notice Penalty","is_rebate"=>false]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        if($noticeAdditionalPenalty>0){
            $newPenaltyRequest = new Request();
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"amount"=>$noticeAdditionalPenalty,"headName"=>"2 % Notice Penalty","is_rebate"=>false]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        foreach($rebates as $r){
            $newPenaltyRequest = new Request($r);
            $newPenaltyRequest->merge(["transaction_id"=>$tranId,"is_rebate"=>true]);
            $id = $objTranFineRebate->store($newPenaltyRequest);
        }
        
        #==========swm Payment==============
        if($remainAmount>0){
            foreach($this->_Demand["swmConsumers"] as $key=>$consumer){
                $newSwmRequest = new Request(["id"=>$consumer["consumer"]["id"],"propTranId"=>$tranId,"tranDate"=>$this->_REQUEST->tranDate,"paymentMode"=>$this->_REQUEST->paymentMode]);
                $swmPaidAmount = $consumer["payableAmount"];
                if($remainAmount<=$consumer["payableAmount"]){
                    $swmPaidAmount = $remainAmount;
                    $remainAmount =0;
                }else{
                    $remainAmount -= $consumer["payableAmount"];
                }
                $newSwmRequest->merge(["amount"=>$swmPaidAmount,"paymentType"=>($consumer["payableAmount"]==$swmPaidAmount ? "FULL":"PART")]);
                if($swmPaidAmount<0){
                    break;
                }
                $objSwmPaymentBll = new SwmPaymentBll($newSwmRequest);
                $objSwmPaymentBll->payNow();                
            }
        } 
        # Advance Adjust and new Advance Insert
        //Advance
        if($remainAmount>0){
            $advance=[
                "property_detail_id"=>$this->_PROPERTY->id,
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
                "property_detail_id"=>$this->_PROPERTY->id,
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