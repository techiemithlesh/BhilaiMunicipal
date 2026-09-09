<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FieldVerificationDetail extends ActiveSafDetail
{
    use HasFactory;

    protected $fillable = [
        "verified_by",
        "user_id",
        "saf_detail_id",
        "zone_mstr_id",
        "ward_mstr_id",
        "new_ward_mstr_id",
        "prop_type_mstr_id",
        "road_type_mstr_id",
        "road_width",
        "area_of_plot",
        "builtup_area",
        "appartment_details_id",
        "colony_mstr_id",
        "flat_registry_date",
        "percentage_of_property_transfer",
        "is_mobile_tower",
        "tower_area",
        "tower_installation_date",
        "is_hoarding_board",
        "hoarding_area",
        'hoarding_installation_date',
        'is_petrol_pump',
        'under_ground_area',
        "petrol_pump_completion_date",
        'is_water_harvesting',
        "water_harvesting_date",
        "land_occupation_date",
        'manual_verification_doc',
        'lock_status',
    ];

    public function getVerificationFloorDtl(){
        return $this->hasMany(FieldVerificationFloorDetail::class,"field_verification_id","id")->where("lock_status",false);
    }
}
