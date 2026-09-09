<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterRejectedApplication extends WaterActiveApplication
{
    use HasFactory;
    public function getOwners(){
        return $this->hasMany(WaterRejectedApplicationOwner::class,"application_id","id")->where("lock_status",false)->get();
    }
}
