<?php

namespace App\Http\Requests\Property;

use App\Http\Requests\ParentRequest;
use App\Models\Property\ActiveSafOwnerDetail;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class RequestSafOwnerEdit extends ParentRequest
{
    protected $_ActiveSafOwnerDetail;

    function __construct(){
        parent::__construct();
        $this->_ActiveSafOwnerDetail = new ActiveSafOwnerDetail();
   }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
                "id"=>"required|int|exists:".$this->_ActiveSafOwnerDetail->getConnectionName().".".$this->_ActiveSafOwnerDetail->getTable().",id",
                "ownerName"=>"required|string|regex:".$this->_REX_OWNER_NAME,
                "guardianName"=>"nullable",
                "relationType"=>"nullable|required_with:guardianName|in:S/O,D/O,W/O,C/O",
                "mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
                "email"=>"nullable|email",
                "panNo"=>"nullable|string|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/",
                "aadharNo"=>"nullable|digits:12|regex:/[0-9]{12}/",
                "gender"=>"required|in:Male,Female,Other",
                "dob"=>"required|date|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "isArmedForce"=>"required|bool",
                "isSpeciallyAbled"=>"required|bool",
                "remarks"=>"required|string",
                "document"=>[
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

                ]
            ];
        return $rules;
    }
}
