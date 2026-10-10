<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopDemand extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'ward_mstr_id',
        'shop_rent_id',
        'generation_date',
        'demand_type',
        'demand_from',
        'demand_upto',
        'total_demand',
        'amount',
        'penalty',
        'balance',
        'due_amount',
        'due_penalty',
        'paid_status',
        'is_full_paid',
        'user_id',
        'lock_status',
    ];

}
