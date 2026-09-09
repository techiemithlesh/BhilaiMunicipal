<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;

class AddUserMenuRequest extends ParentRequest
{
    
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules=[
            "userId"=>"required",
            "menus"=>"required|array",
            "menus.*.menuId"=>"required",
            "menus.*.description"=>"nullable",
            "menus.*.read"=>"nullable|bool",
            "menus.*.write"=>"nullable|bool",
            "menus.*.delete"=>"nullable|bool",
            "menus.*.update"=>"nullable|bool"
        ];
        return $rules;
    }
}
