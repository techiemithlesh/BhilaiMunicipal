<?php

namespace App\Http\Requests\Water;

use App\Models\Water\MeterTypeMaster;
use Carbon\Carbon;

class RequestAddExistingConsumer extends RequestApplyApplication
{
    protected $_MeterTypeMaster;

    function __construct(){
        parent::__construct();
        $this->_MeterTypeMaster = new MeterTypeMaster();
    }

    public function rules(): array
    {
        $rules = parent::rules();

        $rules["pipelineTypeId"] = "nullable|integer";
        $rules["ownershipTypeId"] = "nullable|integer";

        $rules["areaSqft"] = "nullable|numeric|min:0.1";

        
        $rules["holdingNo"] = [
            "nullable",
            function ($attribute, $value, $fail) {
                if ($value && !$this->_PropertyDetail->where("new_holding_no", $value)->where("lock_status", false)->exists()) {
                    $fail("The {$attribute} is invalid.");
                }
            },
        ];

        // "ownerDtl.*.dob" => "required|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d"),
        $rules["ownerDtl.*.dob"] = "nullable|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d");
        $rules["oldConsumerNo"] = "nullable|string|max:50";
        $rules["connectionDate"] = "nullable|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d");
        $rules["meterTypeId"] = "nullable|exists:" . $this->_MeterTypeMaster->getConnectionName() . "." . $this->_MeterTypeMaster->getTable() . ",id";
        $rules["meterNo"] = "required_if:meterTypeId,1|nullable|string|max:20";
        $rules["initialReading"] = "required_if:meterTypeId,1|nullable|numeric";

        // Meter Declaration is only enforced on the actual create step — the earlier
        // "test" step validates the rest of the form before the file is even attached.
        $documentRules = ["nullable", "mimes:pdf,png,jpg,jpeg", "max:2048"];
        if ($this->route()?->getActionMethod() === "addExistingConsumer") {
            array_unshift($documentRules, "required_if:meterTypeId,1");
        }
        $rules["document"] = $documentRules;

        return $rules;
    }
}
