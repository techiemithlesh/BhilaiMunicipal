<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerDemandsCollection extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "transaction_id",
        "consumer_id",
        "consumer_demand_id",
        "demand_from",
        "demand_upto",
        "amount",
        "penalty",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getDemand(){
        return $this->belongsTo(ConsumerDemand::class,"consumer_demand_id","id");
    }
}
