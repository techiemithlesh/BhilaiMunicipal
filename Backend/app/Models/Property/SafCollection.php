<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SafCollection extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "transaction_id",
        "saf_detail_id",
        "saf_demand_id",
        "fyear",
        "qtr",
        "total_tax",
        "holding_tax",
        "latrine_tax",
        "water_tax",
        "health_cess_tax",
        "education_cess_tax",
        "rwh_tax",
        "fine_months",
        "fine_amt",
        "due_date",
        "lock_status",
    ];


    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
