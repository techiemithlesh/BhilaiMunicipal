<?php

namespace App\Bll\Lease;

use App\Models\DBSystem\UlbMaster;
use App\Models\Lease\ChequeDetail;
use App\Models\Lease\Lease;
use App\Models\Lease\LeaseCollection;
use App\Models\Lease\LeaseTransaction;
use App\Models\Lease\LeaseTransactionFineRebateDetail;
use App\Models\User;
use App\Trait\Lease\LeaseTrait;
use Illuminate\Support\Carbon;

class PaymentReceiptBll
{
    use LeaseTrait;

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
    public $_Lease;
    public $_owners;
    public $_tblRow;

    function __construct($tranId)
    {
        $this->_TranId = $tranId;

    }

    public function loadParam(){
        $this->_TranDetail = LeaseTransaction::find($this->_TranId);
        $this->_ChequeDtl = ChequeDetail::where("transaction_id",$this->_TranId)
                            ->where("lock_status",false)
                            ->orderBy("id","DESC")
                            ->first();
        $this->_FineRebates = LeaseTransactionFineRebateDetail::where("lock_status",false)
                            ->where("transaction_id",$this->_TranId)
                            ->get();
        
        $this->_CollectionDetail = LeaseCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get()->map(function($val){               
            $demand = $val->getDemand()->first();
            $val->demand_type = $demand?->demand_type;
            $val->actual_demand = $demand?->amount;
            $val->balance = $demand?->balance;
            return $val;
        });
        $this->_Lease = Lease::find($this->_TranDetail->lease_id); 
        $this->_Lease = $this->adjustLeaseValue($this->_Lease);

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
        $this->_owners = collect($this->_Lease->getOwners())->sortBy("id");
    }

    public function consumerReceipt(){
        $this->_GRID=[                
            "printingDate"=>Carbon::now()->format("Y-m-d H:i:s"),
            "description"=>"LAND LEASE RENT PAYMENT RECEIPT",
            "department" => "Revenue Section",
            "accountDescription" => "Land lease",
            "tranNo"=>$this->_TranDetail->tran_no,
            "tranDate"=>$this->_TranDetail->tran_date,

            "leaseRegNo"=>$this->_Lease->lease_reg_no??"",            
            "consumer_no"=>$this->_Lease->lease_no??"",
            "wardNo" =>$this->_Lease->ward_no??"N/A",
            "holdingNo" => $this->_Lease->holding_no??"",
            "areaName"=>$this->_Lease->area_name??"",
            "address" => $this->_Lease->address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "relationType" =>$this->_owners->unique("relation_type")->pluck("relation_type")->implode(", "),
            "guardianName" =>$this->_owners->implode("guardian_name",", "),
            "mobileNo"=>$this->_owners->implode("mobile_no",", "),

            "amount" => $this->_TranDetail->payable_amt,
            "amountInWords" => getIndianCurrency($this->_TranDetail->payable_amt),
            "paymentMode" => $this->_TranDetail->payment_mode,
            "paymentStatus" => $this->_TranDetail->payment_status==1 ? "Clear":"Pending",
            "chequeNo" => $this->_ChequeDtl->cheque_no??"",
            "chequeDate" => $this->_ChequeDtl->cheque_date??"",
            "bankName" => $this->_ChequeDtl->bank_name??"",
            "branchName" =>$this->_ChequeDtl->branch_name??"",
            "fromYear"=>$this->_TranDetail->from_year,
            "uptoYear"=>$this->_TranDetail->upto_year,

            "monthlyDemandAmount" =>roundFigure(collect($this->_CollectionDetail)->sum("amount")??0),
            "dueAmount"=>roundFigure($this->_TranDetail->request_demand_amount - $this->_TranDetail->demand_amt),
            "lease"=>$this->_Lease,
            "tranDtl" => $this->_TranDetail,
            "collection"=>$this->_CollectionDetail,
            "chequeDtl" => $this->_ChequeDtl,
            "ulbDtl" => $this->_UlbDetail,
            "ownerDtl" => $this->_owners,
            "fineRebate" => $this->_FineRebates,
            "userDtl"=> $this->_UserDetail,
        ];
    }

    public function generateReceipt(){
        $this->loadParam();
        $this->consumerReceipt();
    }
}
