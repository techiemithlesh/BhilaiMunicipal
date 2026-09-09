<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterActiveApplicationOwner extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_id",
        "owner_name",
        "guardian_name",
        "mobile_no",
        "email",
        "pan_no",
        "aadhar_no",
        "gender",
        "dob",
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

    public function getDocList(){
        return $this->hasMany(WaterApplicationDocDetail::class,"owner_detail_id","id")->where("lock_status",false);
    }
}
