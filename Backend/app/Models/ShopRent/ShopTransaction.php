<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopTransaction extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'ulb_id',
        'ward_mstr_id',
        'tran_date',
        'tran_no',
        'gst_no',
        'payment_mode',
        'payable_amt',
        'demand_amt',
        'penalty_amt',
        'gov_tax_amt',
        'discount_amt',
        'from_date',
        'upto_date',
        'remarks',
        'user_id',
        'user_type',
        'verification_status',
        'verified_by',
        'verify_date',
        'pay_gateway',
        'payment_status',
        'tran_type',
        'lock_status',
        'request_demand_amount',
    ];
}
