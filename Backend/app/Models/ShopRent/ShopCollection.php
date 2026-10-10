<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopCollection extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'shop_id',
        'shop_demand_id',
        'demand_from',
        'demand_upto',
        'total_demand',
        'amount',
        'penalty',
        'lock_status',
    ];
}
