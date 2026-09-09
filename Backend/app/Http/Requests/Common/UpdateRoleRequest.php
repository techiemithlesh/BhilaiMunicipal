<?php

namespace App\Http\Requests\Common;

use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
class UpdateRoleRequest extends AddRoleRequest
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
        $rules["id"]="required|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",id";
        $rules["roleName"]=[
            'required',
            Rule::unique($this->_MODEL->getConnectionName().'.'.$this->_MODEL->getTable(), 'role_name')
                ->where(function ($query){
                    return $query->where("id","<>",$this->id);
                })
        ]; 
        $rules["lockStatus"]="nullable|bool";
        return $rules;
    }
}
