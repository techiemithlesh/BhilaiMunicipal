<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenaltyDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "saf_detail_id",
        "property_detail_id",
        "penalty_amt",
        "penalty_type",
        "transaction_id",
        "lock_status"
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
