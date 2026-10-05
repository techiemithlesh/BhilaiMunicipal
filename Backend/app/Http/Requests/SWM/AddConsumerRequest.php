<?php

namespace App\Http\Requests\SWM;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\SWM\CategoryTypeMaster;
use App\Models\SWM\SubCategoryTypeMaster;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AddConsumerRequest extends ParentRequest
{
    protected $_UlbWardMaster;
    protected $_UlbMaster;

    protected $_CategoryTypeMaster;
    protected $_SubCategoryTypeMaster;
    protected $_PropertyDetail;

   function __construct(){
        parent::__construct();
        $this->_UlbWardMaster = new UlbWardMaster();;
        $this->_UlbMaster = new UlbMaster();

        $this->_CategoryTypeMaster = new CategoryTypeMaster();
        $this->_SubCategoryTypeMaster = new SubCategoryTypeMaster();         
        $this->_PropertyDetail = new PropertyDetail();
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
            "wardMstrId"=>"required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
            "holdingNo"=>[
                "required",
                function ($attribute, $value, $fail) {
                    $property = $this->_PropertyDetail->where("new_holding_no", $value)->where("lock_status",false)->exists();
                    if (!$property) {
                        $fail("The {$attribute} is invalid.");
                    }
                },
            ],
            // "houseNo"=>"",
            "address"=>"required|min:5",
            "pinCode"=>"required|int|regex:/[0-9]{6}/",            

            "ownerDtl"=>"required|array",
            "ownerDtl.*.ownerName"=>"required",
            "ownerDtl.*.guardianName"=>"nullable",
            "ownerDtl.*.relationType"=>"nullable|required_with:ownerDtl.*.guardianName|in:S/O,D/O,W/O,C/O",
            "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
            "ownerDtl.*.email"=>"nullable|email",

            // Date of Effect (YYYY-MM format, restricted to current or past months)
            "dateOfEffective" => [
                "required",
                "date_format:Y-m",
                "before_or_equal:" . $currentMonth,
            ],

            // Connection Details
            "connectionDtl" => "required|array|min:1",
            "connectionDtl.*.categoryTypeMasterId" => [
                "required",
                Rule::exists($this->_CategoryTypeMaster->getConnectionName() . "." . $this->_CategoryTypeMaster->getTable(), "id")
                    ->where(function ($query) {
                        $query->where("lock_status", false);
                    }),
            ],
            "connectionDtl.*.subCategoryTypeMasterId" => [
                "required",
                function ($attribute, $value, $fail) {
                    // Extract index from connectionDtl.0.subCategoryTypeMasterId
                    preg_match('/connectionDtl\.(\d+)\.subCategoryTypeMasterId/', $attribute, $matches);
                    $index = $matches[1] ?? null;

                    if ($index !== null) {
                        $categoryId = $this->input("connectionDtl.{$index}.categoryTypeMasterId");
                        $exists = $this->_SubCategoryTypeMaster
                            ->where("id", $value)
                            ->where("category_type_master_id", $categoryId)
                            ->where("lock_status", false)
                            ->exists();

                        if (!$exists) {
                            $fail("The selected sub-category is invalid for the chosen category.");
                        }
                    }
                },
            ],

            "connectionDtl.*.totalNoOfHouseAreaRoomTruck" => "required|numeric|min:1",

            // Category 16 (Hotel/Restaurant/Garden/Banquet) Conditional Rules
            "connectionDtl.*.hasRestaurant" => "nullable|boolean",
            "connectionDtl.*.totalNoOfRestaurant" => "nullable|required_if:connectionDtl.*.hasRestaurant,true,1|numeric|min:0",

            "connectionDtl.*.hasGarden" => "nullable|boolean",
            "connectionDtl.*.totalNoOfGarden" => "nullable|required_if:connectionDtl.*.hasGarden,true,1|numeric|min:0",

            "connectionDtl.*.hasBanquetHall" => "nullable|boolean",
            "connectionDtl.*.totalNoOfBanquetHall" => "nullable|required_if:connectionDtl.*.hasBanquetHall,true,1|numeric|min:0",
        ];
        return $rules;
    }
}
