<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyFloorDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "property_detail_id",        
        "saf_floor_detail_id",
        "verification_id",
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
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }

    public function getUsageType(){
        return $this->belongsTo(UsageTypeMaster::class,"usage_type_master_id","id")->first();
    }
}
