<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerDemand extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "consumer_id",
        "ward_mstr_id",
        "tax_detail_id",
        "generation_date",
        "demand_type",
        "demand_from",
        "demand_upto",
        "from_reading",
        "current_meter_reading",
        "unit_amount",
        "amount",
        "balance",
        "paid_status",
        "is_full_paid",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getDueDemand($consumerId){
        return self::where("consumer_id",$consumerId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("demand_upto","ASC")
                ->get();
    }

    public function getMeterReading(){
        return $this->hasManyThrough(MeterReading::class,TaxDetail::class,"id","id","tax_detail_id","final_meter_reading");
    }
}
