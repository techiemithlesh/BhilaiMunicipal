<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "consumer_id",
        "meter_status_id",
        "tax_type",
        "initial_reading",
        "initial_meter_reading",
        "final_reading",
        "final_meter_reading",
        "total_amount",
        "tax_json",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
