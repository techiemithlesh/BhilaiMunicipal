<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwmRejectedConsumer extends SwmActiveConsumer
{
    use HasFactory;

    public function getOwners(){
        return $this->hasMany(SwmRejectedConsumerOwner::class,"consumer_id","id")->where("lock_status",false)->get();
    }
}
