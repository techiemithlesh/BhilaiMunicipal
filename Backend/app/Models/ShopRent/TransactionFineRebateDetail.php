<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionFineRebateDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'head_name',
        'amount',
        'is_rebate',
        'lock_status',
    ];
}
