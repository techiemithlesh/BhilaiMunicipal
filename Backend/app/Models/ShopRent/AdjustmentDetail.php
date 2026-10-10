<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdjustmentDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'transaction_id',
        'amount',
        'remarks',
        'user_id',
        'lock_status',
    ];
}
