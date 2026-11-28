<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class GovTaxMaster extends ParamModel
{
    protected $fillable = [
        "tax_type",
        "tax_per",
        "effective_from",
        "effective_upto",
        "ulb_id",
        "user_id",
        "lock_status"
    ];
}
