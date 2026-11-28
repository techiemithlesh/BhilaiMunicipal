<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseTransaction extends ParamModel
{
    protected $fillable = [
        "lease_id",
        "ulb_id",
        "ward_mstr_id",
        "tran_date",
        "tran_no",
        "gst_no",
        "payment_mode",
        "payable_amt",
        "demand_amt",
        "penalty_amt",
        "gov_tax_amt",
        "discount_amt",
        "weave_off_gst_tax_amt",
        "gst_doc",
        "prev_gst",
        "prev_gst_doc",
        "from_year",
        "upto_year",
        "remarks",
        "user_id",
        "user_type",
        "verification_status",
        "verified_by",
        "verify_date",
        "pay_gateway",
        "payment_status",
        "tran_type",
        "lock_status",
        "request_demand_amount",
    ];
}
