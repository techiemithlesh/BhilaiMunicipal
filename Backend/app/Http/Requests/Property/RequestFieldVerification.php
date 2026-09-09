<?php

namespace App\Http\Requests\Property;

use App\Http\Requests\ParentRequest;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\OccupancyTypeMaster;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RequestFieldVerification extends RequestAddSaf
{

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
        $saf = $this->_ActiveSafDetail->find($this->safDetailId);
        $rules=[ 
            "safDetailId"=>"required|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable().",id",           
            "wardMstrId"=>"required|int|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id".($this->ulbId ? ",ulb_id,".$this->ulbId : ""),
            "newWardMstrId"=>"nullable|int|exists:".$this->_OldWardNewWardMap->getConnectionName().".".$this->_OldWardNewWardMap->getTable().",new_ward_id".($this->wardMstrId ? ",old_ward_id,".$this->wardMstrId : ""),
            "propTypeMstrId"=>"required|int|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
            "percentageOfPropertyTransfer"=>$saf && in_array($saf->assessment_type,["Mutation"]) ? "required|numeric|min:0.1|max:100":"nullable",
            "zoneMstrId"=>"required|int|exists:".$this->_ZoneMaster->getConnectionName().".".$this->_ZoneMaster->getTable().",id",
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
            
            "areaOfPlot"=>"required|numeric|min:0.1",
            "builtupArea"=>"nullable|required_unless:propTypeMstrId,4|numeric|min:0".($this->areaOfPlot ? "|max:".($this->areaOfPlot) : ""),
            
            "isMobileTower"=>"required|bool",
            "towerArea"=>"nullable|required_if:isMobileTower,true,1|numeric|min:0.1",
            "towerInstallationDate"=>"nullable|required_if:isMobileTower,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "isHoardingBoard"=>"required|bool",
            "hoardingArea"=>"nullable|required_if:isHoardingBoard,true,1|numeric|min:0.1",
            "hoardingInstallationDate"=>"nullable|required_if:isHoardingBoard,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "isPetrolPump"=>"nullable|required_if:propTypeMstrId,1,2,3|bool",
            "underGroundArea"=>"nullable|required_if:isPetrolPump,true,1|numeric|min:0.1",
            "petrolPumpCompletionDate"=>"nullable|required_if:isPetrolPump,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "isWaterHarvesting"=>"nullable|required_if:propTypeMstrId,1,2,3|bool",
            "waterHarvestingDate"=>"nullable|required_if:isWaterHarvesting,true,1|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            "landOccupationDate"=>"nullable|required_if:propTypeMstrId,4|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            

            "floorDtl"=>"nullable|required_unless:propTypeMstrId,4|array",
            "floorDtl.*.safFloorDetailId"=>[
                "nullable",
                "required_unless:propTypeMstrId,4",
                "digits_between:0,9223372036854775807",                
                function ($attribute, $value, $fail){
                    $count = $this->_ActiveSafFloorDetail->where("id",$value)->where("saf_detail_id",$this->safDetailId)->count();
                    if($value && !$count)
                    {
                        $fail('The '.$attribute.' invalid');
                    }

                },
            ],
            "floorDtl.*.builtupArea"=>"nullable|required_unless:propTypeMstrId,4|min:0.1|max:".($this->builtupArea?$this->builtupArea:"0.2"),
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
        ];
        return $rules;
    }
}
