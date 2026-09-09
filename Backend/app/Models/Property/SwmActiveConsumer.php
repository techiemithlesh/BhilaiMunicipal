<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwmActiveConsumer extends ParamModel
{
    use HasFactory;

    protected $fillable=[
        "rf_id",
        "saf_detail_id",
        "property_detail_id",
        "occupancy_type_master_id",
        "category_type_master_id",
        "sub_category_type_master_id",
        "category",
        "date_of_effective",
        "latitude",
        "longitude",
        "apply_date",
        "user_id",
        "lock_status"
    ];

    public function store($request){
        $inputs = snakeCase($request);
        $id= self::create($inputs->all())->id;
        return $id;
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
        return $this->hasMany(SwmActiveConsumerOwner::class,"consumer_id","id")->where("lock_status",false)->get();
    }

    public function getTrans(){
        return $this->hasMany(SwmConsumerTransaction::class,"consumer_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(SwmConsumerTransaction::class,"consumer_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getAllTaxDetail(){
        return $this->hasMany(SwmTaxDetail::class,"consumer_id","id")->where("lock_status",false);
    }

    public function getAllDemand(){
        return $this->hasMany(SwmConsumerDemand::class,"consumer_id","id")->where("lock_status",false);
    }
}
