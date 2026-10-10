<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GovTaxMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'tax_type',
        'tax_per',
        'effective_from',
        'effective_upto',
        'ulb_id',
        'user_id',
        'lock_status',
    ];
}
