<?php

namespace App\Http\Requests\Property;

use App\Http\Requests\ParentRequest;
use Illuminate\Foundation\Http\FormRequest;

class RequestPostNextLevel extends ParentRequest
{
    

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            "id"=>"required|digits_between:1,9223372036854775807",
            "remarks"=>"required",
            "status"=>"required|in:BTC,FORWARD,BACKWARD,APPROVED,REJECT",
        ];
        return $rules;
    }
}
