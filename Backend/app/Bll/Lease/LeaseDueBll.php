<?php

namespace App\Bll\Lease;

use App\Models\DBSystem\UlbMaster;
use App\Models\Lease\AdditionalTax;
use App\Models\Lease\AdvanceDetail;
use App\Models\Lease\GovTaxMaster;
use App\Models\Lease\Lease;
use App\Models\Lease\LeaseDemand;
use App\Trait\Lease\LeaseTrait;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class LeaseDueBll
{
    use LeaseTrait;
    public $_GRID;
    public $_LeaseId;
    public $_tranDate;
    public $_tranDateFyear;  
    public $_uptoFYear;
    public $_lastPaymentIsClear;
    public $_latePenalty =0 ;
    public $_serviceTax =0;
    public $_cgst = 0 ;
    public $_sgst = 0 ;
    public $_demandAmount;
    public $_advanceAmount;
    public $_demandFromFyear;
    public $_demandUptoFyear;
    public $_additionalTaxList;
    public $_additionalTax;
    public $_UlbDetail;
    
    private $_Lease;
    private $_owners;
    private $_DemandList;
    private $_goveTaxList;
    private $_demandUptoList;
    private $_isGSTWeaveOff;
    private $_GSTWeaveOffAmt=0;
    private $_cgst_weave_off=0;
    private $_sgst_weave_off=0;

    public function __construct($leaseId,$tranDate=null,$uptoFyear=null,$isGSTWeaveOff=false)
    {
        $this->_LeaseId = $leaseId;
        $this->_tranDate = Carbon::parse($tranDate);
        $this->_isGSTWeaveOff = $isGSTWeaveOff;
        list(,$this->_endDateOfFyear) = FyearFromUptoDate(getFY($tranDate));
        $this->_tranDateFyear = getFY($this->_tranDate->copy()->format("Y-m-d"));
        $this->_uptoFYear = $uptoFyear ? $uptoFyear : $this->_tranDateFyear;
        $this->_Lease = Lease::find($this->_LeaseId); 
        $this->_owners = collect($this->_Lease->getOwners())->sortBy("id");
        $this->_UlbDetail = UlbMaster::find($this->_Lease->ulb_id);
        $this->_goveTaxList = GovTaxMaster::where("lock_status",false)->get();
        if($this->_UlbDetail){
            $this->_UlbDetail->water_mark_img = $this->_UlbDetail->water_mark_img ? url('/'.$this->_UlbDetail->water_mark_img) : "";
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/'.$this->_UlbDetail->logo_img) : "";
            $this->_UlbDetail->right_logo = url('/'."UlbLogo/swachh_bharat.png");
        }              
        $this->setDemandList();
        $this->testLastTran();
    }

    private function testLastTran(){
        $last = $this->_Lease->getLastTran();
        if($last && $last->payment_status==2){
            $this->_lastPaymentIsClear = false;
        }
    }

    private function setDemandList(){
        $objDemand = new LeaseDemand();
        $this->_demandUptoList = $objDemand
                ->select(DB::raw("DISTINCT fyear AS fyear"))
                ->where("lease_id",$this->_LeaseId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("fyear","DESC")
                ->get();
        $this->_DemandList = collect($objDemand->getDueDemand($this->_LeaseId))
                            ->where("fyear","<=",$this->_uptoFYear);
        $this->_DemandList = $this->_DemandList->map(function($item){                                
                                $this->getLatePenalty($item);
                                $this->setGST($item);
                                return $item;
                            });
        $this->_latePenalty = roundFigure($this->_DemandList->sum("latePenalty"));
        $this->_demandAmount = roundFigure($this->_DemandList->sum("balance"));
        $this->_serviceTax = roundFigure($this->_DemandList->sum("serviceTax"));
        $this->_cgst = roundFigure($this->_DemandList->sum("cgst"));
        $this->_sgst = roundFigure($this->_DemandList->sum("sgst"));

        $this->_cgst_weave_off = roundFigure($this->_DemandList->sum("cgst_weave_off"));
        $this->_sgst_weave_off = roundFigure($this->_DemandList->sum("sgst_weave_off"));

        $this->_demandFromFyear = $this->_DemandList->min("fyear");
        $this->_demandUptoFyear = $this->_DemandList->max("fyear");
    }

    private function getLatePenalty($demandList){
        $penalty = 0 ;
        $monthDiff = 0;
        $demandList->monthDiff = $monthDiff;
        $demandList->latePenalty = $penalty;
        $demandList->totalTax = roundFigure($demandList->latePenalty + $demandList->balance);
    }

    private function setGST($demandList){
        $balance = $demandList->totalTax;
        list($from,$upto) = FyearFromUptoDate($demandList->fyear);
        $currentGoveTax = $this->_goveTaxList
                        ->where("effective_from","<=",$from)
                        ->filter(function($item) use($from){
                            return $item->effective_upto>=$from || $item->effective_upto==null;
                        });
        $percentOfCgstTax = $currentGoveTax->where("tax_type","CGST")->first()->tax_per ??0;
        $percentOfSgstTax = $currentGoveTax->where("tax_type","SGST")->first()->tax_per ??0;
        if($this->_Lease->uses_type_id==1){
            $percentOfCgstTax = 0;
            $percentOfSgstTax = 0;
        }

        $demandList->cgst = roundFigure(($percentOfCgstTax * $balance)/100);
        $demandList->sgst = roundFigure(($percentOfSgstTax * $balance)/100);

        $demandList->cgst_weave_off = 0;
        $demandList->sgst_weave_off = 0;

        if($this->_isGSTWeaveOff){
            $demandList->cgst_weave_off = $demandList->cgst;
            $demandList->sgst_weave_off = $demandList->sgst;
        }

        $demandList->totalTax = roundFigure(($balance +  $demandList->cgst + $demandList->sgst) - ($demandList->cgst_weave_off + $demandList->sgst_weave_off));
    }

    private function getAdvanceAmount(){
        $AdvanceDetail = new AdvanceDetail();
        $this->_advanceAmount = $AdvanceDetail->getConsumerAdvanceAmount($this->_LeaseId)->advance_amount??0;
    }

    private function getAdditionalTax(){
        $this->_additionalTaxList = AdditionalTax::where("lock_status",false)->where("paid_status",false)->where("lease_id",$this->_LeaseId)->get();
        $this->_additionalTax = roundFigure($this->_additionalTaxList->sum("amount"));
    }

    private function generateDemand(){        
        $this->adjustLeaseValue($this->_Lease);
        $this->_GRID = [
            "demandUptoList"=>$this->_demandUptoList,
            "printingDate"=>Carbon::now()->format("Y-m-d H:i:s"),
            "description"=>"LAND LEASE RENT DEMAND",
            "department" => "Revenue Section",
            "accountDescription" => "Land lease",
            "date"=>$this->_tranDate,
            "ulbDtl" => $this->_UlbDetail,
            "leaseDtl"=>$this->_Lease,
            "owners"=>$this->_owners,
            "demandList"=>$this->_DemandList,
            "additionalTaxList"=>$this->_additionalTaxList,

            "leaseRegNo"=>$this->_Lease->lease_reg_no??"",
            "consumer_no"=>$this->_Lease->lease_no??"",
            "area"     => roundFigure($this->_Lease->width * $this->_Lease->length),
            "wardNo" =>$this->_Lease->ward_no??"N/A",
            "holdingNo" => $this->_Lease->holding_no??"",
            "areaName"=>$this->_Lease->area_name??"",
            "address" => $this->_Lease->address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "firstOwnerAddress" =>$this->_owners->whereNotNull("owner_address")->first()?->owner_address,
            "relationType" =>$this->_owners->unique("relation_type")->pluck("relation_type")->implode(", "),
            "guardianName" =>$this->_owners->implode("guardian_name",", "),
            "mobileNo"=>$this->_owners->implode("mobile_no",", "),
            "lastPaymentClear" => $this->_lastPaymentIsClear,            
            "demandAmount"=>$this->_demandAmount,
            "latePenalty"=>$this->_latePenalty,
            "additionalTax"=>$this->_additionalTax,
            "cgst"=>$this->_cgst,
            "sgst"=>$this->_sgst,
            "GST"=>roundFigure($this->_cgst + $this->_sgst),
            "cgst_weave_off"=>$this->_cgst_weave_off,
            "sgst_weave_off"=>$this->_sgst_weave_off,
            "GST_weave_off"=>roundFigure($this->_cgst_weave_off + $this->_sgst_weave_off),
            "advanceAmount" => $this->_advanceAmount,
            "demandFromFyear"=>$this->_demandFromFyear,
            "_demandUptoFyear"=>$this->_demandUptoFyear,
            "payableAmount" => roundFigure(
                ($this->_demandAmount + $this->_latePenalty + $this->_cgst + $this->_sgst +  $this->_additionalTax ) 
                - ($this->_advanceAmount + $this->_cgst_weave_off + $this->_sgst_weave_off) 
            ),
        ];
        $this->_GRID["payableAmountInWord"] = getIndianCurrency($this->_GRID["payableAmount"]);
    }

    public function getConsumerDue(){
        $this->getAdvanceAmount();        
        $this->getAdditionalTax();
        $this->generateDemand();
    }
}
