<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyNotice extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "property_detail_id",        
        "notice_no",
        "serial_no",
        "prev_notice_id",
        "notice_date",
        "notice_type",
        "from_fyear",
        "from_qtr",
        "upto_fyear",
        "upto_qtr",
        "demand_amount",
        "penalty",
        "arrear_demand_amount",
        "arrear_penalty",
        "user_id",
        "remarks",
        "approved_by",
        "served_by",
        "receiving_doc_path",
        "receiving_doc_ref_unique_no",
        "receiving_latitude",
        "receiving_longitude",
        "receiving_remarks",
        "clear_by_id",
        "is_clear",
        "deactivated_by",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }
}
