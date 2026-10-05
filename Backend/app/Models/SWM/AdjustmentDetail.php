<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdjustmentDetail extends ParamModel
{
    use HasFactory;
    protected $fillable=[
        "consumer_id",
        "transaction_id",
        "amount",
        "remarks",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
