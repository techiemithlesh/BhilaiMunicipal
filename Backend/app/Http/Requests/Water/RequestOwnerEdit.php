<?php

namespace App\Http\Requests\Water;

use App\Http\Requests\ParentRequest;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterActiveApplicationOwner;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class RequestOwnerEdit extends ParentRequest
{
    protected $_WaterActiveApplication;
    protected $_WaterActiveApplicationOwner;

    function __construct(){
        parent::__construct();
        $this->_WaterActiveApplication = new WaterActiveApplication();
        $this->_WaterActiveApplicationOwner = new WaterActiveApplicationOwner();
   }

    public function rules(): array
    {
        $rules = [
            "applicationId"=>"required|integer|exists:".$this->_WaterActiveApplication->getConnectionName().".".$this->_WaterActiveApplication->getTable().",id",
            "ownerDtl" => "required|array",
            "ownerDtl.*.id"=>[
                "required",
                "integer",
                function($attribute,$value,$fail){
                    if(!$this->_WaterActiveApplicationOwner->where("id",$value)->where("application_id",$this->applicationId)->exists()){
                        $fail("The {$attribute} is invalid.");
                    }
                }
            ],
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
