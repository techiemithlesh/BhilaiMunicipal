<?php
namespace App\Bll\Property;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\AdditionalTax;
use App\Models\Property\ChequeDetail;
use App\Models\Property\PropertyCollection;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropTransaction;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafCollection;
use App\Models\Property\SafDetail;
use App\Models\Property\SwmActiveConsumer;
use App\Models\Property\SwmConsumer;
use App\Models\Property\SwmConsumerDemandsCollection;
use App\Models\Property\SwmConsumerTransactionFineRebateDetail;
use App\Models\Property\SwmRejectedConsumer;
use App\Models\Property\TransactionFineRebateDetail;
use App\Models\User;
use App\Trait\Property\PropertyTrait;
use Illuminate\Support\Carbon;

class PaymentReceiptBll{ 

    use PropertyTrait;

    public $_GRID;
    public $_TranId;
    public $_TranDetail;
    public $_SwmTran;
    public $_Consumers;
    public $_ChequeDtl;
    public $_CollectionDetail;
    public $_SwmDemandCollectionDetail;
    public $_FineRebates;
    public $_UserDetail;
    public $_UlbDetail;
    public $_oldWard;
    public $_newWard;
    public $_propSafData;
    public $_owners;
    public $_floor;
    public $_tblRow;
    public $_AdditionalTaxs;
    public $_tranDateFyear ;
    public $_currentDemandList;
    public $_previousDemandList;

    function __construct($tranId)
    {
        $this->_TranId = $tranId;

    }

    public function loadParam(){
        $this->_TranDetail = PropTransaction::find($this->_TranId);
        $this->_ChequeDtl = ChequeDetail::where("transaction_id",$this->_TranId)
                            ->where("lock_status",false)
                            ->orderBy("id","DESC")
                            ->first();
        $this->_tranDateFyear = getFy($this->_TranDetail->tran_date);
        $this->_FineRebates = TransactionFineRebateDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        $this->_AdditionalTaxs = AdditionalTax::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        if($this->_TranDetail->saf_detail_id){
            $this->_CollectionDetail = SafCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
            $this->_propSafData = ActiveSafDetail::find($this->_TranDetail->saf_detail_id);
            if(!$this->_propSafData){
                $this->_propSafData = SafDetail::find($this->_TranDetail->saf_detail_id);
            }
            if(!$this->_propSafData){
                $this->_propSafData = RejectedSafDetail::find($this->_TranDetail->saf_detail_id);
            }
        }
        else{
            $this->_CollectionDetail = PropertyCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
            $this->_propSafData = PropertyDetail::find($this->_TranDetail->property_detail_id);            
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
        $this->_propSafData = $this->adjustSafValue($this->_propSafData);
        $this->_oldWard = UlbWardMaster::find($this->_propSafData->ward_mstr_id);
        $this->_newWard = UlbWardMaster::find($this->_propSafData->new_ward_mstr_id);
        $this->_owners = collect($this->_propSafData->getOwners())->sortBy("id");
        $this->_floor = $this->adjustFloorValue($this->_propSafData->getFloors());       
        $this->_SwmTran = $this->_TranDetail->getSwmTrans()->map(function($item){
            $consumers = SwmConsumer::find($item->consumer_id);
            if(!$consumers){
                $consumers = SwmActiveConsumer::find($item->consumer_id);
            }
            if(!$consumers){
                $consumers = SwmRejectedConsumer::find($item->consumer_id);
            }
            $item->ownerDtl = $consumers->getOwners();
            $item->consumers = $consumers;            
            $item->collectionDetail = SwmConsumerDemandsCollection::where("lock_status",false)->where("transaction_id",$item->id)->get();
            $item->penaltyRebate = SwmConsumerTransactionFineRebateDetail::where("lock_status",false)->where("transaction_id",$item->id)->get();

            return $item;
        });
    }

    public function generateDemandReceipt($demandList){
        $fromYear = collect($demandList)->min("fyear");
        $uptoYear = collect($demandList)->max("fyear");
        $fromQtr = collect($demandList)->where('fyear',$fromYear)->min("qtr");
        $uptoQtr = collect($demandList)->where('fyear',$uptoYear)->max("qtr");
        $totalRwhDue = roundFigure(collect($demandList)->sum("rwh_tax"));
        $totalDue = roundFigure(collect($demandList)->sum("total_tax"));
        $totalHoldingDue = roundFigure($totalDue - $totalRwhDue);
        $totalQtr = collect($demandList)->count();
        $qtrTax = roundFigure($totalHoldingDue / ($totalQtr ? $totalQtr : 1));
        $qtrRwh = roundFigure($totalRwhDue / ($totalQtr ? $totalQtr : 1));
        return[
            "fromYear"=>$fromYear,
            "fromQtr"=>$fromQtr,
            "uptoYear"=>$uptoYear,
            "uptoQtr"=>$uptoQtr,
            "qtrTax"=>$qtrTax,
            "qtrRwh"=>$qtrRwh,
            "totalQtr"=>$totalQtr,
            "totalQtrTax"=>roundFigure($qtrTax + $qtrRwh) ,
            "totalDue"=>$totalDue,
        ];

    }

    public function generateSwmReceipt($tranList){
        $fromDate = collect($tranList)->min("from_date");
        $uptoDate = collect($tranList)->max("upto_date");
        $totalDue = roundFigure(collect($tranList)->sum("payable_amt"));
        return[
            "fromDate"=>$fromDate,
            "uptoDate"=>$uptoDate,
            "totalAmount"=>$totalDue,
        ];

    }

    public function generateReceipt(){
        $this->loadParam();



        $this->_currentDemandList = $this->_CollectionDetail->where("fyear",$this->_tranDateFyear);
        $this->_previousDemandList = $this->_CollectionDetail->where("fyear","<",$this->_tranDateFyear);

        
        $this->_GRID=[
            "printingDate"=>Carbon::now()->format("Y-m-d H:i:s"),
            "description"=>"HOLDING TAX RECEIPT",
            "tranNo"=>$this->_TranDetail->tran_no,
            "tranDate"=>$this->_TranDetail->tran_date,
            "department" => "Revenue Section",
            "wardNo" =>$this->_oldWard->ward_no??"N/A",
            "newWardNo" =>$this->_newWard->ward_no??"N/A",
            "accountDescription" => "Holding Tax & Others",
            "holdingNo" => $this->_propSafData->holding_no??"",
            "newHoldingNo" => $this->_propSafData->new_holding_no??"",
            "usageType" => $this->_floor ? $this->_floor->unique("usage_type")->pluck("usage_type")->implode(", "): "Resident",
            "saf_no" => $this->_propSafData->saf_no??"",
            "address" => $this->_propSafData->prop_address??"",
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
            "fromFyear"=>$this->_TranDetail->from_fyear,
            "uptoFyear"=>$this->_TranDetail->upto_fyear,
            "fromQtr"=>$this->_TranDetail->from_qtr,
            "uptoQtr"=>$this->_TranDetail->upto_qtr,

            "holdingTax" =>roundFigure(collect($this->_CollectionDetail)->sum("holding_tax")??0),
            "waterTax" =>roundFigure(collect($this->_CollectionDetail)->sum("water_tax")??0),
            "latrineTax" =>roundFigure(collect($this->_CollectionDetail)->sum("latrine_tax")??0),
            "healthCessTax" =>roundFigure(collect($this->_CollectionDetail)->sum("health_cess_tax")??0),
            "educationCessTax" =>roundFigure(collect($this->_CollectionDetail)->sum("education_cess_tax")??0),            
            "rwhTax" =>roundFigure(collect($this->_CollectionDetail)->sum("rwh_tax")??0),

            "previousPaymentReceipt"=>$this->generateDemandReceipt($this->_previousDemandList),
            "currentPaymentReceipt"=>$this->generateDemandReceipt($this->_currentDemandList),
            
            "propertyDtl"=>$this->_propSafData,
            "tranDtl" => $this->_TranDetail,
            "swmTranDtl"=>$this->_SwmTran,
            "swmTranReceipt"=>$this->generateSwmReceipt($this->_SwmTran),
            "chequeDtl" => $this->_ChequeDtl,
            "ulbDtl" => $this->_UlbDetail,
            "ownerDtl" => $this->_owners,
            "fineRebate" => $this->_FineRebates,
            "additionalTax"=>$this->_AdditionalTaxs,
            "userDtl"=> $this->_UserDetail,
        ];
    }
}