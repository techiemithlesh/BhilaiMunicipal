<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseTransactionFineRebateDetail extends ParamModel
{
    protected $fillable = [
        "transaction_id",
        "head_name",
        "amount",
        "is_rebate",
        "lock_status",
    ];
}
