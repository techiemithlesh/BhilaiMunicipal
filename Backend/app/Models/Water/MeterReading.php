<?php

namespace App\Models\Water;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeterReading extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "meter_status_id",
        "reading",
        "doc_path",
        "ref_unique_no",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getMeterStatus(){
        return $this->belongsTo(MeterStatus::class,"meter_status_id","id");
    }
    public function getUser(){
        return $this->hasOne(User::class,"id","user_id");
    }
}
