<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerWastCollectionLog extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "consumer_id",
        "device_id",
        "visiting_date",
        "visiting_time",
        "user_id",
        "latitude",
        "longitude",
        "altitude",
        "lock_status",
    ];
}
