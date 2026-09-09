<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SafTax extends ParamModel
{
    use HasFactory;

    public function store($request){
        $inputs=[
            "saf_detail_id"=>$request->safDetailId,
            "fyear"=>$request->Fyear,
            "qtr"   => $request->Qtr,
            "arv" => ((float)$request->ARV??0),
            "property_tax"=> ((float)$request->propertyTax??0),
            "holding_tax"=>$request->HoldingTax,
            "water_tax" => $request->WaterTax,
            "education_cess"=>$request->EducationCessTax,
            "health_cess"=>$request->HealthCessTax,
            "latrine_tax"=>$request->LatrineTax,
            "rwh_tax"=>$request->RWH,
            "quarterly_tax"=>$request->TotalTaxQuarterly,
            "tax_json"=>json_encode($request->all(),JSON_UNESCAPED_UNICODE)
        ];
        return self::create($inputs)->id;
    }
}
