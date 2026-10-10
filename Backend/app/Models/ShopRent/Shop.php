<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'ulb_id',
        'ward_mstr_id',
        'consumer_no',
        'shop_no',
        'reg_no',
        'holding_no',
        'property_detail_id',
        'yojna_id',
        'samiti_id',
        'shop_type_id',
        'area_id',
        'premium_amt',
        'address',
        'pin_code',
        'allotment_date',
        'apply_date',
        'current_rate_id',
        'citizen_id',
        'user_id',
        'lock_status',
    ];
}
