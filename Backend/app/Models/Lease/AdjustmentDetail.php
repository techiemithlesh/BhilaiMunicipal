<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class AdjustmentDetail extends Model
{
    protected $fillable = [
        "lease_id",
        "transaction_id",
        "amount",
        "remarks",
        "user_id",
        "lock_status",
    ];
}
