<?php

namespace App\Models\Property;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveSafDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "ulb_id",
        "holding_no",
        "has_previous_holding_no",
        "previous_holding_id",
        "previous_ward_mstr_id",
        "is_owner_changed",
        "transfer_mode_mstr_id",
        "percentage_of_property_transfer",
        "assessment_type",
        "holding_type",
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
        'saf_distributed_dtl_id',
        'ip_address',
        'trust_type',
        'is_gb_saf',
        "gb_building_type_id",
        "gb_building_usage_type_id",
        "is_csaf2_generated",
        "gb_office_name",
        "gb_application_type",
        'workflow_id',
        'current_role_id',
        'initiator_role_id',
        'finisher_role_id',
        'apply_date',
        'user_id',
        'citizen_id',
        "water_connection_facility_type_id",
        "water_tax_type_id",
        "skip_tc_level",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getPropReplicateSafData(){
        $allowFields =  $this->only(["id","ulb_id","assessment_type","holding_type","holding_no",
                "zone_mstr_id","ward_mstr_id","new_ward_mstr_id","ownership_type_mstr_id","prop_type_mstr_id","road_type_mstr_id",
                "road_width","appartment_details_id","appartment_name","colony_mstr_id","flat_registry_date","no_electric_connection",
                "elect_consumer_no","elect_acc_no","elect_bind_book_no","elect_cons_category","building_plan_approval_no","building_plan_approval_date",
                "building_name","water_conn_no","water_conn_date","khata_no","plot_no","village_mauja_name","area_of_plot","builtup_area","prop_address",
                "prop_city","prop_dist","prop_pin_code","prop_state","is_corr_add_differ","corr_address","corr_city","corr_dist","corr_pin_code","corr_state",
                "is_mobile_tower","tower_area","tower_installation_date","is_hoarding_board","hoarding_area","hoarding_installation_date",
                "is_petrol_pump","under_ground_area","petrol_pump_completion_date","is_water_harvesting","water_harvesting_date",
                "land_occupation_date","trust_type","is_gb_saf","gb_building_type_id","gb_building_usage_type_id","is_csaf2_generated","gb_office_name",
                "gb_application_type","citizen_id","water_connection_facility_type_id","water_tax_type_id",]);
        $saf = new ActiveSafDetail();
        $saf->fill($allowFields);
        $saf->saf_detail_id = $this->id;
        return $saf;
                        
    }

    public function getOwners(){
        return $this->hasMany(ActiveSafOwnerDetail::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }
    public function getFloors(){
        return $this->hasMany(ActiveSafFloorDetail::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }


    public function getWardOldWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
    public function getWardNewdWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"new_ward_mstr_id","id")->first();
    }

    public function getTrans(){
        return $this->hasMany(PropTransaction::class,"saf_detail_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(PropTransaction::class,"saf_detail_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getDocList(){
        return $this->hasMany(SafDocDetail::class,"saf_detail_id","id")->where("lock_status",false);
    }

    public function getLevelRemarks(){
        return $this->hasMany(LevelRemark::class,"saf_detail_id","id")->where("lock_status",false);
    }

    public function getGeoTag(){
        return $this->hasMany(GeotagDetail::class,"saf_detail_id","id")->where("lock_status",false);
    }

    public function getMemo(){
        return $this->hasMany(MemoDetail::class,"saf_detail_id","id")->where("lock_status",false);
    }

    public function getVerification(){
        return $this->hasMany(FieldVerificationDetail::class,"saf_detail_id","id")->where("lock_status",false);
    }

    public function getAllTaxDetail(){
        return $this->hasMany(SafTax::class,"saf_detail_id","id")->where("lock_status",false);
    }

    public function getSwmConsumer(){
        return $this->hasMany(SwmActiveConsumer::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }


}
