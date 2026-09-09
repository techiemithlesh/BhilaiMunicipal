<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConnectionChargeCollection extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "transaction_id",
        "application_id",
        "connection_charge_id",
        "amount",
        "penalty",
        "conn_fee",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getDemand(){
        return $this->belongsTo(WaterConnectionCharge::class,"connection_charge_id","id");
    }
}
