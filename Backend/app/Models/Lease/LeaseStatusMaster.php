<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseStatusMaster extends ParamModel
{
    protected $fillable = [
        "status_type",
        "lock_status",
    ];
}
