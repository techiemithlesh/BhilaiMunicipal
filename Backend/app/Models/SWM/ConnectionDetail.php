<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConnectionDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "consumer_connection_id",
        "category_type_master_id",
        "sub_category_type_master_id",
        "total_no_of_house_area_room_truck",
        "has_restaurant",
        "total_no_of_restaurant",
        "has_garden",
        "total_no_of_garden",
        "has_banquet_hall",
        "total_no_of_banquet_hall",
        "lock_status",
    ];


    public function category()
    {
        return $this->belongsTo(CategoryTypeMaster::class, "category_type_master_id");
    }

    public function subCategory()
    {
        return $this->belongsTo(SubCategoryTypeMaster::class, "sub_category_type_master_id");
    }
}
