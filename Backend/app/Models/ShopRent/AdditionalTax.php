<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdditionalTax extends ParamModel

{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'amount',
        'tax_type',
        'paid_status',
        'transaction_id',
        'lock_status',
    ];

    
}
