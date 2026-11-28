<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseCollection extends ParamModel
{
    protected $fillable = [
        "lease_id",
        "transaction_id",
        "lease_demand_id",
        "fyear",
        "amount",
        "penalty",
        "lock_status",
    ];

    public function getDemand(){
        return $this->belongsTo(LeaseDemand::class,"lease_demand_id","id");
    }
}
