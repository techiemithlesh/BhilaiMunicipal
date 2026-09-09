<?php

namespace App\Models\Property;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SafDetail extends ActiveSafDetail
{
    use HasFactory;

    public function getOwners(){
        return $this->hasMany(SafOwnerDetail::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }
    public function getFloors(){
        return $this->hasMany(SafFloorDetail::class,"saf_detail_id","id")->where("lock_status",false)->get();
    }

}
