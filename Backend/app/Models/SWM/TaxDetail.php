<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "consumer_id",
        "tax_type",
        "total_amount",
        "tax_json",
        "lock_status",
    ];
}
