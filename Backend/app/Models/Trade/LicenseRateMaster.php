<?php

namespace App\Models\Trade;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LicenseRateMaster extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_type_id",
        "from_area",
        "upto_area",
        "effective_from",
        "effective_upto",
        "rate",
        "is_tobacco",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
