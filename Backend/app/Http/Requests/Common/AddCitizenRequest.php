<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use App\Models\Citizen;

class AddCitizenRequest extends ParentRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {     
        $this->_MODEL = new Citizen();
        $rules = [
            "name"=>"required|regex:".$this->_REX_OWNER_NAME,
            "phoneNo"=>"required|digits:10|regex:/[0-9]{10}/|unique:".$this->_MODEL->getTable().",phone_no",

        ];
        return $rules;
    }
}
