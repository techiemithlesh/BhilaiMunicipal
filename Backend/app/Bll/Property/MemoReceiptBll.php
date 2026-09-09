<?php
namespace App\Bll\Property;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\MemoDetail;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafDetail;
use App\Models\User;

class MemoReceiptBll{
    public $_memoId;
    public $_memoDtl;
    public $_propSafData;
    public $_UlbDetail;
    public $_UserDetail;
    public $_oldWard;
    public $_newWard;
    public $_owners;
    public $_safTax;
    public $_GRID;

    function __construct($memoId){
        $this->_memoId = $memoId;
    }

    public function loadParam(){
        $this->_memoDtl = MemoDetail::find($this->_memoId);
        $this->_propSafData = ActiveSafDetail::find($this->_memoDtl->saf_detail_id);
        if(!$this->_propSafData){
            $this->_propSafData = SafDetail::find($this->_memoDtl->saf_detail_id);
        }
        if(!$this->_propSafData){
            $this->_propSafData = RejectedSafDetail::find($this->_memoDtl->saf_detail_id);
        }
        $this->_UserDetail = User::find($this->_memoDtl->user_id);
        if($this->_UserDetail){
            $this->_UserDetail->signature_img = $this->_UserDetail->signature_img ? url('/'.$this->_UserDetail->signature_img) : "";
        }

        $this->_UlbDetail = UlbMaster::find($this->_propSafData->ulb_id);      
        if($this->_UlbDetail){
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/'.$this->_UlbDetail->logo_img) : "";
        } 
        $this->_oldWard = UlbWardMaster::find($this->_propSafData->ward_mstr_id);
        $this->_newWard = UlbWardMaster::find($this->_propSafData->new_ward_mstr_id);
        $this->_owners = collect($this->_propSafData->getOwners())->sortBy("id");
        $this->_safTax = $this->_propSafData->getAllTaxDetail()->get();
    }

    public function generateReceipt(){
        $this->loadParam();
        $this->_GRID = $this->_memoDtl;
        $maxFyear = collect($this->_safTax)->max("fyear");
        $maxQtr = collect($this->_safTax)->where("fyear",$maxFyear)->max("qtr");
        $lastTax = $this->_safTax->where("fyear",$maxFyear)->where("qtr",$maxQtr);
        $ownerArray = [];
        foreach($this->_owners as $value) {
            $ownerArray[] = strtoupper($value['owner_name']).' '.strtoupper($value['relation_type']).' '.strtoupper($value['guardian_name']);
        }

        $mergeData = [
            "effective"=>$maxFyear."/".$maxQtr,
            "ownerName" => collect($ownerArray)->implode(", "),
            "propAddress" => $this->_propSafData->prop_address??"N/A",
            "wardNo" =>$this->_oldWard->ward_no??"N/A",
            "newWardNo" =>$this->_newWard->ward_no??"N/A",
            "holdingNo" => $this->_propSafData->holding_no??"",
            "newHoldingNo" => $this->_memoDtl->holding_no??"",
            "oldHoldingNo"=> in_array($this->_propSafData->assessment_type,["Mutation"])? $this->_propSafData->holding_no : "",
            "saf_no" => $this->_propSafData->saf_no??"",
            "address" => $this->_propSafData->prop_address??"",

            "holdingTax" =>roundFigure(collect($lastTax)->sum("holding_tax")??0),
            "waterTax" =>roundFigure(collect($lastTax)->sum("water_tax")??0),
            "latrineTax" =>roundFigure(collect($lastTax)->sum("latrine_tax")??0),
            "healthCessTax" =>roundFigure(collect($lastTax)->sum("health_cess_tax")??0),
            "educationCessTax" =>roundFigure(collect($lastTax)->sum("education_cess_tax")??0),            
            "rwhTax" =>roundFigure(collect($lastTax)->sum("rwh_tax")??0), 
            "totalTax" =>roundFigure((collect($lastTax)->sum("holding_tax")??0) + (collect($lastTax)->sum("water_tax")??0) + (collect($lastTax)->sum("latrine_tax")??0) + (collect($lastTax)->sum("health_cess_tax")??0) + (collect($lastTax)->sum("education_cess_tax")??0) + (collect($lastTax)->sum("rwh_tax")??0)),            
            "ulbDtl" => $this->_UlbDetail,
            "userDtl"=> $this->_UserDetail,
        ];
        $this->_GRID = collect($this->_GRID)->merge($mergeData)->toArray();
    }
}