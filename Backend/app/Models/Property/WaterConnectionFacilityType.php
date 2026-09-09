<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterConnectionFacilityType extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "facility_type",
        "lock_status",
    ];


    public function getWaterFacilityList(){        
        return self::where("lock_status",false)->orderBy("id","ASC")->get();
    }
}
