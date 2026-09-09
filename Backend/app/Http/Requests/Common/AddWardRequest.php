<?php

namespace App\Http\Requests\Common;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Validation\Rule;

class AddWardRequest extends ParentRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = Auth()->user();
        $ulbId = $user->ulb_id;
        $this->_MODEL = new UlbWardMaster();
        $this->_MODEl_PARENT = new UlbMaster();
        $rule = [
            "ulbId"=>"required|exists:".$this->_MODEl_PARENT->getConnectionName().".".$this->_MODEl_PARENT->getTable().",id",
            "wardNo" => [
                'required',
                Rule::unique($this->_MODEL->getConnectionName().'.'.$this->_MODEL->getTable(), 'ward_no')
                    ->where(function ($query){
                        return $query->where('ulb_id', $this->ulbId);
                    })
            ],
        ];
        return $rule;
    }
}
