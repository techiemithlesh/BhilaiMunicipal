<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppBasicUpdate extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "saf_detail_id",
        "property_detail_id",
        "remarks",
        "doc_path",
        "ref_unique_no",
        "updates_field",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
