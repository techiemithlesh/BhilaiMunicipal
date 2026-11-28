<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseRent extends ParamModel
{
    protected $fillable = [
        "lease_id",
        "yearly_rate",
        "effective_date",
        "lease_date",
        "lease_end_date",
        "doc_path",
        "refrence_unique_no",
        "user_id",
        "lock_status",
    ];
}
