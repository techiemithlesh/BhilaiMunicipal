<?php

namespace App\Bll\Trade;

use App\Models\Citizen;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\ChequeDetail;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeTransaction;
use App\Models\Trade\TransactionFineRebateDetail;
use App\Models\User;
use App\Trait\Trade\TradeTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

class TradePaymentBll
{
    use TradeTrait;
    /**
     * Create a new class instance.
     */
    private $_REQUEST;
    public $_TRADEID;
    public $_TRADE;
    public $_tranDate;
    private $_Demand;
    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_TRADEID = $request->id;
        $this->_tranDate = Carbon::parse($request->tranDate);
        $this->_TRADE = ActiveTradeLicense::find($this->_TRADEID);
        if(!$this->_TRADE){
            $this->_TRADE = TradeLicense::find($this->_TRADEID);
        }
        $requestArr = $this->generateTradeRequestForCharge($this->_TRADE->id);
        $request->merge($requestArr); 
        $tradeDemandBLL = new TaxCalculator($request);
        $tradeDemandBLL->getCharge();
        $this->_Demand = $tradeDemandBLL->_GRID;
        $this->setParams();
    }

    public function setParams(){
        if(!$this->_REQUEST->amount){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["totalCharge"]]);
        }
        if($this->_REQUEST->paymentType=="FULL"){
            $this->_REQUEST->merge(["amount"=>$this->_Demand["totalCharge"]]);
        }

        $user = Auth::user();

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
            "ulbId"=>$this->_TRADE->ulb_id,
            "tradeLicenseId"=>$this->_TRADE->id,
            "wardMstrId"=>$this->_TRADE->ward_mstr_id,
            "payableAmt"=>$this->_REQUEST->amount,
            "userId"=> $user->id??null,
            "userType"=>$userType,
            "paymentStatus"=>$paymentStatus,
            "tranType"=>$this->_REQUEST->paymentType,
        ];
        $this->_REQUEST->merge($metaData);

    }

    public function payNow(){

        $latePenalty = $this->_Demand["latePenalty"];
        $advanceAmount = $this->_Demand["advanceAmount"]??0;
        $OtherPenalty = $this->_Demand["OtherPenalty"]??0;
        $rebateAmount = $this->_Demand["rebateAmount"]??0;
        $arrear = $this->_Demand["arrearCharge"]??0;
        $current = $this->_Demand["currentCharge"]??0;        
        
        $OtherPenaltys = collect($this->_Demand["otherPenaltyList"]??[]);
        $penalty = collect();
        $rebates = collect();
        $metaData=[
            "rate"=>$this->_Demand["licenseCharge"],
            "penaltyAmt" => roundFigure($latePenalty + $OtherPenalty),
            "demandAmt" =>  roundFigure($arrear + $current),
            "discountAmt" =>  roundFigure($advanceAmount + $rebateAmount ),            
        ];
        $this->_REQUEST->merge($metaData);
        if($latePenalty>0){
            $penalty->push(["amount"=>roundFigure($latePenalty),"head_name"=>"Late Penalty"]);
        }
        if($rebateAmount>0){
            $rebates->push(["amount"=>roundFigure($rebateAmount),"head_name"=>"Rebate"]);
            
        }

        $objTradeTran = new TradeTransaction();
        $objTranFineRebate = new TransactionFineRebateDetail();
        $objChequeDtl = new ChequeDetail();

        # insert Transaction
        $tranId = $objTradeTran->store($this->_REQUEST);
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
