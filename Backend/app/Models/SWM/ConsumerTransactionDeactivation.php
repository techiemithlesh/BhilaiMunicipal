<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerTransactionDeactivation extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "transaction_id",
        "remarks",
        "doc_path",
        "ref_unique_no",
        "user_id",
        "lock_status",
    ];
}
