<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseOwner extends ParamModel
{
    protected $fillable = [
        "lease_id",
        "owner_name",
        "guardian_name",
        "relation_type",
        "mobile_no",
        "email",
        "owner_address",
        "user_id",
        "lock_status",
    ];
}
