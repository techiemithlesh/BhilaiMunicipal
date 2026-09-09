<?php

namespace App\Bll\Trade;

use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\RejectedTradeLicense;
use App\Models\Trade\RejectedTradeLicenseNatureOfBusiness;
use App\Models\Trade\RejectedTradeLicenseOwnerDetail;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseLog;
use App\Models\Trade\TradeLicenseNatureOfBusiness;
use App\Models\Trade\TradeLicenseNatureOfBusinessLog;
use App\Models\Trade\TradeLicenseOwnerDetail;
use App\Models\Trade\TradeLicenseOwnerDetailsLog;
use App\Trait\Trade\TradeTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

class TradeApproveBll
{
    use TradeTrait;
    /**
     * Create a new class instance.
     */
    public $_TradeId;
    public $_LicenseNo;
    public $_User;
    public $_ValidFrom;
    public $_ValidUpto;
    public $_OldLicense;
    public $_Owners;
    public $_NatureOfBusiness;
    
    private $_REQUEST;
    private $_TradeLicense;
    private $_TradeLicenseNatureOfBusiness;
    private $_TradeOwnerDetail;
    private $_ActiveTradeLicense;
    public function __construct($tradeId)
    {
        $this->_TradeId = $tradeId;
        $this->_User = Auth::user();
        $this->_REQUEST = new Request();   
        $this->_TradeLicense = new TradeLicense();
        $this->_TradeLicenseNatureOfBusiness = new TradeLicenseNatureOfBusiness();
        $this->_TradeOwnerDetail = new TradeLicenseOwnerDetail();
        $this->loadParam();
    }

    private function loadParam(){
        $this->_ActiveTradeLicense = ActiveTradeLicense::find($this->_TradeId);
        $this->_Owners = $this->_ActiveTradeLicense->getOwners();
        $this->_NatureOfBusiness = $this->_ActiveTradeLicense->getNatureOfBusiness();
        $this->_LicenseNo = $this->generateLicenseNo($this->_ActiveTradeLicense->id);
        $this->_OldLicense = TradeLicense::find($this->_ActiveTradeLicense->privies_license_id);
        $applicationType = Config::get("TradeConstant.APPLICATION-TYPE");
        $this->_ValidFrom = $this->_ActiveTradeLicense->valid_from;        
        $this->_ValidUpto = Carbon::parse($this->_ValidFrom)->addYears($this->_ActiveTradeLicense->license_for_years)->format("Y-m-d");
        if($applicationType["SURRENDER"]==$this->_ActiveTradeLicense->application_type_id){
            $this->_ValidUpto = $this->_OldLicense->valid_upto;
        }
    }

    private function transFerLog(){
        $replicate = $this->_OldLicense->replicate();
        $replicate->id = $this->_OldLicense->id;
        $replicate->setTable((new TradeLicenseLog())->getTable());
        $replicate->save();
        $oldOwners = TradeLicenseOwnerDetail::where("trade_license_id",$this->_OldLicense->id)->get();
        $oldNatureOfBusiness = TradeLicenseNatureOfBusiness::where("trade_license_id",$this->_OldLicense->id)->get();
        foreach($oldOwners as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new TradeLicenseOwnerDetailsLog())->getTable());
            $owner->save();
            $val->forceDelete();
        }
        foreach($oldNatureOfBusiness as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new TradeLicenseNatureOfBusinessLog())->getTable());
            $owner->save();
            $val->forceDelete();
        }
    
        $this->_OldLicense->forceDelete();
    }

    public function approveLicense(){
        $replicate = $this->_ActiveTradeLicense->replicate();
        $replicate->id = $this->_ActiveTradeLicense->id;
        $replicate->license_date = Carbon::now()->format("Y-m-d") ;
        $replicate->license_no = $this->_LicenseNo;
        $replicate->valid_upto = $this->_ValidUpto ;
        $replicate->approved_date = Carbon::now() ;
        $replicate->approved_user_id = $this->_User->id ;
        $replicate->setTable((new TradeLicense())->getTable());
        $replicate->save();
        $this->_ActiveTradeLicense->forceDelete();
        foreach($this->_Owners as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new TradeLicenseOwnerDetail())->getTable());
            $owner->save();
            $val->forceDelete();
        }
        foreach($this->_NatureOfBusiness as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new TradeLicenseNatureOfBusiness())->getTable());
            $owner->save();
            $val->forceDelete();
        }
        if($this->_OldLicense){
            $this->transFerLog();
        }
    }

    public function rejectLicense(){
        $replicate = $this->_ActiveTradeLicense->replicate();
        $replicate->id = $this->_ActiveTradeLicense->id;
        $replicate->license_no = $this->_LicenseNo;
        $replicate->valid_upto = $this->_ValidUpto ;
        $replicate->approved_date = Carbon::now() ;
        $replicate->approved_user_id = $this->_User->id ;
        $replicate->setTable((new RejectedTradeLicense())->getTable());
        $replicate->save();
        $this->_ActiveTradeLicense->forceDelete();
        foreach($this->_Owners as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new RejectedTradeLicenseOwnerDetail())->getTable());
            $owner->save();
            $val->forceDelete();
        }
        foreach($this->_NatureOfBusiness as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new RejectedTradeLicenseNatureOfBusiness())->getTable());
            $owner->save();
            $val->forceDelete();
        }
    }

    
}
