<?php

namespace App\Models\Trade;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveTradeLicense extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "ulb_id",
        "application_no",
        "provisional_license_no",
        "license_no",
        "privies_license_id",
        "privies_license_ids",
        "application_type_id",
        "firm_type_id",
        "other_firm_type",
        "ownership_type_id",
        "ward_mstr_id",
        "new_ward_mstr_id",
        "property_detail_id",
        "firm_name",
        "firm_description",
        "firm_establishment_date",
        'premises_owner_name',
        'area_in_sqft',
        'address',
        "landmark",
        'pin_code',
        'license_for_years',
        "is_tobacco_license",
        'payment_status',
        'is_doc_upload',
        'is_doc_verify',
        'doc_verify_date',
        'doc_verify_user_id',
        'license_date',
        "valid_from",
        'valid_upto',
        'approved_date',
        'approved_user_id',
        'workflow_id',
        'current_role_id',
        'initiator_role_id',
        'finisher_role_id',
        'max_level_attempt',
        'is_btc',
        'lock_status',        
        'apply_date',
        'user_id',
        'citizen_id',
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }

    public function getOwners(){
        return $this->hasMany(ActiveTradeLicenseOwnerDetail::class,"trade_license_id","id")->where("lock_status",false)->get();
    }
    public function getTradeItems(){
        return $this->hasManyThrough(TradeItemTypeMaster::class ,ActiveTradeLicenseNatureOfBusiness::class,"trade_license_id","id","id","trade_item_type_id")->where((new ActiveTradeLicenseNatureOfBusiness())->getTable().".lock_status",false);
    }

    public function getNatureOfBusiness(){
        return $this->hasMany(ActiveTradeLicenseNatureOfBusiness::class,"trade_license_id","id")->where("lock_status",false)->get();
    }


    public function getWardOldWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
    public function getWardNewdWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"new_ward_mstr_id","id")->first();
    }

    public function getTrans(){
        return $this->hasMany(TradeTransaction::class,"trade_license_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(TradeTransaction::class,"trade_license_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getDocList(){
        return $this->hasMany(TradeLicenseDocDetail::class,"trade_license_id","id")->where("lock_status",false);
    }

    public function getLevelRemarks(){
        return $this->hasMany(LevelRemark::class,"trade_license_id","id")->where("lock_status",false);
    }
}
