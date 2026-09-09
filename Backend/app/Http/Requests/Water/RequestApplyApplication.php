<?php

namespace App\Http\Requests\Water;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\PropertyDetail;
use App\Models\Property\SafDetail;
use App\Models\Water\ConnectionThroughMaster;
use App\Models\Water\ConnectionTypeMaster;
use App\Models\Water\OwnershipTypeMaster;
use App\Models\Water\PipelineTypeMaster;
use App\Models\Water\PropertyTypeMaster;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class RequestApplyApplication extends ParentRequest
{
    protected $_ConnectionTypeMaster;
    protected $_PropertyTypeMaster;
    protected $_ConnectionThroughMaster;
    protected $_PipelineTypeMaster;
    protected $_OwnershipTypeMaster;
    protected $_ActiveSafDetail;
    protected $_SafDetail;
    protected $_PropertyDetail;
    protected $_UlbWardMaster;
    protected $_OldWardNewWardMap;
    protected $_UlbMaster;

    function __construct(){
        parent::__construct();

        $this->_ConnectionTypeMaster = new ConnectionTypeMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_ConnectionThroughMaster = new ConnectionThroughMaster();
        $this->_PipelineTypeMaster= new PipelineTypeMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_SafDetail = new SafDetail();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_OldWardNewWardMap = new OldWardNewWardMap();
        $this->_UlbMaster = new UlbMaster();
   }

    public function rules(): array
    {
        $user = Auth::user();
        $ulbId = $user ? $user->ulb_id : null;

        if (!$this->ulbId) {
            $this->merge(["ulbId" => $ulbId]);
        }

        $rules = [
            "ulbId" => "required|integer|exists:" . $this->_UlbMaster->getConnectionName() . "." . $this->_UlbMaster->getTable() . ",id",

            "connectionTypeId" => "required|integer|exists:" . $this->_ConnectionTypeMaster->getConnectionName() . "." . $this->_ConnectionTypeMaster->getTable() . ",id",

            "propertyTypeId" => "required|integer|exists:" . $this->_PropertyTypeMaster->getConnectionName() . "." . $this->_PropertyTypeMaster->getTable() . ",id",

            "connectionThroughId" => "required|integer|exists:" . $this->_ConnectionThroughMaster->getConnectionName() . "." . $this->_ConnectionThroughMaster->getTable() . ",id",

            "category" => "required|string|in:APL,BPL",

            "pipelineTypeId" => "required|integer|exists:" . $this->_PipelineTypeMaster->getConnectionName() . "." . $this->_PipelineTypeMaster->getTable() . ",id",

            "ownershipTypeId" => "required|integer|exists:" . $this->_OwnershipTypeMaster->getConnectionName() . "." . $this->_OwnershipTypeMaster->getTable() . ",id",

            "safNo" => [
                "required_if:connectionThroughId,2",
                function ($attribute, $value, $fail) {
                    $activeSaf = $this->_ActiveSafDetail->where("saf_no", $value)->where("lock_status",false)->exists();
                    $saf = $this->_SafDetail->where("saf_no", $value)->where("lock_status",false)->exists();
                    if (!$activeSaf && !$saf && $this->connectionThroughId==2) {
                        $fail("The {$attribute} is invalid.");
                    }
                },
            ],

            "holdingNo" => [
                "required_if:connectionThroughId,1",
                function ($attribute, $value, $fail) {
                    $property = $this->_PropertyDetail->where("new_holding_no", $value)->where("lock_status",false)->exists();
                    if (!$property && $this->connectionThroughId==1) {
                        $fail("The {$attribute} is invalid.");
                    }
                },
            ],

            "wardMstrId" => "required|integer|exists:" . $this->_UlbWardMaster->getConnectionName() . "." . $this->_UlbWardMaster->getTable() . ",id",

            "newWardMstrId" => "nullable|integer|exists:" .
                $this->_OldWardNewWardMap->getConnectionName() . "." .
                $this->_OldWardNewWardMap->getTable() . ",new_ward_id" .
                ($this->wardMstrId ? ",old_ward_id," . $this->wardMstrId : ""),

            "areaSqft" => "required|numeric|min:0.1",
            "address" => "required|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "landmark" => "required|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "pinCode" => "required|int|regex:/[0-9]{6}/",

            "electConsumerNo" => "nullable|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "electAccNo" => "nullable|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "electBindBookNo" => "nullable|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "electConsCategory" => "nullable|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,

            "ownerDtl" => "required|array",
            "ownerDtl.*.ownerName" => "required|regex:" . $this->_REX_OWNER_NAME,
            "ownerDtl.*.guardianName" => "nullable|regex:" . $this->_REX_OWNER_NAME,
            "ownerDtl.*.dob" => "required|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d"),
            "ownerDtl.*.mobileNo" => "required|digits:10|regex:/^[0-9]{10}$/",
            "ownerDtl.*.email" => "nullable|email",
            "ownerDtl.*.panNo" => "nullable|string|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/",
            "ownerDtl.*.aadharNo" => "nullable|digits:12|regex:/^[0-9]{12}$/",
            "ownerDtl.*.gender" => "nullable|in:Male,Female,Other",
        ];

        return $rules;

    }
}
