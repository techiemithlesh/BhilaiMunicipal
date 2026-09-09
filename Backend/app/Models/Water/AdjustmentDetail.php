<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdjustmentDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "application_id",
        "consumer_id",
        "transaction_id",
        "amount",
        "remarks",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
