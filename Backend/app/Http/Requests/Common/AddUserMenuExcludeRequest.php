<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use Illuminate\Foundation\Http\FormRequest;

class AddUserMenuExcludeRequest extends ParentRequest
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
        ];
        return $rules;
    }
}
