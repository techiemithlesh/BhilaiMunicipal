<?php

namespace App\Http\Requests\Common;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class UpdateWardRequest extends AddWardRequest
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
        $rules["wardNo"]=[
            'required',
            Rule::unique($this->_MODEL->getConnectionName().'.'.$this->_MODEL->getTable(), 'ward_no')
                ->where(function ($query){
                    return $query->where('ulb_id', $this->ulbId)
                          ->where("id","<>",$this->id);
                })
        ]; 
        $rules["lockStatus"]="nullable|bool";
        return $rules;
    }
}
