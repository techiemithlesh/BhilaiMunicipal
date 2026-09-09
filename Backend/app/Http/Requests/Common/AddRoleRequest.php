<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\RoleTypeMstr;

class AddRoleRequest extends ParentRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $this->_MODEL = new RoleTypeMstr();
        $rules = [
            "roleName"=>"required|max:60|unique:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",role_name",
            "userFor"=>"required|in:ULB,AGENCY"
        ];
        return $rules;
    }
}
