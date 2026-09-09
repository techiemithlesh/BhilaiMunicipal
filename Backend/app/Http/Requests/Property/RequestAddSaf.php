<?php

namespace App\Http\Requests\Property;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ActiveSafFloorDetail;
use App\Models\Property\ActiveSafOwnerDetail;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\FloorMaster;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\SwmCategoryTypeMaster;
use App\Models\Property\SwmSubCategoryTypeMaster;
use App\Models\Property\TransferModeMaster;
use App\Models\Property\UsageTypeMaster;
use App\Models\Property\WaterConnectionFacilityType;
use App\Models\Property\WaterTaxType;
use App\Models\Property\ZoneMaster;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RequestAddSaf extends ParentRequest
{
    protected $_OccupancyTypeMaster;
    protected $_ConstructionTypeMaster;
    protected $_ApartmentDetail;
    protected $_FloorMaster;
    protected $_OwnershipTypeMaster;
    protected $_PropertyTypeMaster;
    protected $_RoadTypeMaster;
    protected $_TransferModeMaster;
    protected $_UsageTypeMaster;
    protected $_ZoneMaster;
    protected $_UlbWardMaster;
    protected $_OldWardNewWardMap;
    protected $_UlbMaster;

    protected $_ActiveSafDetail;
    protected $_ActiveSafOwnerDetail;
    protected $_ActiveSafFloorDetail;
    protected $_WaterConnectionFacilityType;
    protected $_WaterTaxType;

    private $_SwmCategoryTypeMaster;
    private $_SwmSubCategoryTypeMaster;

   function __construct(){
        parent::__construct();
        $this->_OccupancyTypeMaster = new OccupancyTypeMaster();
        $this->_ConstructionTypeMaster= new ConstructionTypeMaster();
        $this->_ApartmentDetail = new ApartmentDetail();
        $this->_FloorMaster = new FloorMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_RoadTypeMaster = new RoadTypeMaster();
        $this->_TransferModeMaster = new TransferModeMaster();
        $this->_UsageTypeMaster = new UsageTypeMaster();
        $this->_ZoneMaster = new ZoneMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_OldWardNewWardMap = new OldWardNewWardMap();
        $this->_UlbMaster = new UlbMaster();

        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_ActiveSafOwnerDetail = new ActiveSafOwnerDetail();
        $this->_ActiveSafFloorDetail = new ActiveSafFloorDetail();

        $this->_WaterConnectionFacilityType = new WaterConnectionFacilityType();
        $this->_WaterTaxType = new WaterTaxType();

        $this->_SwmCategoryTypeMaster = new SwmCategoryTypeMaster();
        $this->_SwmSubCategoryTypeMaster = new SwmSubCategoryTypeMaster();
   }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = Auth()->user();
        $ulbId = $user ? $user->ulb_id : null;
        if(!$this->ulbId){
            $this->merge(["ulbId"=>$ulbId]);
        }
        $rules=[
            "ulbId"=>"required|int|regex:/^[0-9]+$/|exists:".$this->_UlbMaster->getConnectionName().".".$this->_UlbMaster->getTable().",id",                
            "wardMstrId"=>"required|int|regex:/^[0-9]+$/|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id".($this->ulbId ? ",ulb_id,".$this->ulbId : ""),
            "newWardMstrId"=>"nullable|int|regex:/^[0-9]+$/|exists:".$this->_OldWardNewWardMap->getConnectionName().".".$this->_OldWardNewWardMap->getTable().",new_ward_id".($this->wardMstrId ? ",old_ward_id,".$this->wardMstrId : ""),
            "ownershipTypeMstrId"=>"required|int|regex:/^[0-9]+$/|exists:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",id",
            "propTypeMstrId"=>"required|int|regex:/^[0-9]+$/|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
            "assessmentType"=>"required|in:New Assessment,Reassessment,Mutation",
            "previousHoldingId"=>"nullable|required_unless:assessmentType,New Assessment",
            "transferModeMstrId"=>"nullable|required_if:assessmentType,Mutation|int",
            "percentageOfPropertyTransfer"=>"nullable|required_if:assessmentType,Mutation|numeric|min:0.1|max:100",
            "zoneMstrId"=>"required|int|regex:/^[0-9]+$/|exists:".$this->_ZoneMaster->getConnectionName().".".$this->_ZoneMaster->getTable().",id",
            "roadTypeMstrId"=>"required|int|exists:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",id",   
            // "roadWidth"=>"nullable|numeric|".($this->propTypeMstrId==4 ? "min:0":"min:0.5")."|max:499",
            "appartmentDetailsId"=>[
                "nullable",
                "required_if:propTypeMstrId,1",
                "int",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_ApartmentDetail->getConnectionName().".".$this->_ApartmentDetail->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('ulb_id', $this->ulbId);
                }),
            ],
            "flatRegistryDate"=>"nullable|required_if:propTypeMstrId,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "khataNo"=>"nullable",
            "plotNo"=>"nullable",
            "villageMaujaName"=>"required",
            "areaOfPlot"=>"required|numeric|min:0.1",
            "builtupArea"=>"nullable|required_unless:propTypeMstrId,4|numeric|min:0".($this->areaOfPlot ? "|max:".($this->areaOfPlot) : ""),
            "propAddress"=>"required",
            "propCity"=>"required",
            "propDist"=>"required",
            "propPinCode"=>"required|int|regex:/[0-9]{6}/",
            "propState"=>"required",
            "isMobileTower"=>"required|boolean",
            "towerArea"=>"nullable|required_if:isMobileTower,true,1|numeric|min:0.1",
            "towerInstallationDate"=>"nullable|required_if:isMobileTower,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "isHoardingBoard"=>"required|boolean",
            "hoardingArea"=>"nullable|required_if:isHoardingBoard,true,1|numeric|min:0.1",
            "hoardingInstallationDate"=>"nullable|required_if:isHoardingBoard,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "isPetrolPump"=>"nullable|required_if:propTypeMstrId,1,2,3|boolean",
            "underGroundArea"=>"nullable|required_if:isPetrolPump,true,1|numeric|min:0.1",
            "petrolPumpCompletionDate"=>"nullable|required_if:isPetrolPump,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "isWaterHarvesting"=>"nullable|required_if:propTypeMstrId,1,2,3,5|boolean",
            "waterHarvestingDate"=>"nullable|required_if:isWaterHarvesting,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "landOccupationDate"=>"nullable|required_if:propTypeMstrId,3,4|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "waterConnectionFacilityTypeId"=>"required|exists:".$this->_WaterConnectionFacilityType->getConnectionName().".".$this->_WaterConnectionFacilityType->getTable().",id",
            "waterTaxTypeId"=>"required|exists:".$this->_WaterTaxType->getConnectionName().".".$this->_WaterTaxType->getTable().",id",
            
            "ownerDtl"=>"required|array",
            "ownerDtl.*.ownerName"=>"required",
            "ownerDtl.*.guardianName"=>"nullable",
            "ownerDtl.*.relationType"=>"nullable|required_with:ownerDtl.*.guardianName|in:S/O,D/O,W/O,C/O",
            "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
            "ownerDtl.*.email"=>"nullable|email",
            "ownerDtl.*.panNo"=>"nullable|string|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/",
            "ownerDtl.*.aadharNo"=>"nullable|digits:12|regex:/[0-9]{12}/",
            "ownerDtl.*.gender"=>"required|in:Male,Female,Other",
            "ownerDtl.*.dob"=>"nullable|date|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "ownerDtl.*.isArmedForce"=>"required|boolean",
            "ownerDtl.*.isSpeciallyAbled"=>"required|boolean",

            "floorDtl"=>"nullable|required_unless:propTypeMstrId,4|array",
            "floorDtl.*.builtupArea"=>"nullable|required_unless:propTypeMstrId,4|numeric|min:0.1|max:".($this->builtupArea?$this->builtupArea:"0.2"),
            "floorDtl.*.dateFrom"=>"nullable|required_unless:propTypeMstrId,4|date|date_format:Y-m|before_or_equal:".Carbon::now()->format("Y-m"),
            "floorDtl.*.dateUpto"=>[
                "nullable",
                "date",
                "date_format:Y-m",
                "before_or_equal:".Carbon::now()->format("Y-m"),
                function ($attribute, $value, $fail){
                    $key = explode(".",$attribute)[1];
                    if(($this->floorDtl[$key]["dateFrom"]??false)&& $value < $this->floorDtl[$key]["dateFrom"])
                    {
                        $fail('The '.$attribute.' field must be a date after or equal to '.$this->floorDtl[$key]["dateFrom"]);
                    }

                },
            ],
            "floorDtl.*.floorMasterId"=>[
                "nullable",
                "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_FloorMaster->getConnectionName().".".$this->_FloorMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],
            "floorDtl.*.usageTypeMasterId"=>[
                "nullable",
                "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],
            "floorDtl.*.constructionTypeMasterId"=>[
                "nullable",
                "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_ConstructionTypeMaster->getConnectionName().".".$this->_ConstructionTypeMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],
            "floorDtl.*.occupancyTypeMasterId"=>[
                "nullable",
                "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],

            "swmConsumer"=>"nullable|array",//|required_unless:propTypeMstrId,4
            "swmConsumer.*.occupancyTypeMasterId"=>[
                "required",
                // "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],
            "swmConsumer.*.categoryTypeMasterId"=>[
                "required",
                // "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_SwmCategoryTypeMaster->getConnectionName().".".$this->_SwmCategoryTypeMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],
            "swmConsumer.*.subCategoryTypeMasterId"=>[
                "required",
                // "required_unless:propTypeMstrId,4",
                "regex:/^[0-9]+$/",
                Rule::exists($this->_SwmSubCategoryTypeMaster->getConnectionName().".".$this->_SwmSubCategoryTypeMaster->getTable(), 'id')
                ->where(function ($query){
                    return $query->where('lock_status', false);
                }),
            ],
            "swmConsumer.*.category"=>"required|in:APL,BPL",//|required_unless:propTypeMstrId,4
            "swmConsumer.*.dateOfEffective"=>"required|date|date_format:Y-m|before_or_equal:".Carbon::now()->format("Y-m"),//required_unless:propTypeMstrId,4|
            "swmConsumer.*.ownerName"=>"required",
            "swmConsumer.*.guardianName"=>"nullable",
            "swmConsumer.*.relationType"=>"nullable|required_with:swmConsumer.*.guardianName|in:S/O,D/O,W/O,C/O",
            "swmConsumer.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
            "swmConsumer.*.email"=>"nullable|email",
            "swmConsumer.*.gender"=>"nullable|in:Male,Female,Other",
        ];//dd($rules);
        return $rules;
    }

    protected function prepareForValidation()
    {
        // 1️⃣ Top-level boolean fields
        $booleanFields = [
            'isMobileTower',
            'isHoardingBoard',
            'isPetrolPump',
            'isWaterHarvesting',
        ];

        foreach ($booleanFields as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var($this->$field, FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }

        // 2️⃣ Owner details booleans (nested array)
        if (is_array($this->ownerDtl)) {
            $owners = $this->ownerDtl;

            foreach ($owners as $i => $owner) {
                if (isset($owner['isArmedForce'])) {
                    $owners[$i]['isArmedForce'] = filter_var(
                        $owner['isArmedForce'],
                        FILTER_VALIDATE_BOOLEAN
                    );
                }

                if (isset($owner['isSpeciallyAbled'])) {
                    $owners[$i]['isSpeciallyAbled'] = filter_var(
                        $owner['isSpeciallyAbled'],
                        FILTER_VALIDATE_BOOLEAN
                    );
                }
            }

            $this->merge(['ownerDtl' => $owners]);
        }
    }

}
