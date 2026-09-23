<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyDemand extends ParamModel
{
    use HasFactory;
    public function store($request){
        $inputs=[
            "property_detail_id"=>$request->propertyDetailId,
            "property_tax_id"=>$request->propertyTaxId,
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
            "adjust_type"=>$request->AdjustType??null,

            "composite_tax"=>$request->CompositeTax??0,
            "common_wtr_tax"=>$request->CommonWtrTax??0,
            "otheramt"=>$request->otheramt??0,
            "penal_charge"=>$request->penal_charge??0,
            "demand_amount"=>$request->demandDmount??0,

            "balance_tax" => $request->TotalTax??0 ,
            "due_holding_tax"=>$request->HoldingTax??0,
            "due_water_tax" => $request->WaterTax??0,
            "due_education_cess_tax"=>$request->EducationCessTax??0,
            "due_health_cess_tax"=>$request->HealthCessTax??0,
            "due_latrine_tax"=>$request->LatrineTax??0,
            "due_rwh_tax"=>$request->RWH??0,
            "due_fine_tax"=>$request->FineTax??0,

            "due_composite_tax"=>$request->CompositeTax??0,
            "due_common_wtr_tax"=>$request->CommonWtrTax??0,
            "due_otheramt"=>$request->otheramt??0,
            "due_penal_charge"=>$request->penal_charge??0,
            "due_demand_amount"=>$request->demandDmount??0,
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
            $dueFineTax = roundFigure($request->FineTax - ($request->FineTax  * $AdjustAmtPercent));

            $dueCompositeTax = roundFigure($request->CompositeTax - ($request->CompositeTax  * $AdjustAmtPercent));
            $dueCommonWtrTax = roundFigure($request->CommonWtrTax - ($request->CommonWtrTax  * $AdjustAmtPercent));
            $dueotheramt = roundFigure($request->otheramt - ($request->otheramt  * $AdjustAmtPercent));
            $duepenal_charge = roundFigure($request->penal_charge - ($request->penal_charge  * $AdjustAmtPercent));
            $duedemandDmount = roundFigure($request->demandDmount - ($request->demandDmount  * $AdjustAmtPercent));

            

            
            $returnData =  [
                "balance_tax" => ($balance),
                "due_holding_tax"=>$dueHoldingTax,
                "due_water_tax" => $dueWaterTax,
                "due_education_cess_tax"=>$dueEducationCessTax,
                "due_health_cess_tax"=>$dueHealthCessTax,
                "due_latrine_tax"=>$dueLatrineTax,
                "due_rwh_tax"=>$dueRWH,
                "due_fine_tax"=>$dueFineTax,
                "adjust_type"=>"Advance",

                "due_composite_tax"=>$dueCompositeTax,
                "due_common_wtr_tax"=>$dueCommonWtrTax,
                "due_otheramt"=>$dueotheramt,
                "due_penal_charge"=>$duepenal_charge,
                "due_demand_amount"=>$duedemandDmount,
            ];
            if($balance<=0){
                $returnData["paid_status"]=true;
                $returnData["is_full_paid"]=true;
            }
            return $returnData;
        }
    }

    public function getDueDemand($propId){
        return self::where("property_detail_id",$propId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("fyear","ASC")
                ->orderBy("qtr","ASC")->get();
    }
}
