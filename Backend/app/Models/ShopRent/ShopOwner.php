<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopOwner extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'owner_name',
        'guardian_name',
        'relation_type',
        'mobile_no',
        'user_id',
        'lock_status',
    ];
}
