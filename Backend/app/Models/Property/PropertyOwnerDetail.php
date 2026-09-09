<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyOwnerDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "property_detail_id",
        "owner_name",
        "guardian_name",
        "relation_type",
        "mobile_no",
        "email",
        "pan_no",
        "aadhar_no",
        "gender",
        "dob",
        "is_armed_force",
        "is_specially_abled",
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
}
