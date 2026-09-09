<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterConnectionCharge extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "application_id",
        "charge_for",
        "amount",
        "penalty",
        "conn_fee",
        "paid_status",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getDueDemand($appId){
        return self::where("application_id",$appId)
                ->where("lock_status",false)
                ->where("paid_status",false)
                ->orderBy("id","ASC")->get();
    }
}
