<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseTransactionFineRebateDetail extends ParamModel
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
}
