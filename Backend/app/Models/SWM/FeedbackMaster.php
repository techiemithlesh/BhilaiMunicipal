<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackMaster extends ParamModel
{
    protected $fillable = [
        "feedback",
        "user_id",
        "lock_status",
        "created_at",
        "updated_at",
    ];
}
