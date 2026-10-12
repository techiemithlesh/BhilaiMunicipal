<?php

namespace App\Http\Requests\Water;

use App\Models\Water\MeterTypeMaster;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class RequestAddExistingConsumer extends RequestApplyApplication
{
    protected $_MeterTypeMaster;

    public function __construct()
    {
        parent::__construct();
        $this->_MeterTypeMaster = new MeterTypeMaster();
    }

    public function rules(): array
    {
        $rules = parent::rules();
        
        $meterTypeTable = $this->_MeterTypeMaster->getTable();
        $connectionName = $this->_MeterTypeMaster->getConnectionName();

        $newRules = [
            "oldConsumerNo" => "nullable|string|max:50",
            "noOfRoom" => "required|numeric|min:1",
            "meterTypeId" => "required|exists:{$connectionName}.{$meterTypeTable},id",
            "connectionDate" => "required|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d"),
            "initialReading" => "required_if:meterTypeId,1" . ($this->initialReading ? "|numeric" : ""),
            "meterNo" => "required_if:meterTypeId,1",
            "isMeterWorking" => [
                Rule::requiredIf($this->input('meterTypeId') == 1),
                "nullable",
                "boolean",
            ],
            "fixRate" => [
                Rule::requiredIf(function () {
                    return $this->input('meterTypeId') == 1 && in_array($this->input('isMeterWorking'), [0, '0', false], true);
                }),
                "nullable",
                "numeric",
                "min:0",
            ],
            "demandFrom" => "nullable|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d"),
            "arrearAmount" => "nullable|numeric|min:0",
            "document" => [
                "required",
                "mimes:bmp,jpeg,jpg,png,pdf",
                fn ($attribute, $value, $fail) => $this->validateFileSize($attribute, $value, $fail),
            ], 
            "supportingDocument" => [
                "required",
                "mimes:bmp,jpeg,jpg,png,pdf",
                fn ($attribute, $value, $fail) => $this->validateFileSize($attribute, $value, $fail),
            ],         
        ];

        return array_merge($rules, $newRules);
    }

    /**
     * Reusable file size validation helper.
     */
    protected function validateFileSize(string $attribute, $value, $fail): void
    {
        if ($value instanceof UploadedFile) {
            // PDF max size: 10MB (10240 KB), Images max size: 5MB (5120 KB)
            $isPdf = strtolower($value->getClientOriginalExtension()) === 'pdf' || $value->getMimeType() === 'application/pdf';
            $maxSize = $isPdf ? 10240 : 5120; 
            $maxSizeBytes = $maxSize * 1024; // Converted properly to bytes

            if ($value->getSize() > $maxSizeBytes) {
                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
            }
        }
    }
}