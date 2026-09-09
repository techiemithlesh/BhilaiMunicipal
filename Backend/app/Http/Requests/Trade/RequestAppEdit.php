<?php

namespace App\Http\Requests\Trade;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\ActiveTradeLicenseOwnerDetail;
use App\Models\Trade\ApplicationTypeMaster;
use App\Models\Trade\FirmTypeMaster;
use App\Models\Trade\OwnershipTypeMaster;
use App\Models\Trade\TradeItemTypeMaster;
use App\Models\Trade\TradeLicense;
use App\Rules\Trade\LicenseYearsDependsOnHolding;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class RequestAppEdit extends ParentRequest
{
    protected $_TradeLicense;
    protected $_ActiveTradeLicense;
    protected $_ActiveTradeLicenseOwnerDetail;
    protected $_ApplicationTypeMaster;
    protected $_OwnershipTypeMaster;
    protected $_FirmTypeMaster;
    protected $_TradeItemTypeMaster;
    protected $_UlbWardMaster;
    protected $_OldWardNewWardMap;
    protected $_UlbMaster;
    protected $_PropertyDetail;

    function __construct(){
        parent::__construct();

        $this->_TradeLicense = new TradeLicense();
        $this->_ActiveTradeLicense = new ActiveTradeLicense();
        $this->_ActiveTradeLicenseOwnerDetail = new ActiveTradeLicenseOwnerDetail();
        $this->_ApplicationTypeMaster = new ApplicationTypeMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_FirmTypeMaster= new FirmTypeMaster();
        $this->_TradeItemTypeMaster = new TradeItemTypeMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_OldWardNewWardMap = new OldWardNewWardMap();
        $this->_UlbMaster = new UlbMaster();
        $this->_PropertyDetail = new PropertyDetail();
   }

   public function rules(): array
    {
        $rules=[
            "id"=>"required|integer|exists:".$this->_ActiveTradeLicense->getConnectionName().".".$this->_ActiveTradeLicense->getTable().",id",        
            "firmTypeId"   => "required|exists:".$this->_ApplicationTypeMaster->getConnectionName().".".$this->_ApplicationTypeMaster->getTable().",id",
            "otherFirmType"=> "nullable|required_if:firmTypeId,5|regex:".$this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "ownershipTypeId"=> "required|exists:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",id",
            "wardMstrId"   => "required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
            "newWardMstrId"=>"nullable|int|exists:".$this->_OldWardNewWardMap->getConnectionName().".".$this->_OldWardNewWardMap->getTable().",new_ward_id".($this->wardMstrId ? ",old_ward_id,".$this->wardMstrId : ""),
            "holdingNo"=>"nullable|exists:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",new_holding_no,lock_status,false",
            "firmName"=>"required|regex:".$this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "firmDescription"=>"required|regex:".$this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "firmEstablishmentDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "premisesOwnerName"=>"required|regex:".$this->_REX_OWNER_NAME,
            "areaInSqft"=>"required|numeric|min:0.1",
            "address"=>"required|regex:".$this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "landmark"=>"nullable|regex:".$this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "pinCode"=>"required|int|regex:/[0-9]{6}/",
            "licenseForYears"=>[
                "required",
                "int",
                "min:1",
                "max:10",
                new LicenseYearsDependsOnHolding($this->holdingNo),

            ],
            "isTobaccoLicense"=>"required:bool",
            "natureOfBusiness"=>"required|array",            
            "natureOfBusiness.*.tradeItemTypeId"=>"required|exists:".$this->_TradeItemTypeMaster->getConnectionName().".".$this->_TradeItemTypeMaster->getTable().",id",
            "ownerDtl"=>"required|array",
            "ownerDtl.*.id"=>[
                    "required",
                    "integer",
                    function($attribute,$value,$fail){

                        if($value&&  !$this->_ActiveTradeLicenseOwnerDetail->where("id",$value)->where("trade_license_id",$this->id)->exists()){
                            $fail("The {$attribute} is invalid.");
                        }
                    }
                ],
            "ownerDtl.*.ownerName"=>"required|regex:".$this->_REX_OWNER_NAME,
            "ownerDtl.*.guardianName"=>"nullable|regex:".$this->_REX_OWNER_NAME,
            "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
            "ownerDtl.*.email"=>"nullable|email",
            "ownerDtl.*.lockStatus"=>"required|bool",
        ];
        return $rules;
    }

}
