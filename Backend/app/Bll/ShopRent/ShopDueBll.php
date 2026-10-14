<?php

namespace App\Bll\ShopRent;

use App\Models\DBSystem\UlbMaster;
use App\Models\ShopRent\AdditionalTax;
use App\Models\ShopRent\AdvanceDetail;
use App\Models\ShopRent\GovTaxMaster;
use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopDemand;
use App\Trait\ShopRent\ShopTrait;
use Illuminate\Support\Carbon;

class ShopDueBll
{
    use ShopTrait;

    public $_GRID;
    public $_ShopId;
    public $_tranDate;
    public $_endDateOfFyear;  
    public $_demandUpto;
    public $_lastPaymentIsClear;
    public $_latePenalty =0 ;
    public $_serviceTax =0;
    public $_cgst = 0 ;
    public $_sgst = 0 ;
    public $_demandAmount;
    public $_advanceAmount;
    public $_fromDate;
    public $_uptoDate;
    public $_additionalTaxList;
    public $_additionalTax;
    public $_UlbDetail;
    
    private $_Shop;
    private $_owners;
    private $_DemandList;
    private $_goveTaxList;

    public function __construct($shopId,$tranDate=null,$demandUpto=null)
    {
        $this->_ShopId = $shopId;
        $this->_tranDate = Carbon::parse($tranDate)->format("Y-m-d");
        list(,$this->_endDateOfFyear) = FyearFromUptoDate(getFY($tranDate));
        $this->_demandUpto = $demandUpto ? Carbon::parse($demandUpto)->format("Y-m-d") : $this->_endDateOfFyear;
        $this->_Shop = Shop::find($this->_ShopId); 
        $this->_owners = collect($this->_Shop->getOwners())->sortBy("id");
        $this->_UlbDetail = UlbMaster::find($this->_Shop->ulb_id);
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
        $last = $this->_Shop->getLastTran();
        if($last && $last->payment_status==2){
            $this->_lastPaymentIsClear = false;
        }
    }

    private function setDemandList(){
        $objDemand = new ShopDemand();
        $this->_DemandList = collect($objDemand->getDueDemand($this->_ShopId))
                            ->where("demand_upto","<=",$this->_demandUpto);
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
        $this->_fromDate = $this->_DemandList->min("demand_from");
        $this->_uptoDate = $this->_DemandList->max("demand_upto");
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
        $currentGoveTax = $this->_goveTaxList
                        ->where("effective_from","<=",$demandList->demand_from)
                        ->filter(function($item) use($demandList){
                            return $item->effective_upto>=$demandList->demand_from || $item->effective_upto==null;
                        });
        $percentOfServiceTax = $currentGoveTax->where("tax_type","Service Tax")->first()->tax_per ??0;
        $percentOfCgstTax = $currentGoveTax->where("tax_type","CGST")->first()->tax_per ??0;
        $percentOfSgstTax = $currentGoveTax->where("tax_type","SGST")->first()->tax_per ??0;

        $demandList->serviceTax = roundFigure(($percentOfServiceTax * $balance)/100);
        $demandList->cgst = roundFigure(($percentOfCgstTax * $balance)/100);
        $demandList->sgst = roundFigure(($percentOfSgstTax * $balance)/100);
        $demandList->totalTax = roundFigure($balance + $demandList->serviceTax + $demandList->cgst + $demandList->sgst);
    }

    private function getAdvanceAmount(){
        $AdvanceDetail = new AdvanceDetail();
        $this->_advanceAmount = $AdvanceDetail->getConsumerAdvanceAmount($this->_ShopId)->advance_amount??0;
    }

    private function getAdditionalTax(){
        $this->_additionalTaxList = AdditionalTax::where("lock_status",false)->where("paid_status",false)->where("shop_id",$this->_ShopId)->get();
        $this->_additionalTax = roundFigure($this->_additionalTaxList->sum("amount"));
    }

    private function generateDemand(){        
        $this->adjustShopValue($this->_Shop);
        $this->_GRID = [
            "printingDate"=>Carbon::now()->format("Y-m-d H:i:s"),
            "description"=>"SHOP RENT DEMAND",
            "department" => "Revenue Section",
            "accountDescription" => "Shop Rent Charge & Others",
            "date"=>$this->_tranDate,
            "ulbDtl" => $this->_UlbDetail,
            "shopDtl"=>$this->_Shop,
            "owners"=>$this->_owners,
            "demandList"=>$this->_DemandList,
            "additionalTaxList"=>$this->_additionalTaxList,

            "shopNo"=>$this->_Shop->shop_no??"",
            "consumer_no"=>$this->_Shop->consumer_no??"",
            "wardNo" =>$this->_Shop->ward_no??"N/A",
            "holdingNo" => $this->_Shop->holding_no??"",
            "areaName"=>$this->_Shop->area_name??"",
            "address" => $this->_Shop->address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "relationType" =>$this->_owners->unique("relation_type")->pluck("relation_type")->implode(", "),
            "guardianName" =>$this->_owners->implode("guardian_name",", "),
            "mobileNo"=>$this->_owners->implode("mobile_no",", "),
            "lastPaymentClear" => $this->_lastPaymentIsClear,            
            "demandAmount"=>$this->_demandAmount,
            "latePenalty"=>$this->_latePenalty,
            "additionalTax"=>$this->_additionalTax,
            "serviceTax"=>$this->_serviceTax,
            "cgst"=>$this->_cgst,
            "sgst"=>$this->_sgst,
            "advanceAmount" => $this->_advanceAmount,
            "demandFrom"=>$this->_fromDate,
            "demandUpto"=>$this->_uptoDate,
            "payableAmount" => roundFigure(
                ($this->_demandAmount + $this->_latePenalty + $this->_serviceTax + $this->_cgst + $this->_sgst +  $this->_additionalTax ) 
                - ($this->_advanceAmount) 
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
