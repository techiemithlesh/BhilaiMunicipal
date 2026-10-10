<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class YojnaMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'yojna_name',
        'ulb_id',
        'user_id',
        'lock_status'
    ];
}
