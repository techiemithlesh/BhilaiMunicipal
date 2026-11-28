<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class AdditionalTax extends ParamModel
{
    protected $fillable = [
        'lease_id',
        'amount',
        'tax_type',
        'paid_status',
        'transaction_id',
        'lock_status',
    ];
}
