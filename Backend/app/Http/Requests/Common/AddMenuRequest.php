<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use Carbon\Carbon;

class AddMenuRequest extends ParentRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rule = [
            "role"=>"nullable|array",
            "role.*.roleId"=>"nullable|int",
            "role.*.read"  =>'nullable|bool|required_with:role.*.roleId',
            "role.*.write" => 'nullable|bool|required_with:role.*.roleId',
            "role.*.delete" => 'nullable|bool|required_with:role.*.roleId',
            "role.*.update"=>'nullable|bool|required_with:role.*.roleId',
            "menuName" => "nullable", 
            "parentId" => "required",
            "url"=>"nullable",
            "queryString"=>"nullable",
            "serialNo"=>"required",
            "icon"=>"nullable",
            "description"=>"nullable"
        ];
        return  $rule;
    }
}
