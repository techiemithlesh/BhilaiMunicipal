<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChequeDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'transaction_id',
        'cheque_no',
        'cheque_date',
        'bank_name',
        'branch_name',
        'cheque_status',
        'clear_bounce_date',
        'remarks',
        'bounce_amount',
        'lock_status',
    ];
}
