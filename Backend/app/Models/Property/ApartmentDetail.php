<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class ApartmentDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "ward_mstr_id",
        "road_type_mstr_id",
        "road_width",
        "apt_code",
        "apartment_name",
        "apartment_address",
        "apartment_image",
        "apartment_unique_ref_no",
        "has_blocks",
        "no_of_block",
        "is_water_harvesting",
        "water_harvesting_date",
        "water_harvesting_image",
        "water_harvesting_unique_ref_no",
        "user_id",
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

    public function getApartmentDetailByWardList($oldWardId){
        
        return self::where("lock_status",false)->where("ward_mstr_id",$oldWardId)->get();
    }

    public function getApartmentDetailByUlbList($ulbId){
        return self::where("lock_status",false)->where("ulb_id",$ulbId)->get();
    }
}
