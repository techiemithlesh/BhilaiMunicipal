<?php

namespace App\Bll\ShopRent;

use App\Models\Citizen;
use App\Models\ShopRent\AdjustmentDetail;
use App\Models\ShopRent\AdvanceDetail;
use App\Models\ShopRent\ChequeDetail;
use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopCollection;
use App\Models\ShopRent\ShopDemand;
use App\Models\ShopRent\ShopTransaction;
use App\Models\ShopRent\TransactionFineRebateDetail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

class ShopPaymentBll
{
    public $_REQ;
    public $_APPId;
    public $_Shop;
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
        $this->_Shop = Shop::find($this->_APPId);
       
        $ConsumerDueBll = new ShopDueBll($this->_APPId,$this->_tranDate,$request->demandUpto);
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
            $userType = Config::get("SystemConstant.USER-TYPE-SHORT-NAME.".$roleName);
        }
        $paymentStatus = 1;
        if(!in_array($this->_REQ->paymentMode,["CASH","ONLINE","CARD","UPI"])){
            $paymentStatus = 2;
        }
        $metaData = [
            "tranDate"=>$this->_tranDate,
            "ulbId"=>$this->_Shop->ulb_id,
            "shopId"=>$this->_Shop->id,
            "wardMstrId"=>$this->_Shop->ward_mstr_id,
            "payableAmt"=>$this->_REQ->amount,
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
        $totalAmount = $currentDemand->sum("due_amount");
        $totalPenalty = $currentDemand->sum("due_penalty");

        $latePenalty = $currentDemand->sum("latePenalty");
        $serviceTax = $currentDemand->sum("serviceTax");
        $cgstTax = $currentDemand->sum("cgst");
        $sgstTax = $currentDemand->sum("sgst");

        $totalTax = $totalBalance + $latePenalty + $serviceTax + $cgstTax + $sgstTax ;
        $paidAmount = $amount;
        $remainAmount = (float)roundFigure($amount - $totalTax);
        if($remainAmount > 0){
            $paidAmount = $totalTax;
        }
        if($remainAmount<=0){
            $remainAmount = 0;
        }
        $dueBalancePercent = $totalBalance /($totalTax== 0 ? 1 : $totalTax);
        $dueAmountPercent = $totalAmount/($totalBalance == 0 ? 1 : $totalBalance);
        $duePenaltyPercent = $totalPenalty/($totalBalance == 0 ? 1 : $totalBalance); 

        $dueLatePenaltyPercent = $latePenalty /($totalTax== 0 ? 1 : $totalTax);
        $dueServiceTaxPercent = $serviceTax /($totalTax== 0 ? 1 : $totalTax);
        $dueCgstTaxPercent = $cgstTax /($totalTax== 0 ? 1 : $totalTax);        
        $dueSgstTaxPercent = $sgstTax /($totalTax== 0 ? 1 : $totalTax);   

        $paidTotalBalance = $paidAmount;

        
        $paidTotalBalanceTax = $paidAmount * $dueBalancePercent;
        $paidAmount = $paidTotalBalanceTax * $dueAmountPercent;
        $paidPenalty = $duePenaltyPercent * $dueBalancePercent;

        $paidLatePenalty = $paidAmount * $dueLatePenaltyPercent;
        $paidServiceTax = $paidAmount * $dueServiceTaxPercent;
        $paidCgstTax = $paidAmount * $dueCgstTaxPercent;
        $paidSgstTax = $paidAmount * $dueSgstTaxPercent;

        $total = $paidTotalBalanceTax + $paidLatePenalty + $paidServiceTax + $paidCgstTax + $paidSgstTax ;
        $returnData =  [
            "demandList" => $currentDemand,
            "demandId" => $demandId,
            "remainingAmount" => $remainAmount,
            "demand_from"=>$currentDemand->min("demand_from"),
            "demand_upto"=>$currentDemand->max("demand_upto"),

            "paid_balance" => roundFigure($paidTotalBalanceTax),
            "paid_amount" => roundFigure($paidAmount),
            "paid_penalty" => roundFigure($paidPenalty),

            "paid_late_penalty"=>roundFigure($paidLatePenalty),
            "paid_service_tax"=>roundFigure($paidServiceTax),
            "paid_cgst_tax"=>roundFigure($paidCgstTax),
            "paid_sgst_tax"=>roundFigure($paidSgstTax),

            "totalTax"=> roundFigure($total),
        ];
        return $returnData;

    }


    public function payNow(){

        $paidDemand = [];
        $demandList = collect($this->_DemandList)->sortBy("demand_upto");
        $advanceAmount = $this->_Demand["advanceAmount"];
        

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
        $paidTotalServiceTax = collect($paidDemand)->sum("paid_service_tax");
        $paidTotalCgstTax = collect($paidDemand)->sum("paid_cgst_tax");
        $paidTotalSgstTax = collect($paidDemand)->sum("paid_sgst_tax");
        $fromDate = collect($paidDemand)->min("demand_from");
        $uptoDate = collect($paidDemand)->max("demand_upto");
        $metaData=[
            "fromDate"=>$fromDate,
            "uptoDate"=>$uptoDate,
            "chargeType"=>"Demand Collection",
            "govTaxAmt"=>roundFigure($paidTotalServiceTax + $paidTotalCgstTax + $paidTotalSgstTax),
            "penaltyAmt" => roundFigure($paidTotalLatePenalty),
            "demandAmt" =>  roundFigure(collect($paidDemand)->sum("paid_balance")),
            "discountAmt" =>  roundFigure($advanceAmount),
            "request_demand_amount"=>roundFigure(collect($demandList)->sum("balance")),
            
        ];
        $this->_REQ->merge($metaData);
        if($paidTotalLatePenalty>0){
            $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalLatePenalty),"head_name"=>"Late Penalty"]);
        }
        if($paidTotalServiceTax>0){
            $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalServiceTax),"head_name"=>"Service Tax"]);
        }
        $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalCgstTax),"head_name"=>"CGST"]);
        $penalty->push(["is_rebate"=>false,"amount"=>roundFigure($paidTotalSgstTax),"head_name"=>"SGST"]);
        
        $objShopTran = new ShopTransaction();
        $objShopCollection = new ShopCollection();
        $objTranFineRebate = new TransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();
        $objAdvance = new AdvanceDetail();
        $objAdjustment = new AdjustmentDetail();
        $test = collect();
        # insert Transaction
        $tranId = $objShopTran->store($this->_REQ);
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
            $shopDemand = ShopDemand::find($paid["demandId"]);
            $metaCollData =[
                "transaction_id"=>$tranId,
                "shop_id"=>$shopDemand->shop_id,
                "shop_demand_id"=>$paid["demandId"],
                "demand_from"=>$shopDemand->demand_from,
                "demand_upto"=>$shopDemand->demand_upto,
                "total_demand" => $paid["paid_balance"],
                "amount" => $paid["paid_amount"],
                "penalty" => $paid["paid_penalty"],
            ];
            $newRequest = new Request($metaCollData); 
            # insert collection           
            $collectionId = $objShopCollection->store($newRequest);
            $shopDemand->paid_status = true ; 
            $shopDemand->balance = ($shopDemand->balance - $paid["paid_balance"]);
            $shopDemand->due_amount = ($shopDemand->due_amount - $paid["paid_amount"]);
            $shopDemand->due_penalty = ($shopDemand->balance - $paid["paid_penalty"]);
            if($shopDemand->balance<=0){
                $shopDemand->balance =0 ;
                $shopDemand->is_full_paid = true;
            }        
            $shopDemand->update();
            $test->push($shopDemand);
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
                "shopId"=>$this->_REQ->shopId,
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
                "shopId"=>$this->_REQ->shopId,
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
