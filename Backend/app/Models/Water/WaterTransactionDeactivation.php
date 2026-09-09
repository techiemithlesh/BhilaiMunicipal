<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterTransactionDeactivation extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "transaction_id",
        "remarks",
        "doc_path",
        "ref_unique_no",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
