<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use Illuminate\Foundation\Http\FormRequest;

class RequestSendOtpUpdate extends ParentRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $rules = [
            'email' => 'required_without_all:mobile,userName'.($this->email ? "|email":""),
            'mobile' => 'required_without_all:email,userName|digits:10',
            'userName' => 'required_without_all:email,mobile|digits:10',
            "userType"=>"nullable|string|in:Citizen",
            "otpType" => "nullable|string|in:Forgot Password,Register,Attach Holding,Update Mobile,Login",
        ];
        if($this->mobile){
            $this->merge(["phoneNo" => $this->mobile]);
        }
        return $rules;
    }
}
