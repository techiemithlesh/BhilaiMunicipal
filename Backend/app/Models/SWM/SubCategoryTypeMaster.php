<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategoryTypeMaster extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "category_type_master_id",
        "sub_category_type",
        "lock_status",
    ];
    
}
