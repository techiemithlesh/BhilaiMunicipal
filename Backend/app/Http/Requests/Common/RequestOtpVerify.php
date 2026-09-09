<?php

namespace App\Http\Requests\Common;

class RequestOtpVerify extends RequestSendOtpUpdate
{
    
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules["otp"]= "required|digits_between:0,9999999999";
        if($this->userType=='Citizen')
        {
            $this->merge(["userType"=>"citizens"]);
            $rules["userType"]= "nullable|string|in:citizens";
        }
        return $rules;
    }
}
