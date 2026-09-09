<?php

namespace App\Models\Trade;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveTradeLicenseOwnerDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "trade_license_id",
        "owner_name",
        "guardian_name",
        "mobile_no",
        "email",
        "lock_status",
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

    public function getDocList(){
        return $this->hasMany(TradeLicenseDocDetail::class,"trade_license_owner_detail_id","id")->where("lock_status",false);
    }
}
