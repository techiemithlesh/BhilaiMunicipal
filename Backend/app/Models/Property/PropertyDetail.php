<?php

namespace App\Models\Property;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "saf_detail_id",
        "assessment_type",
        "holding_type",
        "holding_no",
        "new_holding_no",
        "zone_mstr_id",
        "ward_mstr_id",
        "new_ward_mstr_id",
        "ownership_type_mstr_id",
        "prop_type_mstr_id",
        "road_type_mstr_id",
        'road_width',
        'appartment_details_id',
        'appartment_name',
        "colony_mstr_id",
        'flat_registry_date',
        'no_electric_connection',
        'elect_consumer_no',
        'elect_acc_no',
        'elect_bind_book_no',
        'elect_cons_category',
        'building_plan_approval_no',
        'building_plan_approval_date',
        "building_name",
        'water_conn_no',
        'water_conn_date',
        'khata_no',
        'plot_no',
        'village_mauja_name',
        'area_of_plot',
        "builtup_area",
        'prop_address',
        'prop_city',
        'prop_dist',
        'prop_pin_code',        
        'prop_state',
        'is_corr_add_differ',
        'corr_address',
        'corr_city',
        'corr_dist',
        'corr_pin_code',
        'corr_state',
        'is_mobile_tower',
        'tower_area',
        'tower_installation_date',
        'is_hoarding_board',
        'hoarding_area',
        'hoarding_installation_date',
        'is_petrol_pump',
        'under_ground_area',
        'petrol_pump_completion_date',
        'is_water_harvesting',
        'water_harvesting_date',
        'land_occupation_date',
        'trust_type',
        'is_gb_saf',
        "gb_building_type_id",
        "gb_building_usage_type_id",
        "is_csaf2_generated",
        "gb_office_name",
        "gb_application_type",
        'entry_type',
        'ip_address',
        'user_id',
        'citizen_id',
        'prive_saf_detail_ids',
        "water_connection_facility_type_id",
        "water_tax_type_id",
        "demand_paid_upto",
        "lock_status",
    ];

    public function getOwners(){
        return $this->hasMany(PropertyOwnerDetail::class,"property_detail_id","id")->where("lock_status",false)->get();
    }
    public function getFloors(){
        return $this->hasMany(PropertyFloorDetail::class,"property_detail_id","id")->where("lock_status",false)->get();
    }


    public function getWardOldWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
    public function getWardNewdWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"new_ward_mstr_id","id")->first();
    }

    public function getTrans(){
        return $this->hasMany(PropTransaction::class,"property_detail_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(PropTransaction::class,"property_detail_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getAllTaxDetail(){
        return $this->hasMany(PropertyTax::class,"property_detail_id","id")->where("lock_status",false);
    }

    public function getAllDemand(){
        return $this->hasMany(PropertyDemand::class,"property_detail_id","id")->where("lock_status",false);
    }

    public function getSwmConsumer(){
        return $this->hasMany(SwmConsumer::class,"property_detail_id","id")->where("lock_status",false)->get();
    }
    public function getAdditionalDoc(){
        return $this->hasMany(PropertyAdditionalDocument::class,"property_detail_id","id")->where("lock_status",false)->get();
    }
}
