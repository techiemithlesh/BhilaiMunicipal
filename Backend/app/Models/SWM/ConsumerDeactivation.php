<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerDeactivation extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "consumer_id",
        "remarks",
        "doc_path",
        "ref_unique_no",
        "user_id",
        "lock_status",
        "created_at",
        "updated_at",
    ];
}
