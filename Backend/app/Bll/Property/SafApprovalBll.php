<?php

namespace App\Bll\Property;

use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ActiveSafFloorDetail;
use App\Models\Property\AdditionalTax;
use App\Models\Property\PenaltyDetail;
use App\Models\Property\PropertyDemand;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyFloorDetail;
use App\Models\Property\PropertyOwnerDetail;
use App\Models\Property\PropertyTax;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\SafCollection;
use App\Models\Property\SafDemand;
use App\Models\Property\SafDetail;
use App\Models\Property\SafFloorDetail;
use App\Models\Property\SafOwnerDetail;
use App\Models\Property\SwmConsumer;
use App\Models\Property\SwmConsumerDemand;
use App\Models\Property\SwmConsumerOwner;
use App\Models\Property\WaterTaxType;
use App\Trait\Property\PropertyTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SafApprovalBll
{
    use PropertyTrait;
    public $_SafId ;
    public $_SAF;
    public $_ReplicateSaf;
    public $_Floor;
    public $_ReplicateFloor;
    public $_Owner;
    public $_User;
    public $_REQUEST;
    public $_TAX;
    public $_PropId; 
    public $_PropertyDetail;
    public $_PropertyFloorDetail;
    public $_PropertyOwnerDetail;
    public $_PropertyTax;
    public $_PropertyDemand;
    public $_HoldingNo;
    public $_isVacantLand = false;
    public $_lateAssessmentPenalty =0;
    public $_SwmConsumerDemand;
    public $_WaterTaxType;
    public $_AdditionalTax;

    function __construct($safId){
        $this->_SafId = $safId; 
        $this->_User = Auth()->user();
        $this->_REQUEST = new Request();   
        $this->_PropertyDetail = new PropertyDetail();
        $this->_PropertyFloorDetail = new PropertyFloorDetail();
        $this->_PropertyOwnerDetail = new PropertyOwnerDetail();
        $this->_PropertyTax = new PropertyTax();
        $this->_PropertyDemand = new PropertyDemand();
        $this->_WaterTaxType = new WaterTaxType();
        $this->_AdditionalTax = new AdditionalTax();
        $this->_SwmConsumerDemand = new SwmConsumerDemand();
    }

    public function safApproved(){
        $this->setParam();
        $this->testVacantLand();
        $this->generateRequest();
        $this->calculateDiffDemand();
        $this->replicateSaf();
        $this->createNewProperty();
        $this->generateDemand();
    }

    public function generateSAM(){
        $this->setParam();
        $this->testVacantLand();
        $this->generateRequest();
        $this->calculateDiffDemand();
        $this->createNewProperty();
        $this->generateDemand();
    }

    public function generateFAM(){
        $this->setParam();
        $this->testVacantLand();
        $this->generateRequest();
        $this->calculateDiffDemand();
        $this->FinalUpdateProperty();
        $this->generateDemand();
        $this->transferSaf();
    }

    public function setParam(){
        $this->_SAF = ActiveSafDetail::find($this->_SafId);
        $this->_HoldingNo = $this->generateHoldingNo($this->_SAF->id);
        $this->_PropId = $this->_SAF->previous_holding_id;
        $this->_ReplicateSaf = clone $this->_SAF->getPropReplicateSafData();
        $this->_Floor = $this->_SAF->getFloors();
        $this->_Owner = $this->_SAF->getOwners();
        $fileVerification = $this->_SAF->getVerification()->where("verified_by","ULB TC")->orderBy("id","DESC")->first();
        $this->_ReplicateFloor = clone $this->_Floor;
        if($fileVerification){
            $verificationFloor = $fileVerification->getVerificationFloorDtl()->get();
            $this->adjustSafWithVerification($this->_ReplicateSaf,$fileVerification);
            $this->_ReplicateFloor = $verificationFloor->map(function($val){
                $safFloor = $val->saf_floor_detail_id ? clone $this->_Floor->where("id",$val->saf_floor_detail_id)->first(): new ActiveSafFloorDetail();
                if(!$safFloor){
                    $safFloor = new ActiveSafFloorDetail($val->toArray());
                }
                $this->adjustSafFloorWithVerificationFloor($safFloor,$val);
                $safFloor->verification_id = $val->id;
                return $safFloor;
            });
        }
    }

    public function generateRequest(){
        $saf = collect($this->_ReplicateSaf);   
        $saf["ownerDtl"] = camelCase($this->_Owner);
        $saf["floorDtl"] = camelCase($this->_ReplicateFloor);
        $request = camelCase($saf)->toArray();
        $this->_REQUEST->merge($request);
        $calCulator = new BiharTaxCalculator($this->_REQUEST);
        $calCulator->calculateTax();
        $this->_TAX = $calCulator->_GRID;
    }

    public function calculateDiffDemand(){
        foreach($this->_TAX["RuleSetVersionTax"] as $Rkey=>$safTax){  
            foreach($safTax["Fyearlytax"] as $Fkey=>$yearTax){
                foreach($yearTax["quarterly"] as $Qkey=>$quarterlyTax){                    
                    $safDemand = SafDemand::where("lock_status",false)->where("saf_detail_id",$this->_SAF->id)->where("fyear",$quarterlyTax["fyear"])->where("qtr",$quarterlyTax["qtr"])->get();                    
                    $safCollection = SafCollection::whereIn("saf_demand_id",$safDemand->pluck("id"))->get();

                    // $adjust_amt = $safDemand->sum("adjust_amt") ;
                    // $total_tax = $safDemand->sum("total_tax") + $adjust_amt;

                    $paid_total_tax = $safCollection->sum("total_tax") + $safCollection->sum("adjust_amt");
                    // $due_total_tax = $quarterlyTax["TotalTax"] - $total_tax;

                    $dueTax = $quarterlyTax;
                    $dueTax["AdjustAmt"] = $paid_total_tax + $safCollection->sum("adjust_amt") ;  
                    if($dueTax["AdjustAmt"] > $quarterlyTax["TotalTax"] ) {
                        $dueTax["AdjustAmt"]  = $quarterlyTax["TotalTax"] ;
                    }               
                    $this->_TAX["RuleSetVersionTax"][$Rkey]["Fyearlytax"][$Fkey]["quarterly"][$Qkey] = $dueTax;                    
                }
                $this->_TAX["RuleSetVersionTax"][$Rkey]["Fyearlytax"][$Fkey]["AdjustAmt"] = collect($this->_TAX["RuleSetVersionTax"][$Rkey]["Fyearlytax"][$Fkey]["quarterly"])->sum("AdjustAmt");

            }
            
        }
    }

    public function replicateSaf(){
        $saf = $this->_SAF->replicate();
        $saf->id=$this->_SAF->id;
        $saf->setTable((new SafDetail())->getTable());
        $saf->save();
        $this->_SAF->forceDelete();
        foreach($this->_Floor as $val){
            $floor = $val->replicate();
            $floor->id = $val->id;
            $floor->setTable((new SafFloorDetail())->getTable());
            $floor->save();
            $val->forceDelete();
        }
        foreach($this->_Owner as $val){
            $floor = $val->replicate();
            $floor->id = $val->id;
            $floor->setTable((new SafOwnerDetail())->getTable());
            $floor->save();
            $val->forceDelete();
        }
    }

    public function createNewProperty(){
        if(in_array($this->_SAF->assessment_type,["New Assessment","Mutation"])){ 
            $property = $this->_ReplicateSaf->replicate();
            $property->setTable($this->_PropertyDetail->getTable());
            $property->new_holding_no = $this->_HoldingNo;
            $property->saf_detail_id = $this->_SAF->id;
            $property->save();
            $this->_PropId = $property->id;
            foreach($this->_ReplicateFloor->where("lock_status",false) as $val){
                $floor = $val->propertyReplicateFloor();
                $floor->property_detail_id = $this->_PropId;
                $floor->saf_floor_detail_id = $val->id??null;
                $floor->verification_id = $val->verification_id??null;
                $floor->setTable($this->_PropertyFloorDetail->getTable());
                $floor->save();
            }
            foreach($this->_Owner->where("lock_status",false) as $val){
                $owner = $val->propertyReplicateOwner();
                $owner->property_detail_id = $this->_PropId;
                $owner->setTable($this->_PropertyOwnerDetail->getTable());
                $owner->save();
            }
        }
    }

    public function FinalUpdateProperty(){
        $property = $this->_PropertyDetail->find($this->_SAF->prop_dtl_id??$this->_SAF->previous_holding_id);
        if((!$property) || ($this->_SAF->assessment_type=="Mutation" && (!$this->_SAF->prop_dtl_id))){
           $this->createNewProperty(); 
           $property = $this->_PropertyDetail->find($this->_PropId);
        }        
        $this->_PropId = $property->id;
        $this->getLateAssesPenalty();
        $this->calculateWaterSingleTimePayment();
        
        if(!$property->new_holding_no){
            $property->new_holding_no = $this->_HoldingNo;
        }
        if(!$property->holding_no){
            $property->holding_no = $property->new_holding_no;
        }

        $this->_HoldingNo = $property->new_holding_no;
        $property->update($this->_ReplicateSaf->toArray());

        $this->_PropertyFloorDetail->where("property_detail_id",$property->id)
            ->where("property_detail_id",$property->id)
            ->where("lock_status",false)
            ->whereNull("date_upto")
            ->update(["date_upto"=>Carbon::now()->format("Y-m-d")]);
        foreach($this->_ReplicateFloor as $floor){
            if($floor->id??false){
                $propFloor = $this->_PropertyFloorDetail->where("saf_floor_detail_id",$floor->id)->first();
            }
            elseif($floor->verification_id??false){
                $propFloor = $this->_PropertyFloorDetail->where("verification_id",$floor->verification_id)->first();
            }elseif($floor->prop_floor_detail_id??false){
                $propFloor = $this->_PropertyFloorDetail->where("id",$floor->prop_floor_detail_id)->first();
            }
            else{
                $propFloor = new PropertyFloorDetail();
            }
            if(!$propFloor){
                $propFloor = new PropertyFloorDetail();
            }
            $propFloor->property_detail_id = $property->id;
            $propFloor->floor_master_id = $floor->floor_master_id;
            $propFloor->usage_type_master_id = $floor->usage_type_master_id;
            $propFloor->construction_type_master_id = $floor->construction_type_master_id;
            $propFloor->occupancy_type_master_id = $floor->occupancy_type_master_id;
            $propFloor->builtup_area = $floor->builtup_area;
            $propFloor->carpet_area = $floor->carpet_area;
            $propFloor->date_from = $floor->date_from;
            $propFloor->date_upto = $floor->date_upto;
            $propFloor->user_id = $floor->user_id;
            $propFloor->saf_floor_detail_id = $floor->saf_floor_detail_id;
            $propFloor->verification_id = $floor->verification_id;
            $propFloor->save();
        }
    }

    public function generateDemand(){
        // deactivate all update demand after the first rule apply            
        $firstFyear = null;
        $fromQtr=null;
        foreach($this->_TAX["RuleSetVersionTax"] as $Tax){
            if(!$Tax["Fyearlytax"]) {
                continue;
            }               
            $taxRequest = new Request($Tax);
            $taxRequest->merge(["propertyDetailId"=>$this->_PropId]);            
            $firstFyear = collect($Tax["Fyearlytax"])->min("fyear");
            $minYearTax = collect($Tax["Fyearlytax"])->where("fyear",$firstFyear)->first();
            $fromQtr = collect($minYearTax["quarterly"])->min("qtr");
        }
        // deactivate demand first
        $this->_PropertyDemand
            ->where("property_detail_id",$this->_PropId)
            ->where("paid_status",false)
            ->where("fyear","=",$firstFyear)
            ->where("qtr",">=",$fromQtr)
            ->update(["lock_status"=>true]);
        // deactivate demand upto last
        $this->_PropertyDemand
            ->where("property_detail_id",$this->_PropId)
            ->where("paid_status",false)
            ->where("fyear",">",$firstFyear)
            ->update(["lock_status"=>true]);

        $lastPaidUpto = $this->_PropertyDetail->find($this->_PropId)?->demand_paid_upto;
        $paidFy = $paidQtr = null;

        if($lastPaidUpto){
            $paidFy  = getFy($lastPaidUpto);
            $paidQtr = getQtr($lastPaidUpto);
        }
        // generate new demand
        foreach($this->_TAX["RuleSetVersionTax"] as $Tax){ 
            if(!$Tax["Fyearlytax"]) {
                continue;
            }                
            $taxRequest = new Request($Tax);
            $taxRequest->merge(["propertyDetailId"=>$this->_PropId]);            
            $minFyear = collect($Tax["Fyearlytax"])->min("fyear");
            $minYearTax = collect($Tax["Fyearlytax"])->where("fyear",$minFyear)->first();
            $minQtr = collect($minYearTax["quarterly"])->min("qtr");
            $taxRequest->merge(["Fyear"=>$minFyear,"Qtr"=>$minQtr]);
            $taxId = $this->_PropertyTax->store($taxRequest);
            foreach($Tax["Fyearlytax"] as $yearTax){
                $qtrTax = $yearTax["quarterly"];
                if ($paidFy) {
                    $qtrTax = collect($yearTax['quarterly'])
                        ->filter(function ($item) use ($paidFy, $paidQtr) {
                            return $item['fyear'] > $paidFy || ($item['fyear'] == $paidFy && $item['qtr'] > $paidQtr);
                        })
                        ->values()   
                        ->toArray();
                }
                foreach($qtrTax as $quarterlyTax){
                    $newDemandRequest = new Request($quarterlyTax);
                    $newDemandRequest->merge(["propertyDetailId"=>$this->_PropId,"propertyTaxId"=>$taxId,"wardMstrId"=>$this->_REQUEST->wardMstrId]);                        
                    $demandId = $this->_PropertyDemand->store($newDemandRequest);                    
                }

            }
            
        }
    }

    public function transferSaf(){
        $approveSaf = $this->_SAF->replicate();
        $approveSaf->setTable((new SafDetail())->getTable());
        $approveSaf->id = $this->_SAF->id;  
        $approveSaf->save();        

        foreach($this->_Floor as $val){
            $approveFloor = $val->replicate();
            $approveFloor->setTable((new SafFloorDetail())->getTable());
            $approveFloor->id = $val->id;
            $approveFloor->save();
            $val->forceDelete();
        }

        foreach($this->_Owner as $val){
            $approveOwner = $val->replicate();
            $approveOwner->setTable((new SafOwnerDetail())->getTable());
            $approveOwner->id = $val->id;
            $approveOwner->save();
            $val->forceDelete();
        } 

        $this->_SAF->forceDelete();

        $this->generateConsumer();
    }

    public function testVacantLand(){
        $propertyTypeMaster = new PropertyTypeMaster();
        $vacantLand = collect($propertyTypeMaster->getPropertyTypeList())->where("property_type","VACANT LAND")->first();
        if($this->_ReplicateSaf->property_type_mstr_id==($vacantLand->id??"")){
            $this->_isVacantLand = true;
        }
    }

    public function getLateAssesPenalty(){
        $before90Days = Carbon::parse($this->_SAF->apply_date)->copy()->subDays("90")->format("Y-m-d");
        if($this->_isVacantLand && $this->_ReplicateSaf->land_occupation_date < $before90Days){
            if($this->_ReplicateSaf->is_mobile_tower || $this->_ReplicateSaf->is_hoarding_board){
                $this->_lateAssessmentPenalty = 5000;
            }
            else{
                $this->_lateAssessmentPenalty = 2000;
            }
        }
        else{
            $newFloors = collect($this->_ReplicateFloor)->where("date_from","<",$before90Days);
            if(!in_array($this->_SAF->assessment_type,["New Assessment"])){
                $newFloors = $newFloors->whereNull("prop_floor_detail_id");
            }
            $commercialFloor = collect($newFloors)->whereNotIn("usage_type_master_id",[1]);
            if($newFloors->isNotEmpty()){
                $this->_lateAssessmentPenalty = 2000;
                if($commercialFloor->isNotEmpty()){
                    $this->_lateAssessmentPenalty = 5000;
                }
            }
        }

        if($this->_lateAssessmentPenalty>0){
            $objPenalty = new PenaltyDetail();
            $newRequest = new Request(); 
            $newRequest->merge([
                "saf_detail_id"=>$this->_SAF->id,
                "property_detail_id"=>$this->_PropId,
                "penalty_amt"=>$this->_lateAssessmentPenalty,
                "penalty_type"=>"Late Assessment Fine",
            ]);
            $test = $objPenalty
                    ->where("saf_detail_id",$newRequest->saf_detail_id)
                    ->where("property_detail_id",$newRequest->property_detail_id)
                    ->where("lock_status",false)
                    ->count();
            if(!$test){
                $id = $objPenalty->store($newRequest);
            }
        }

    }

    public function calculateWaterSingleTimePayment(){
        $singleTimeTax = 0;
        if($this->_ReplicateSaf->water_tax_type_id){
            $singleTimeTax = $this->_WaterTaxType->find($this->_ReplicateSaf->water_tax_type_id)?->amount;            
        }
        if($singleTimeTax){
            $additionalTaxRequest = new Request([
                "tax_type"=>"Single Time Water Payment",
                "amount"=>$singleTimeTax,
                "saf_detail_id"=>$this->_SAF->id,
                "property_detail_id"=>$this->_PropId,
            ]);

            $test = $this->_AdditionalTax
                    ->where("saf_detail_id",$additionalTaxRequest->saf_detail_id)
                    ->where("property_detail_id",$additionalTaxRequest->property_detail_id)
                    ->where("lock_status",false)
                    ->count();
            if(!$test){
                $id = $this->_AdditionalTax->store($additionalTaxRequest);
            }
        }
    }

    public function generateConsumer(){
        $consumers = $this->_SAF->getSwmConsumer();
        foreach($consumers as $swm){
            $swmConsumer = $swm->replicate();
            $swmConsumer->setTable((new SwmConsumer())->getTable());
            $swmConsumer->id = $swm->id;
            $swmConsumer->property_detail_id = $this->_PropId;
            $swmConsumer->save();

            foreach($swm->getOwners() as $val){
                $approveOwner = $val->replicate();
                $approveOwner->setTable((new SwmConsumerOwner())->getTable());
                $approveOwner->id = $val->id;
                $approveOwner->save();
                $val->forceDelete();
            } 
            $swm->forceDelete();
            $newRequest = new Request(camelCase($swm)->toArray());
            $objTaxCalculator = new BiharSwmTaxCalculator($newRequest);
            $objTaxCalculator->calculateTax();
            $tax = collect($objTaxCalculator->_GRID)->sortBy("demandFrom");
            foreach($tax as $demand){
                $newDemand = new Request($demand);
                $newDemand->merge(["consumer_id"=>$swm->id,"balance"=>$newDemand->amount]);
                $this->_SwmConsumerDemand->store($newDemand);

            }
        }
    }

}