<?php

namespace App\Bll\SWM;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\User;
use App\Models\SWM\ChequeDetail;
use App\Models\SWM\ConnectionChargeCollection;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerDemandsCollection;
use App\Models\SWM\TransactionFineRebateDetail;
use App\Models\SWM\ConsumerTransaction;
use App\Trait\SWM\ConsumerTrait;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentReceiptBll
{
    use ConsumerTrait;

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
    public $_application;
    public $_owners;
    public $_tblRow;

    function __construct($tranId)
    {
        $this->_TranId = $tranId;

    }

    public function loadParam(){
        $this->_TranDetail = ConsumerTransaction::find($this->_TranId);
        $this->_ChequeDtl = ChequeDetail::where("transaction_id",$this->_TranId)
                            ->where("lock_status",false)
                            ->orderBy("id","DESC")
                            ->first();
        $this->_FineRebates = TransactionFineRebateDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        
        $this->_CollectionDetail = ConsumerDemandsCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get()->map(function($val){               
            $demand = $val->getDemand()->first();
            $val->demand_type = $demand?->demand_type;
            $val->actual_demand = $demand?->amount;
            $val->balance = $demand?->balance;
            return $val;
        });
        $this->_application = Consumer::find($this->_TranDetail->consumer_id); 
        $this->_application = $this->adjustValue($this->_application);

        if($this->_TranDetail->user_type!="ONLINE"){
            $this->_UserDetail = User::find($this->_TranDetail->user_id);
        }
        if($this->_UserDetail){
            $this->_UserDetail->signature_img = $this->_UserDetail->signature_img ? url('/'.$this->_UserDetail->signature_img) : "";
        }
        $this->_UlbDetail = UlbMaster::find($this->_TranDetail->ulb_id);
        if($this->_UlbDetail){
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/'.$this->_UlbDetail->logo_img) : "";            
            $this->_UlbDetail->water_mark_img = $this->_UlbDetail->water_mark_img ? url('/'.$this->_UlbDetail->water_mark_img) : "";
            $this->_UlbDetail->left_logo =  $this->_UlbDetail->logo_img;
            $this->_UlbDetail->right_logo =  url('/'."UlbLogo/swachh_bharat.png") ;
        }
        $this->_oldWard = UlbWardMaster::find($this->_application->ward_mstr_id);
        $this->_owners = collect($this->_application->getOwners())->sortBy("id");
    }

    public function consumerReceipt(){
        if($this->_TranDetail->consumer_id){
            $this->_GRID=[                
                "printingDate"=>Carbon::now()->format("Y-m-d H:i:s"),
                "description"=>"SOLID WASTE USER CHARGE RECEIPT",
                "department" => "Revenue Section",
                "accountDescription" => "Solid Waste User Charge & Others",
                "tranNo"=>$this->_TranDetail->tran_no,
                "tranDate"=>$this->_TranDetail->tran_date,
                "wardNo" =>$this->_oldWard->ward_no??"N/A",
                "consumer_no" => $this->_application->consumer_no??"",
                "holding_no"=>$this->_application->holding_no??"",
                "address" => $this->_application->address??"",
                "ownerName" =>$this->_owners->implode("owner_name",", "),
                "mobile_no" =>$this->_owners->pluck("mobile_no")->unique()->implode(", "),
                "amount" => $this->_TranDetail->payable_amt,
                "amountInWords" => getIndianCurrency($this->_TranDetail->payable_amt),
                "paymentMode" => $this->_TranDetail->payment_mode,
                "paymentStatus" => $this->_TranDetail->payment_status==1 ? "Clear":"Pending",
                "chequeNo" => $this->_ChequeDtl->cheque_no??"",
                "chequeDate" => $this->_ChequeDtl->cheque_date??"",
                "bankName" => $this->_ChequeDtl->bank_name??"",
                "branchName" =>$this->_ChequeDtl->branch_name??"",
                "fromDate"=>$this->_TranDetail->from_date,
                "uptoDate"=>$this->_TranDetail->upto_date,
    
                "monthlyDemandAmount" =>roundFigure(collect($this->_CollectionDetail)->sum("amount")??0),
                "dueAmount"=>roundFigure($this->_TranDetail->request_demand_amount - $this->_TranDetail->demand_amt),
                "consumerDtl"=>$this->_application,
                "tranDtl" => $this->_TranDetail,
                "collection"=>$this->_CollectionDetail,
                "chequeDtl" => $this->_ChequeDtl,
                "ulbDtl" => $this->_UlbDetail,
                "ownerDtl" => $this->_owners,
                "fineRebate" => $this->_FineRebates,
                "userDtl"=> $this->_UserDetail,
            ];
        }
    }

    public function generateReceipt(){
        $this->loadParam();
        $this->consumerReceipt();
    }
}

