<?php

namespace App\Http\Requests\Property;

use App\Models\Property\PropertyDetail;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class RequestAddExistingProperty extends RequestAddSaf
{
    protected $_PropertyDetail;    
    function __construct(){
        parent::__construct();
        $this->_PropertyDetail = new PropertyDetail();

    }
    public function rules(): array
    {
        $rules = parent::rules();
        $rules["additionDoc"]=[
                    "required",
                    "mimes:bmp,jpeg,jpg,png,pdf",
                    function ($attribute, $value, $fail) {
                        if($value instanceof UploadedFile){
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },

                ];
        $rules["assessmentType"]="nullable";
        $rules["previousHoldingId"]="nullable";
        $rules["demandPaidUpto"]="nullable|date";
        $rules["hasOldHoldingNo"]="required|boolean";
        $rules["holdingNo"] = "nullable|required_if:hasOldHoldingNo,true|unique:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",holding_no";
        return $rules;
    }

    protected function prepareForValidation()
    {
        // Call parent prepareForValidation if it exists in RequestAddSaf
        if (method_exists(parent::class, 'prepareForValidation')) {
            parent::prepareForValidation();
        }

        $this->merge([
            'hasOldHoldingNo' => filter_var($this->hasOldHoldingNo, FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
