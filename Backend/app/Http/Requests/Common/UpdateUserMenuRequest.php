<?php

namespace App\Http\Requests\Common;

use App\Models\DBSystem\WebUserMenuInclude;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserMenuRequest extends AddUserMenuRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $this->_MODEL = new WebUserMenuInclude();
        $rules = parent::rules();
        $rules["id"] = "required|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",id";
        
        $rules["lockStatus"] = "nullable|bool";
        return $rules;
    }
}
