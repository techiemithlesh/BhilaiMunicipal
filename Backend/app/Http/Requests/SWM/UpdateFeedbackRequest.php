<?php

namespace App\Http\Requests\SWM;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeedbackRequest extends AddFeedbackRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules["id"]="required|digits_between:1,9223372036854775807|exists:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",id";
        $rules["feedback"]=[
            'required',
            Rule::unique($this->_MODEL->getConnectionName().'.'.$this->_MODEL->getTable(), 'feedback')
                ->where(function ($query){
                    return $query->where("id","<>",$this->id);
                })
        ]; 
        $rules["lockStatus"]="nullable|bool";
        return $rules;
    }
}
