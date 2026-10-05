<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerOwner extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "consumer_id",
        "owner_name",
        "guardian_name",
        "relation_type",
        "mobile_no",
        "email",
        "gender",
        "user_id",
        "is_renter",
        "lock_status",
    ];
}
