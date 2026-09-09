<?php

namespace App\Models\Property;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemoDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "memo_no",
        "memo_type",
        "saf_detail_id",
        "property_detail_id",
        "holding_no",
        "ward_mstr_id",
        "fyear",
        "qtr",
        "arv",
        "quarterly_tax",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
}
