<?php

namespace App\Bll\Water;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\User;
use App\Models\Water\ChequeDetail;
use App\Models\Water\ConnectionChargeCollection;
use App\Models\Water\Consumer;
use App\Models\Water\ConsumerDemandsCollection;
use App\Models\Water\TransactionFineRebateDetail;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterRejectedApplication;
use App\Models\Water\WaterTransaction;
use App\Trait\Water\WaterTrait;
use Illuminate\Support\Facades\DB;

class PaymentReceiptBll
{
    use WaterTrait;

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
        $this->_TranDetail = WaterTransaction::find($this->_TranId);
        $this->_ChequeDtl = ChequeDetail::where("transaction_id",$this->_TranId)
                            ->where("lock_status",false)
                            ->orderBy("id","DESC")
                            ->first();
        $this->_FineRebates = TransactionFineRebateDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        if($this->_TranDetail->application_id){
            $this->_CollectionDetail = ConnectionChargeCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get()->map(function($item){
                $item->demand = $item->getDemand()->first();
                return $item;
            });
            $this->_application = WaterActiveApplication::find($this->_TranDetail->application_id);
            if(!$this->_application){
                $this->_application = WaterApplication::find($this->_TranDetail->application_id);
            }
            if(!$this->_application){
                $this->_application = WaterRejectedApplication::find($this->_TranDetail->application_id);
            }
        }
        else{
            $this->_CollectionDetail = ConsumerDemandsCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get()->map(function($val){               
                $demand = $val->getDemand()->first();
                $val->demand_type = $demand?->demand_type;
                $val->current_meter_reading = $demand?->current_meter_reading;
                $val->from_reading = $demand?->from_reading;
                $val->actual_demand = $demand?->amount;
                $val->balance = $demand?->balance;
                return $val;
            });
            $this->_application = Consumer::find($this->_TranDetail->consumer_id);            
        }
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
        }
        $this->_oldWard = UlbWardMaster::find($this->_application->ward_mstr_id);
        $this->_newWard = UlbWardMaster::find($this->_application->new_ward_mstr_id);
        $this->_owners = collect($this->_application->getOwners())->sortBy("id");
    }

    public function applicationReceipt(){
        if($this->_TranDetail->application_id){
            $this->_GRID=[
                "description"=>"WATER CONNECTION CHARGE PAYMENT RECEIPT",
                "department" => "Water",
                "accountDescription" => "Water User Charge",
                "tranNo"=>$this->_TranDetail->tran_no,
                "tranDate"=>$this->_TranDetail->tran_date,
                "wardNo" =>$this->_oldWard->ward_no??"N/A",
                "newWardNo" =>$this->_newWard->ward_no??"N/A",
                "applicationNo" => $this->_application->application_no??"",
                "consumer_no" => $this->_application->consumer_no??"",
                "address" => $this->_application->address??"",
                "ownerName" =>$this->_owners->implode("owner_name",", "),
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
    
                "connectionFee" =>roundFigure(collect($this->_CollectionDetail)->sum("conn_fee")??0),
                "regulationPenalty" =>roundFigure(collect($this->_CollectionDetail)->sum("penalty")??0),
                
                "applicationDtl"=>$this->_application,
                "collection"=>$this->_CollectionDetail,
                "tranDtl" => $this->_TranDetail,
                "chequeDtl" => $this->_ChequeDtl,
                "ulbDtl" => $this->_UlbDetail,
                "ownerDtl" => $this->_owners,
                "fineRebate" => $this->_FineRebates,
                "userDtl"=> $this->_UserDetail,
            ];
        }
    }

    public function generateMeterRange()
    {
        // Initialize variables
        $ranges = [];
        $startOfRange = null;
        $amount = 0;

        // Sort the collection by `demand_upto` to ensure chronological order.
        $sortedCollection = $this->_CollectionDetail->where("demand_type","Meter")->sortBy('demand_upto');
        if(!$sortedCollection->count()){
            return $ranges;
        }
        // Set the start of the first range and add the first amount.
        $startOfRange = floatval($sortedCollection[0]?->current_meter_reading);
        $fromDate = ($sortedCollection[0]?->demand_from);
        $uptoDate = ($sortedCollection[0]?->demand_upto);
        $count = $sortedCollection->count()-1;

        // Iterate through the readings to detect rollovers and consolidate ranges.
        for ($i = 0; $i < $count; $i++) {
            $currentRecord = $sortedCollection[$i];
            $currentReading = floatval($currentRecord->current_meter_reading);
            $amount += floatval($currentRecord->amount);

            $nextRecord = $sortedCollection[$i + 1];
            $nextReading = floatval($nextRecord?->current_meter_reading);
            $nextFromDate = ($nextRecord?->demand_from);
            $nextUptoDate = ($nextRecord?->demand_upto);
            if ($nextReading < $currentReading) {
                // A rollover has occurred. Finalize the current range.
                $ranges[] = [
                    "reading" => "(" . $startOfRange . "-" . $currentReading . ")",
                    "amount" => roundFigure($amount),
                    "from"=>[
                        "fromDate"=>$fromDate,
                        "uptoDate"=>$uptoDate,
                    ],
                    "upto"=>[
                        "fromDate"=>$currentRecord?->demand_from,
                        "uptoDate"=>$currentRecord?->demand_from,
                    ]
                ];

                // Reset the start of the next range and amount.
                $startOfRange = $nextReading;
                $amount = 0;
                $fromDate = $nextFromDate;
                $uptoDate = $nextUptoDate;
            }
        }
        
        // After the loop, add the final consolidated range if it wasn't a rollover.
        if ($amount > 0) {
            $ranges[] = [
                "reading" => "(" . $startOfRange . "-" . floatval($sortedCollection[$count]->current_meter_reading) . ")",
                "amount" => roundFigure($amount + floatval($sortedCollection[$count]->amount)),
                "from"=>[
                        "fromDate"=>$fromDate,
                        "uptoDate"=>$uptoDate,
                    ],
                    "upto"=>[
                        "fromDate"=>$sortedCollection[$count]?->demand_from,
                        "uptoDate"=>$sortedCollection[$count]?->demand_upto,
                    ]
            ];
        }else{
            $ranges[] = [
                "reading" => "(" . floatval($sortedCollection[$count]->from_reading) . "-" .$startOfRange  . ")",
                "amount" => $sortedCollection[$count]->amount,
                "from"=>[
                        "fromDate"=>$fromDate,
                        "uptoDate"=>$uptoDate,
                    ],
                    "upto"=>[
                        "fromDate"=>$sortedCollection[$count]?->demand_from,
                        "uptoDate"=>$sortedCollection[$count]?->demand_upto,
                    ]
            ];
        }
        return $ranges;
    }

    public function consumerReceipt(){
        if($this->_TranDetail->consumer_id){
            $ranges = $this->generateMeterRange();
            $this->_GRID=[
                "description"=>"WATER USES CHARGE PAYMENT RECEIPT",
                "department" => "Water",
                "accountDescription" => "Water User Charge",
                "tranNo"=>$this->_TranDetail->tran_no,
                "tranDate"=>$this->_TranDetail->tran_date,
                "wardNo" =>$this->_oldWard->ward_no??"N/A",
                "newWardNo" =>$this->_newWard->ward_no??"N/A",
                "consumer_no" => $this->_application->consumer_no??"",
                "address" => $this->_application->address??"",
                "ownerName" =>$this->_owners->implode("owner_name",", "),
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
                "meterReading"=>$ranges,
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
        $this->applicationReceipt();
        $this->consumerReceipt();
    }
}
