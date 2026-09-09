<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdditionalTax extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "saf_detail_id",
        "property_detail_id",
        "amount",
        "tax_type",
        "paid_status",        
        "transaction_id",
        "lock_status",
    ];
}
