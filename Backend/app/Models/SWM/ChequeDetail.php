<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChequeDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "transaction_id",
        "cheque_no",
        "cheque_date",
        "bank_name",
        "branch_name",
        "cheque_status",
        "clear_bounce_date",
        "remarks",
        "bounce_amount",
        "lock_status",
    ];
}
