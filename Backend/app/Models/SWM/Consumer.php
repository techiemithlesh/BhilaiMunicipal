<?php

namespace App\Models\SWM;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consumer extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "consumer_no",
        "rf_id",
        "rf_id_install_by",
        "rf_id_install_date",
        "qr_code",
        "ulb_id",
        "ward_mstr_id",
        "holding_no",
        "property_detail_id",
        "has_composting_machine_provision",
        "total_no_of_flat",
        "actual_no_of_flat",
        "type_of_multi_storey_building",
        "house_no",
        "address",
        "landmark",
        "ps",
        "street_name",
        "locality",
        "pin_code",
        "latitude",
        "longitude",
        "altitude",
        "citizen_id",
        "user_id",
        "apply_date",
        "lock_status",
        "current_connection_id",
    ];

    public function getWardOldWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
    public function getWardNewdWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"new_ward_mstr_id","id")->first();
    }

    public function getOwners(){
        return $this->hasMany(ConsumerOwner::class,"consumer_id","id")->where("lock_status",false)->get();
    }


    public function getTrans(){
        return $this->hasMany(ConsumerTransaction::class,"consumer_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(ConsumerTransaction::class,"consumer_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getDemand(){
        return $this->hasMany(ConsumerDemand::class,"consumer_id","id")->where("lock_status",false);
    }

    /**
     * Get active connection details for the consumer's current connection.
     */
    public function getCurrentConnectionDtl()
    {
        return $this->hasManyThrough(
            ConnectionDetail::class,   // Target Model
            ConsumerConnection::class, // Intermediate Model
            'id',                      // Foreign key on consumer_connections (matches consumers.current_connection_id)
            'consumer_connection_id',  // Foreign key on connection_details
            'current_connection_id',   // Local key on consumers
            'id'                       // Local key on consumer_connections
        )
        ->where('connection_details.lock_status', false)
        ->select([
            'connection_details.*',
            'consumer_connections.date_of_effective',
            'consumer_connections.doc_path',
            'consumer_connections.created_at AS entry_date',
            'consumer_connections.user_id',
        ])
        ->with([
            'category:id,category_type',
            'subCategory:id,sub_category_type',
        ])
        ->get();
    }

    public function connections()
    {
        return $this->hasMany(ConsumerConnection::class, 'consumer_id');
    }
}
