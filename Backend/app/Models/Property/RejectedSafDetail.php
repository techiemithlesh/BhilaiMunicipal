<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RejectedSafDetail extends SafDetail
{
    use HasFactory;

    
    public function getOwners(){
        return $this->hasMany(RejectedSafOwnerDetail::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }
    public function getFloors(){
        return $this->hasMany(RejectedSafFloorDetail::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }

    public function getSwmConsumer(){
        return $this->hasMany(SwmRejectedConsumer::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }
}
