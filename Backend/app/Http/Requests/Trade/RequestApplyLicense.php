<?php

namespace App\Http\Requests\Trade;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Trade\ApplicationTypeMaster;
use App\Models\Trade\FirmTypeMaster;
use App\Models\Trade\OwnershipTypeMaster;
use App\Models\Trade\TradeItemTypeMaster;
use App\Models\Trade\TradeLicense;
use App\Rules\Trade\LicenseYearsDependsOnHolding;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class RequestApplyLicense extends ParentRequest
{
    protected $_TradeLicense;
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
        $user = Auth::user();
        $ulbId = $user ? $user->ulb_id : null;
        if(!$this->ulbId){
            $this->merge(["ulbId"=>$ulbId]);
        }
        $rules=[
            "applicationType"=> "required|in:NEW LICENSE,RENEWAL,AMENDMENT,SURRENDER",
            "priviesLicenseId"=> "nullable|required_unless:applicationType,NEW LICENSE|exists:".$this->_TradeLicense->getConnectionName().".".$this->_TradeLicense->getTable().",id,lock_status,false",
            "ulbId"=>"required|int|exists:".$this->_UlbMaster->getConnectionName().".".$this->_UlbMaster->getTable().",id",        
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
            "ownerDtl"=>"required|array",
            "ownerDtl.*.ownerName"=>"required|regex:".$this->_REX_OWNER_NAME,
            "ownerDtl.*.guardianName"=>"nullable|regex:".$this->_REX_OWNER_NAME,
            "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
            "ownerDtl.*.email"=>"nullable|email",
        ];
        return $rules;
    }

    public function messages(): array
    {
        return [
            'applicationType.required' => 'The application type is mandatory.',
            'applicationType.in' => 'The selected application type is invalid.',
            
            'priviesLicenseId.required_unless' => 'Previous License ID is required for renewal, amendment, or surrender applications.',
            'priviesLicenseId.exists' => 'The provided Previous License ID is invalid or locked.',

            'ulbId.exists' => 'The ULB you are applying for does not exist in our system.',

            'firmTypeId.exists' => 'The Firm Type selected is invalid.',

            'otherFirmType.required_if' => 'Please specify the "Other Firm Type".',
            
            'newWardMstrId.exists' => 'The new Ward ID provided does not match the old Ward ID.',

            'holdingNo.exists' => 'The provided Holding Number is either invalid or locked for use.',
            
            'firmEstablishmentDate.before_or_equal' => 'The establishment date cannot be a future date.',

            'areaInSqft.min' => 'Area in square feet must be greater than zero.',
            'areaInSqft.numeric' => 'Area in square feet must be a number.',
            
            'pinCode.regex' => 'Pincode must be exactly 6 digits.',
            'natureOfBusiness.*.tradeItemTypeId.required' => 'Please select all trade items for the nature of business.',
            'natureOfBusiness.*.tradeItemTypeId.exists' => 'One or more selected trade items are invalid.',
            'ownerDtl.*.ownerName.required' => 'Owner name is mandatory for all owners.',
            'ownerDtl.*.mobileNo.required' => 'Mobile number is required for all owners.',
            'ownerDtl.*.mobileNo.digits' => 'Mobile number must be exactly 10 digits.',
            'ownerDtl.*.mobileNo.regex' => 'Mobile number format is invalid.',
            'ownerDtl.*.email.email' => 'The email address is not in a valid format.',
            'licenseForYears.max' => 'You can apply for a maximum of 10 years.',
            'licenseForYears.min' => 'You must apply for at least 1 year.',
        ];
    }
}
