<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FieldVerificationFloorDetail extends ActiveSafFloorDetail
{
    use HasFactory;
    protected $fillable = [
        "field_verification_id",
        "saf_detail_id",
        "saf_floor_detail_id",
        "floor_master_id",
        "usage_type_master_id",
        "construction_type_master_id",
        "occupancy_type_master_id",
        "builtup_area",
        "carpet_area",
        "date_from",
        "date_upto",
        "user_id",
        "lock_status",
    ];
}
