<?php

namespace App\Http\Requests\Water;

use Laravel\Sanctum\PersonalAccessToken;

class RequestTaxReview extends RequestApplyApplication
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $tokens =  PersonalAccessToken::findToken($this->bearerToken());
        if($tokens){
            $user = $tokens->tokenable;
            $ulbId = $user ? $user->ulb_id : null;
            if(!$this->ulbId){
                $this->merge(["ulbId"=>$ulbId]);
            }
        }
        $rules["ownerDtl"]="nullable";
        return $rules;
    }
}
