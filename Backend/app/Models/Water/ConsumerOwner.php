<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerOwner extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_owner_id",
        "consumer_id",
        "owner_name",
        "guardian_name",
        "mobile_no",
        "email",
        "pan_no",
        "aadhar_no",
        "gender",
        "dob",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
