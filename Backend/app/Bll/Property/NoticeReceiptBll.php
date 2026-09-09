<?php

namespace App\Bll\Property;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyNotice;
use App\Models\User;

class NoticeReceiptBll
{
    /**
     * Create a new class instance.
     */
    public $_GRID;
    private $_NoticeId;

    
    private $_UserDetail;
    private $_UlbDetail;
    private $_oldWard;
    private $_newWard;
    
    private $_PropertyNotice;
    private $_propSafData;
    private $_owners;
    function __construct($noticeId)
    {
        $this->_NoticeId = $noticeId;

    }

    public function loadParam(){
        $this->_PropertyNotice = PropertyNotice::find($this->_NoticeId);        
        $this->_propSafData = PropertyDetail::find($this->_PropertyNotice->property_detail_id); 
        $this->_UserDetail = User::find($this->_PropertyNotice->approved_by);        
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
    }

    public function generateReceipt(){
        $this->loadParam();
        $this->_GRID=[
            "description"=>"राजस्व शाखा",
            "noticeNo"=>$this->_PropertyNotice->notice_no,
            "noticeDate"=>$this->_PropertyNotice->notice_date,
            "department" => "Revenue Section",
            "wardNo" =>$this->_oldWard->ward_no??"N/A",
            "newWardNo" =>$this->_newWard->ward_no??"N/A",
            "accountDescription" => "Holding Tax & Others",
            "holdingNo" => $this->_propSafData->holding_no??"",
            "newHoldingNo" => $this->_propSafData->new_holding_no??"",
            "address" => $this->_propSafData->prop_address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "guardianName" =>$this->_owners->implode("guardian_name",", "),
            "mobileNo" =>$this->_owners->implode("mobile_no",", "),
            "paymentStatus" => $this->_PropertyNotice->is_clear ? "Clear":"Pending",
            "fromFyear"=>$this->_PropertyNotice->from_fyear,
            "uptoFyear"=>$this->_PropertyNotice->upto_fyear,
            "fromQtr"=>$this->_PropertyNotice->from_qtr,
            "uptoQtr"=>$this->_PropertyNotice->upto_qtr,
            "fromDate"=>FyearQutFromDate($this->_PropertyNotice->from_fyear,$this->_PropertyNotice->from_qtr),
            "uptoDate"=>FyearQutUptoDate($this->_PropertyNotice->upto_fyear,$this->_PropertyNotice->upto_qtr),

            "demandAmount" =>roundFigure($this->_PropertyNotice->demand_amount??0),
            "penalty" =>roundFigure($this->_PropertyNotice->penalty??0),
            "arrearDemandAmount" =>roundFigure($this->_PropertyNotice->arrear_demand_amount??0),
            "arrearPenalty" =>roundFigure($this->_PropertyNotice->arrear_penalty??0),
            "noticePenalty" =>roundFigure(($this->_PropertyNotice->arrear_demand_amount??0 + $this->_PropertyNotice->arrear_penalty??0) * 0.01),
            
            "propertyDtl"=>$this->_propSafData,
            "notice" => $this->_PropertyNotice,
            "ulbDtl" => $this->_UlbDetail,
            "ownerDtl" => $this->_owners,
            "userDtl"=> $this->_UserDetail,
        ];
        $this->_GRID["payableAmount"] = roundFigure($this->_GRID["noticePenalty"] + $this->_GRID["penalty"] + $this->_GRID["demandAmount"]);
    }
}
