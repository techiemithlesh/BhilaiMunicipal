<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class LoginUserUpdateRequest extends ParentRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {        
         $this->_MODEL = new User();
        $this->merge(["id"=>collect(explode("/",$this->path()))->reverse()->values()->first()]);
        $rules = [
            "id"=>"nullable|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getTable().",id",
            "email"=>"required|email|unique:".$this->_MODEL->getTable().",email".($this->id?(",".$this->id.",id"):""),
            "firstName"=>"required",
            "middleName"=>"nullable",
            "lastName"=>"nullable",
            "guardianName"=>"nullable",
            "phoneNo"=>"required|digits:10|regex:/[0-9]{10}/",
            "designation"=>"nullable",  
            "lockStatus"=>"nullable|bool",
            "userImgDoc"=>[
                "nullable",
                "mimes:bmp,jpeg,jpg,png",
                function ($attribute, $value, $fail) {
                    if($value instanceof UploadedFile){
                        $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                        $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                        if ($value->getSize() > $maxSizeBytes) {
                            $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                        }
                    }
                },
            ],
            "signatureImgDoc"=>[
                "nullable",
                "mimes:bmp,jpeg,jpg,png",
                function ($attribute, $value, $fail) {
                    if($value instanceof UploadedFile){
                        $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                        $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                        if ($value->getSize() > $maxSizeBytes) {
                            $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                        }
                    }
                },
            ],
        ];  
        return $rules;
    }
}
