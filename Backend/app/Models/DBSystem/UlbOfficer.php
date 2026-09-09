<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UlbOfficer extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "officer_name",
        "img_path",
        "img_unique_ref_no",
        "designation",
        "contact_no",
        "sl_no",
        "email",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        $role= self::create($inputs->all());
        return $role->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        return $returnData;
    }
}
