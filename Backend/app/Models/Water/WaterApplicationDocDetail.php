<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterApplicationDocDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_id",
        "owner_detail_id",
        "doc_type_id",
        "doc_name",
        "doc_path",
        "ref_unique_no",
        "user_id",
        "verified_status",
        "verified_by_user_id",
        "verified_at",        
        "remarks",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
