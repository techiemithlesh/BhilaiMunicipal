<?php

namespace App\Bll\Trade;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseLog;
use App\Models\User;
use Illuminate\Support\Facades\App;

class LicenseReceiptBll
{
    /**
     * Create a new class instance.
     */
    private $_LicenseId;
    private $_tradeData;
    private $_PropertyDetail;
    private $_UserDetail;
    private $_UlbDetail;
    private $_oldWard;
    private $_newWard;
    private $_owners;
    private $_tradeItems;

    public $_GRID;
    public function __construct($licenseId)
    {
        $this->_LicenseId = $licenseId;
    }

    public function loadParam(){
        $this->_tradeData = TradeLicense::find($this->_LicenseId);
        if(!$this->_tradeData){
            $this->_tradeData = TradeLicenseLog::find($this->_LicenseId);
        }
        $this->_UserDetail = User::find($this->_tradeData->approved_user_id);
        if($this->_UserDetail){
            $this->_UserDetail->signature_img = $this->_UserDetail->signature_img ? url('/'.$this->_UserDetail->signature_img) : "";
        }
        $this->_PropertyDetail = PropertyDetail::find($this->_tradeData->property_detail_id);
        $this->_UlbDetail = UlbMaster::find($this->_tradeData->ulb_id);
        if($this->_UlbDetail){
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/'.$this->_UlbDetail->logo_img) : "";
        }
        $this->_oldWard = UlbWardMaster::find($this->_tradeData->ward_mstr_id);
        $this->_newWard = UlbWardMaster::find($this->_tradeData->new_ward_mstr_id);
        $this->_owners = collect($this->_tradeData->getOwners())->sortBy("id");
        $this->_tradeItems = collect($this->_tradeData->getTradeItems()->get())->sortBy("id");
    }

    public function generateReceipt(){
        $this->loadParam();
        $this->_GRID=[
            "description"=>"Municipal Trade License Approval Certificate",
            "department" => "Municipal License",
            "wardNo" =>$this->_oldWard->ward_no??"N/A",
            "newWardNo" =>$this->_newWard->ward_no??"N/A",
            "holdingNo"=>$this->_PropertyDetail->new_holding_no??"",
            "licenseNo"=>$this->_tradeData->license_no,
            "applicationNo"=>$this->_tradeData->application_no,
            "licenseDate"=>$this->_tradeData->license_date,
            "applyDate"=>$this->_tradeData->apply_date,
            "validFrom"=>$this->_tradeData->valid_from,
            "validUpto"=>$this->_tradeData->valid_upto,
            "firmName" => $this->_tradeData->firm_name,
            "firmDescription" => $this->_tradeData->firm_description,
            "firmEstablishmentDate" => $this->_tradeData->firm_establishment_date,
            "premisesOwnerName" => $this->_tradeData->premises_owner_name,
            "address" => $this->_tradeData->address??"",
            "ownerName" =>$this->_owners->implode("owner_name",", "),
            "mobileNo" =>$this->_owners->implode("mobile_no",", "),
            "businessCode"=>"(".$this->_tradeItems->implode("trade_code",", ").")",
            
            "appData"=>$this->_tradeData,
            "ulbDtl" => $this->_UlbDetail,
            "ownerDtl" => $this->_owners,
            "tradeItemDtl"=>$this->_tradeItems,
            "userDtl"=> $this->_UserDetail,
        ];
    }
}
