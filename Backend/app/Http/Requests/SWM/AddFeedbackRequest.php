<?php

namespace App\Http\Requests\SWM;

use App\Http\Requests\ParentRequest;
use App\Models\SWM\FeedbackMaster;
use Illuminate\Foundation\Http\FormRequest;

class AddFeedbackRequest extends ParentRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function rules(): array
    {
        $this->_MODEL = new FeedbackMaster();
        $rules = [
            "feedback"=>"required|max:60|unique:".$this->_MODEL->getConnectionName().".".$this->_MODEL->getTable().",feedback",
        ];
        return $rules;
    }
}
