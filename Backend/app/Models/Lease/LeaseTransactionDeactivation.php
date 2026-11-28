<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseTransactionDeactivation extends ParamModel
{
    protected $fillable = [
        "transaction_id",
        "remarks",
        "doc_path",
        "ref_unique_no",
        "user_id",
        "lock_status",
    ];
}
