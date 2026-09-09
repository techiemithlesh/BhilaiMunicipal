<?php

namespace App\Bll\Trade;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\ChequeDetail;
use App\Models\Trade\RejectedTradeLicense;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseLog;
use App\Models\Trade\TradeTransaction;
use App\Models\Trade\TransactionFineRebateDetail;
use App\Models\User;

class PaymentReceiptBll
{
    public $_GRID;
    public $_TranId;
    public $_TranDetail;
    public $_ChequeDtl;
    public $_CollectionDetail;
    public $_FineRebates;
    public $_UserDetail;
    public $_UlbDetail;
    public $_oldWard;
    public $_newWard;
    public $_tradeData;
    public $_owners;
    public $_tblRow;

    function __construct($tranId)
    {
        $this->_TranId = $tranId;

    }

    public function loadParam(){
        $this->_TranDetail = TradeTransaction::find($this->_TranId);
        $this->_ChequeDtl = ChequeDetail::where("transaction_id",$this->_TranId)
                            ->where("lock_status",false)
                            ->orderBy("id","DESC")
                            ->first();
        $this->_FineRebates = TransactionFineRebateDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        $this->_tradeData = ActiveTradeLicense::find($this->_TranDetail->trade_license_id);
        if(!$this->_tradeData){
            $this->_tradeData = TradeLicense::find($this->_TranDetail->trade_license_id);
        }
        if(!$this->_tradeData){
            $this->_tradeData = RejectedTradeLicense::find($this->_TranDetail->trade_license_id);
        }
        if(!$this->_tradeData){
            $this->_tradeData = TradeLicenseLog::find($this->_TranDetail->trade_license_id);
        }

        if($this->_TranDetail->user_type!="ONLINE"){
            $this->_UserDetail = User::find($this->_TranDetail->user_id);
        }
        if($this->_UserDetail){
            $this->_UserDetail->signature_img = $this->_UserDetail->signature_img ? url('/'.$this->_UserDetail->signature_img) : "";
        }
        $this->_UlbDetail = UlbMaster::find($this->_TranDetail->ulb_id);
        if($this->_UlbDetail){
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/'.$this->_UlbDetail->logo_img) : "";
        }
        $this->_oldWard = UlbWardMaster::find($this->_tradeData->ward_mstr_id);
        $this->_newWard = UlbWardMaster::find($this->_tradeData->new_ward_mstr_id);
        $this->_owners = collect($this->_tradeData->getOwners())->sortBy("id");
    }

    public function generateReceipt(){
        $this->loadParam();
        $this->_GRID=[
            "description"=>"MUNICIPAL LICENSE PAYMENT RECEIPT",
            "tranNo"=>$this->_TranDetail->tran_no,
            "tranDate"=>$this->_TranDetail->tran_date,
            "department" => "Municipal License Section",
            "wardNo" =>$this->_oldWard->ward_no??"N/A",
            "newWardNo" =>$this->_newWard->ward_no??"N/A",
            "accountDescription" => "Municipal License Fee",
            "applicationNo" => $this->_tradeData->application_no??"",
            "address" => $this->_tradeData->prop_address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "amount" => $this->_TranDetail->payable_amt,
            "amountInWords" => getIndianCurrency($this->_TranDetail->payable_amt),
            "paymentMode" => $this->_TranDetail->payment_mode,
            "paymentStatus" => $this->_TranDetail->payment_status==1 ? "Clear":"Pending",
            "chequeNo" => $this->_ChequeDtl->cheque_no??"",
            "chequeDate" => $this->_ChequeDtl->cheque_date??"",
            "bankName" => $this->_ChequeDtl->bank_name??"",
            "branchName" =>$this->_ChequeDtl->branch_name??"",

            "rate" =>$this->_TranDetail->rate,
            "currentCharge" =>roundFigure($this->_TranDetail->rate * $this->_tradeData->license_for_years),
            "arrearCharge" =>roundFigure( $this->_TranDetail->demand_amt - ($this->_TranDetail->rate * $this->_tradeData->license_for_years)),
            
            "propertyDtl"=>$this->_tradeData,
            "tranDtl" => $this->_TranDetail,
            "chequeDtl" => $this->_ChequeDtl,
            "ulbDtl" => $this->_UlbDetail,
            "ownerDtl" => $this->_owners,
            "fineRebate" => $this->_FineRebates,
            "userDtl"=> $this->_UserDetail,
        ];
    }
}
