<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class AddUserRequest extends ParentRequest
{
    
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {        
        $user = Auth()->user();
        $this->_MODEL = new User();
        $_modelWard = new UlbWardMaster();
        $_modelRoleTypeMstr = new RoleTypeMstr();
        if(!$this->ulbId){
            $this->merge(["ulbId"=>$user->ulb_id]);
        }

        $userImgDocClosure = function ($attribute, $value, $fail) {
            if($value instanceof UploadedFile){
                // Correct the confusing PDF check logic to simple max size for images
                $maxSize = 5120; // 5MB in KB
                $maxSizeBytes = $maxSize * 1024;
                if ($value->getSize() > $maxSizeBytes) {
                    $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                }
            }
        };

        $signatureImgDocClosure = function ($attribute, $value, $fail) {
            if($value instanceof UploadedFile){
                // Correct the confusing PDF check logic to simple max size for images
                $maxSize = 5120; // 5MB in KB
                $maxSizeBytes = $maxSize * 1024;
                if ($value->getSize() > $maxSizeBytes) {
                    $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                }
            }
        };
        $rules = [
            "id"=>"nullable|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getTable().",id",
            "ulbId"=>($user->can_switch_multi_ulb?"required":"nullable")."|exists:ulb_masters,id",
            "canSwitchMultiUlb"=>"nullable|bool",
            "email"=>"required|email|unique:".$this->_MODEL->getTable().",email".($this->id?(",".$this->id.",id"):""),
            "firstName"=>"required",
            "middleName"=>"nullable",
            "lastName"=>"nullable",
            "guardianName"=>"nullable",
            "phoneNo"=>"nullable|digits:10|regex:/[0-9]{10}/",
            "designation"=>"nullable",                
            "reportTo"=>[
                'nullable',
                'digits_between:1,9223372036854775807',
                Rule::exists($this->_MODEL->getTable(), 'id'),
            ],
            "userFor"=>"required|in:AGENCY,ULB",
            "lockStatus"=>"nullable|bool",
            "userImgDoc"=>[
                "nullable",
                "mimes:bmp,jpeg,jpg,png",
                $userImgDocClosure,
            ],
            "signatureImgDoc"=>[
                "nullable",
                "mimes:bmp,jpeg,jpg,png",
                $signatureImgDocClosure,
            ],
            "roleId"=>"required|int|exists:".$_modelRoleTypeMstr->getTable().",id",
            "wardIds" => "required|array",
            "wardIds.*" => "integer|exists:" . $_modelWard->getTable() . ",id",

        ];
        
        $stringRules = ['required', 'mimes:bmp,jpeg,jpg,png'];
        if($this->userFor=="ULB" && (!$this->id)){
            $stringRules = ['required', 'mimes:bmp,jpeg,jpg,png'];
            $rules['signatureImgDoc'] = array_merge($stringRules, [$signatureImgDocClosure]);
        }
        if($this->userFor=="ULB" && $this->id){
            $testUser = $this->_MODEL->find($this->id);
            if($testUser && (!$testUser->signature_img)){
                $stringRules = ['required', 'mimes:bmp,jpeg,jpg,png'];
                $rules['signatureImgDoc'] = array_merge($stringRules, [$signatureImgDocClosure]);
            }
            
        }
        return $rules;
    }
}
