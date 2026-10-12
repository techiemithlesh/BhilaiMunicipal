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
            "address" => "required|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "landmark" => "required|regex:" . $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
            "pinCode" => "required|int|regex:/[0-9]{6}/",
            "ownerDtl" => "required|array",
            "ownerDtl.*.ownerName" => "required|regex:" . $this->_REX_OWNER_NAME,
            "ownerDtl.*.guardianName" => "nullable|regex:" . $this->_REX_OWNER_NAME,
            "ownerDtl.*.mobileNo" => "required|digits:10|regex:/^[0-9]{10}$/",
        ];

        return $rules;

    }
}
