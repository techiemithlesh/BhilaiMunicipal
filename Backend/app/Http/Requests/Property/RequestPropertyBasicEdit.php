<?php

namespace App\Http\Requests\Property;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class RequestPropertyBasicEdit extends ParentRequest
{
    protected $_PropertyDetail;
    protected $_UlbWardMaster;
    protected $_OldWardNewWardMap;
    protected $_UlbMaster;

    function __construct(){
        parent::__construct();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_OldWardNewWardMap = new OldWardNewWardMap();
        $this->_UlbMaster = new UlbMaster();
   }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
                "id"=>"required|int|exists:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",id",
                "wardMstrId"=>"required|int|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
                "newWardMstrId"=>"nullable|int|exists:".$this->_OldWardNewWardMap->getConnectionName().".".$this->_OldWardNewWardMap->getTable().",new_ward_id".($this->wardMstrId ? ",old_ward_id,".$this->wardMstrId : ""),
                "khataNo"=>"nullable|string|regex:".$this->_REX_ALPHA_NUM_DOT_SPACE,
                "plotNo"=>"nullable|string|regex:".$this->_REX_ALPHA_NUM_DOT_SPACE,
                "villageMaujaName"=>"nullable|string|regex:".$this->_REX_ALPHA_NUM_DOT_SPACE,
                "areaOfPlot"=>"required|numeric|min:0.1",
                "builtupArea"=>"required|numeric|min:0".($this->areaOfPlot ? "|max:".($this->areaOfPlot) : ""),
                "propAddress"=>"required|string|regex:".$this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL,
                "propCity"=>"required|string|regex:".$this->_REX_ALPHA_NUM_DOT_SPACE,
                "propDist"=>"required|string|regex:".$this->_REX_ALPHA_NUM_DOT_SPACE,
                "propPinCode"=>"required|digits:6|regex:/[0-9]{6}/",
                "propState"=>"required|string|regex:".$this->_REX_ALPHA_NUM_DOT_SPACE,
                "remarks"=>"required|string",
                "document"=>[
                    "required",
                    "mimes:bmp,jpeg,jpg,png,pdf",
                    function ($attribute, $value, $fail) {
                        if($value instanceof UploadedFile){
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },

                ]
            ];
        return $rules;
    }
}
