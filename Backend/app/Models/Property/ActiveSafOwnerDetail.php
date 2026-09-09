<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveSafOwnerDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "saf_detail_id",
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
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        return $returnData;
    }

    public function propertyReplicateOwner(){
        $allowFields= $this->only(["id","owner_name","guardian_name","relation_type",
                            "mobile_no","email","pan_no","aadhar_no","gender","dob","is_armed_force",
                        "is_specially_abled","user_id","lock_status","created_at","updated_at"]);
        $owner = new ActiveSafOwnerDetail();
        $owner->fill($allowFields);
        // $owner->saf_owner_dtl_id = $this->id;
        return $owner;
    }

    public function getDocList(){
        return $this->hasMany(SafDocDetail::class,"saf_owner_detail_id","id")->where("lock_status",false);
    }
}
