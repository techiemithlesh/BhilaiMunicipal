<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopDeactivation extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'remarks',
        'doc_path',
        'ref_unique_no',
        'user_id',
        'lock_status',
    ];
}
