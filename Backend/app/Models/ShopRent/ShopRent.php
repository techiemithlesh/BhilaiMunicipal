<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopRent extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'monthly_rate',
        'is_penalty_add',
        'is_penalty_on_percent',
        'is_monthly_penalty',
        'penalty_amount',
        'effective_date',
        'doc_path',
        'refrence_unique_no',
        'user_id',
        'lock_status',
    ];
}
