<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeterStatus extends ParamModel
{
    use HasFactory;
    protected $table = "meter_status";
    protected $fillable = [
        "consumer_id",
        "meter_type_id",
        "property_type_id",
        "connection_date",
        "meter_no",
        "is_meter_working",
        "doc_path",
        "ref_unique_no",
        "initial_reading",
        "property_type_id",
        "no_of_room",
        "fix_rate",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getMeterType(){
        return $this->belongsTo(MeterTypeMaster::class,"meter_type_id","id");
    }

    public function getLastReading(){
        return $this->hasMany(MeterReading::class,"meter_status_id","id")
            ->where("lock_status",false)
            ->orderBy("id","DESC")
            ->first();
    }

    public function getPropertyType(){
        return $this->belongsTo(PropertyTypeMaster::class,"property_type_id","id");

    }

}
