<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SafDemand extends ParamModel
{
    use HasFactory;
    public function store($request){
        $inputs=[
            "saf_detail_id"=>$request->safDetailId,
            "saf_tax_id"=>$request->safTaxId,
            "ward_mstr_id"=>$request->wardMstrId,
            "fyear"=>$request->fyear,
            "qtr"   => $request->qtr,
            "due_date"=>$request->dueDate,
            "total_tax" => $request->TotalTax??0,
            "holding_tax"=>$request->HoldingTax??0,
            "water_tax" => $request->WaterTax??0,
            "education_cess_tax"=>$request->EducationCessTax??0,
            "health_cess_tax"=>$request->HealthCessTax??0,
            "latrine_tax"=>$request->LatrineTax??0,
            "rwh_tax"=>$request->RWH??0,
            "fine_tax"=>$request->FineTax??0,
            "adjust_amt"=>$request->AdjustAmt??0,
            "adjust_type"=>$request->AdjustType??0,

            "balance_tax" => $request->TotalTax??0 ,
            "due_holding_tax"=>$request->HoldingTax??0,
            "due_water_tax" => $request->WaterTax??0,
            "due_education_cess_tax"=>$request->EducationCessTax??0,
            "due_health_cess_tax"=>$request->HealthCessTax??0,
            "due_latrine_tax"=>$request->LatrineTax??0,
            "due_rwh_tax"=>$request->RWH??0,
            "due_fine_tax"=>$request->FineTax??0,
        ];
        if($adjustAmount = $this->adjustTheAdvance($request)){
            $inputs = array_merge($inputs,$adjustAmount);
        }
        return self::create($inputs)->id;
    }
    private function adjustTheAdvance($request){
        if($request->AdjustAmt){

            $TotalTax = $request->TotalTax;
            $balance = roundFigure($TotalTax - $request->AdjustAmt);
            $AdjustAmtPercent = $request->AdjustAmt / ($TotalTax==0 ? 1 : $TotalTax);
            $dueHoldingTax = roundFigure($request->HoldingTax - ($request->HoldingTax  * $AdjustAmtPercent)) ;
            $dueWaterTax = roundFigure($request->WaterTax - ($request->WaterTax * $AdjustAmtPercent)) ;
            $dueEducationCessTax = roundFigure($request->EducationCessTax - ($request->EducationCessTax * $AdjustAmtPercent)) ;
            $dueHealthCessTax = roundFigure($request->HealthCessTax - ($request->HealthCessTax * $AdjustAmtPercent)) ;
            $dueLatrineTax = roundFigure($request->LatrineTax - ($request->LatrineTax  * $AdjustAmtPercent))  ;
            $dueRWH = roundFigure($request->RWH - ($request->RWH  * $AdjustAmtPercent));

            
            $returnData =  [
                "balance_tax" => ($balance),
                "due_holding_tax"=>$dueHoldingTax,
                "due_water_tax" => $dueWaterTax,
                "due_education_cess_tax"=>$dueEducationCessTax,
                "due_health_cess_tax"=>$dueHealthCessTax,
                "due_latrine_tax"=>$dueLatrineTax,
                "due_rwh_tax"=>$dueRWH,
            ];
            return $returnData;
        }
    }

    public function getDueDemand($safId){
        return self::where("saf_detail_id",$safId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("fyear","ASC")
                ->orderBy("qtr","ASC")->get();
    }
}
