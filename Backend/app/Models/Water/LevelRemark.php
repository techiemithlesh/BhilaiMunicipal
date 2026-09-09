<?php

namespace App\Models\Water;

use App\Models\DBSystem\RoleTypeMstr;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LevelRemark extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "application_id",
        "sender_role_id",
        "sender_user_id",
        "sender_remarks",
        "receiver_role_id",
        "verification_status",
        "receiving_date",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getSenderRole(){
        return $this->belongsTo(RoleTypeMstr::class,"sender_role_id","id");
    }
    public function getReceiverRole(){
        return $this->belongsTo(RoleTypeMstr::class,"receiver_role_id","id");
    }
    public function getSenderUser(){
        return $this->belongsTo(User::class,"sender_user_id","id");
    }
}
