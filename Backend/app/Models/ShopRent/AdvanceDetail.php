<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdvanceDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'transaction_id',
        'amount',
        'remarks',
        'reason',
        'doc',
        'user_id',
        'lock_status',
    ];
}
