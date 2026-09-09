<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveSafFloorDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "saf_detail_id",
        "floor_master_id",
        "usage_type_master_id",
        "construction_type_master_id",
        "occupancy_type_master_id",
        "builtup_area",
        "carpet_area",
        "date_from",
        "date_upto",
        "user_id",
        "prop_floor_detail_id",
        "lock_status",
    ];

    public function store($request){
        if ($request->usageTypeMasterId==1) {
            #====For Residential======
            $carpet_area = (($request->builtupArea*70)/100);
        } else {
            #====For Non Residential======
            $carpet_area = (($request->builtupArea*80)/100);
        }
        $request->merge(["carpetArea"=>$carpet_area]);
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function propertyReplicateFloor(){
        $allowFields= $this->only(["id","floor_master_id","usage_type_master_id","construction_type_master_id",
                            "occupancy_type_master_id","builtup_area","carpet_area","date_from","date_upto","user_id","prop_floor_detail_id",
                        "lock_status","created_at","updated_at"]);
        $floor = new ActiveSafFloorDetail();
        $floor->fill($allowFields);
        $floor->saf_floor_detail_id = $this->id;
        return $floor;
    }

    public function getUsageType(){
        return $this->belongsTo(UsageTypeMaster::class,"usage_type_master_id","id")->first();
    }
}
