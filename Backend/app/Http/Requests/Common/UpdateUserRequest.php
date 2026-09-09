<?php

namespace App\Http\Requests\Common;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends AddUserRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {        
        $rules = parent::rules();        
        $this->merge(["id"=>collect(explode("/",$this->path()))->reverse()->values()->first()]);     
        $rules["email"]="required|email|unique:".$this->_MODEL->getTable().",email,".$this->id.",id";          
        $rules["reportTo"]=[
                                'nullable',
                                'digits_between:1,9223372036854775807',
                                Rule::exists($this->_MODEL->getTable(), 'id')->whereNot('id', $this->id),
                            ];
        $rules["lockStatus"]="nullable|bool";
        $rules["id"]="required|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",id";
        if($this->has("password")){
            $this->merge(["password"=>Hash::make($this->password)]);
        }
        
        return $rules;
    }
}
