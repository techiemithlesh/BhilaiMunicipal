<?php

namespace App\Http\Requests\ShopRent;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\ShopRent\AreaMaster;
use App\Models\ShopRent\SamitiMaster;
use App\Models\ShopRent\ShopTypeMaster;
use App\Models\ShopRent\YojnaMaster;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class AddShopRentRequest extends ParentRequest
{
    protected $_UlbWardMaster;
    protected $_UlbMaster;

    protected $_PropertyDetail;

    protected $_YojnaMaster;
    protected $_SamitiMaster;
    protected $_ShopTypeMaster;
    protected $_AreaMaster;

    function __construct(){
            parent::__construct();
            $this->_UlbWardMaster = new UlbWardMaster();;
            $this->_UlbMaster = new UlbMaster();

            $this->_PropertyDetail = new PropertyDetail();

            $this->_YojnaMaster = new YojnaMaster();
            $this->_SamitiMaster = new SamitiMaster();
            $this->_ShopTypeMaster = new ShopTypeMaster();  
            $this->_AreaMaster = new AreaMaster();       
    }
    
    public function rules(): array
    {
        $user = Auth()->user();
        $ulbId = $user ? $user->ulb_id : null;
        if(!$this->ulbId){
            $this->merge(["ulbId"=>$ulbId]);
        }
        $currentMonth = Carbon::now()->format('Y-m');
        $rules = [
            "ulbId" => "required|integer|exists:" . $this->_UlbMaster->getConnectionName() . "." . $this->_UlbMaster->getTable() . ",id",
            "holdingNo"=>[
                "nullable",
                function ($attribute, $value, $fail) {
                    $property = $this->_PropertyDetail->where("new_holding_no", $value)->where("lock_status",false)->where("ulb_id",$this->ulbId)->exists();
                    if (!$property) {
                        $fail("The {$attribute} is invalid.");
                    }
                },
            ],
            "wardMstrId"=>"required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
            "shopNo"=>"nullable",
            "regNo"=>"nullable",
            "yojnaId"=>"nullable|exists:".$this->_YojnaMaster->getConnectionName().".".$this->_YojnaMaster->getTable().",id,lock_status,false",
            "samitiId"=>"nullable|exists:".$this->_SamitiMaster->getConnectionName().".".$this->_SamitiMaster->getTable().",id,lock_status,false",
            "shopTypeId"=>"required|exists:".$this->_ShopTypeMaster->getConnectionName().".".$this->_ShopTypeMaster->getTable().",id,lock_status,false",
            "areaId"=>"required|exists:".$this->_AreaMaster->getConnectionName().".".$this->_AreaMaster->getTable().",id,lock_status,false",
            "premiumAmt"=>"nullable|numeric|min:0",
            "address"=>"required|min:5",
            "pinCode"=>"required|int|regex:/[0-9]{6}/",  
            "effectiveDate" => [
                "required",
                "date_format:Y-m",
                "before_or_equal:" . $currentMonth,
            ],
            "monthlyRate" =>"required|numeric|min:1",
            // "isPenaltyAdd" =>"required|boolean",
            // "isPenaltyOnPercent" =>"nullable|required_if:isPenaltyAdd,true,1|boolean",
            // "isMonthlyPenalty" =>"nullable|required_if:isPenaltyAdd,true,1|boolean",
            // "penaltyAmount" =>"nullable|required_if:isPenaltyAdd,true,1|numeric|min:0", 
            "document" =>[
                "required",
                "mimes:bmp,jpeg,jpg,png,pdf",
                fn ($attribute, $value, $fail) => $this->validateFileSize($attribute, $value, $fail),
            ], 

            "ownerDtl"=>"required|array",
            "ownerDtl.*.ownerName"=>"required",
            "ownerDtl.*.guardianName"=>"nullable",
            "ownerDtl.*.relationType"=>"nullable|required_with:ownerDtl.*.guardianName|in:S/O,D/O,W/O,C/O",
            "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
        ];
        return $rules;
    }
}
