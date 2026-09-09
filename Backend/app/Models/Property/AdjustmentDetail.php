<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdjustmentDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "saf_detail_id",
        "property_detail_id",
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
