<?php

namespace App\Http\Requests\Common;

use App\Models\DBSystem\MobileMenuMaster;
use App\Models\DBSystem\WebMenuMaster;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class UpdateMobileMenuRequest extends UpdateMenuRequest
{
    
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $this->_MODEL = new MobileMenuMaster();
        $rule = parent::rules();
        $rule["id"] = "required|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",id";
        
        $rule["lockStatus"] = "nullable|bool";
                
        return $rule;
    }
}
