<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterTaxType extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "tax_type",
        "amount",
        "lock_status",
    ];

    public function getWaterTaxList(){        
        return self::where("lock_status",false)->orderBy("id","ASC")->get();
    }
}
