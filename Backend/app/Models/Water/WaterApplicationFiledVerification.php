<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterApplicationFiledVerification extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "verified_by",
        "user_id",
        "application_id",
        "connection_type_id",
        "property_type_id",
        "connection_through_id",
        "category",
        "pipeline_type_id",
        "ward_mstr_id",
        "new_ward_mstr_id",
        "area_sqft",
        "distributed_pipeline_size",        
        "distributed_pipeline_type",
        "permitted_pipe_diameter",
        "permitted_pipe_quality",
        "ferrule_type_id",
        "road_type",
        "gate_valve",
        "water_lock_arng",
        "ts_map_id",
        "lock_status"
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
