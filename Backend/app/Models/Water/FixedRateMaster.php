<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FixedRateMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "ulb_type_id",
        "property_type_id",
        "category",
        "effective_from",
        "effective_upto",
        "rate",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
