<?php

namespace App\Bll\Property;

use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ActiveSafFloorDetail;
use App\Models\Property\AdditionalTax;
use App\Models\Property\PenaltyDetail;
use App\Models\Property\PropertyCollection;
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
        $calCulator = new BhiliaTaxCalculator($this->_REQUEST);
        $calCulator->calculateTax();
        $this->_TAX = $calCulator->_GRID;
    }

    public function calculateDiffDemand(){
        
        foreach($this->_TAX["RuleSetVersionTax"] as $Rkey=>$safTax){ 
            $effectiveUptoFyear =  $safTax["effective_upto_fyear"];
            foreach($safTax["taxDiff"] as $Fkey=>$yearTax){
                $fromYear=$yearTax["year"];
                $uptoYear = $effectiveUptoFyear;
                if(isset($safTax["taxDiff"][$Fkey+1])){
                    $nexFromYear = $safTax["taxDiff"][$Fkey+1]["year"];
                    list($from,$upto)=explode("-",$nexFromYear);
                    $uptoYear = ($from-1)."-".($upto-1);
                } 
                $yearlyTax = collect($this->_TAX["FyearWiseTax"])
                            ->where("year",">=",$fromYear)
                            ->where("year","<=",$uptoYear)
                            ->sortBy("year");

                foreach($yearlyTax as $index=>$tax){                    
                    $safDemand = SafDemand::where("lock_status",false)->where("saf_detail_id",$this->_SAF->id)->where("fyear",$tax["year"])->get();                    
                    $safCollection = SafCollection::whereIn("saf_demand_id",$safDemand->pluck("id"))->get();

                    $paid_total_tax = $safCollection->sum("total_tax") + $safCollection->sum("adjust_amt");

                    $dueTax = $tax; 
                    $dueTax["AdjustAmt"] = $paid_total_tax ;  
                    if($dueTax["AdjustAmt"] > $tax["netTotalTax"] ) {
                        $dueTax["AdjustAmt"]  = $tax["netTotalTax"] ;
                    }            
                    $this->_TAX["RuleSetVersionTax"][$Rkey]["taxDiff"][$Fkey]["yearlyTax"][$index] = $dueTax;                    
                }
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
            $property->prive_saf_detail_ids = $this->_SAF->id;
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
        $isCreateNewProperty=false;
        $property = $this->_PropertyDetail->find($this->_SAF->prop_dtl_id??$this->_SAF->previous_holding_id);
        if((!$property) || ($this->_SAF->assessment_type=="Mutation" && (!$this->_SAF->prop_dtl_id))){
            $isCreateNewProperty=true;
           $this->createNewProperty(); 
           $property = $this->_PropertyDetail->find($this->_PropId);
        }        
        $this->_PropId = $property->id;
        $this->addFormFee();
        $this->calculateWaterSingleTimePayment();
        
        if(!$property->new_holding_no){
            $property->new_holding_no = $this->_HoldingNo;
        }
        if(!$property->holding_no){
            $property->holding_no = $property->new_holding_no;
        }

        $this->_HoldingNo = $property->new_holding_no;
        $updateHoldingData = $this->_ReplicateSaf->toArray();
        if(!$isCreateNewProperty){
            $updateHoldingData["prive_saf_detail_ids"] = trim(($property->prive_saf_detail_ids.','.$this->_SAF->id),",");
        }
        $property->update($updateHoldingData);

        //deactivate floor;

        if(!$isCreateNewProperty){
            $this->_PropertyFloorDetail->where("property_detail_id",$property->id)
                ->where("property_detail_id",$property->id)
                ->where("lock_status",false)
                ->whereNotIn("id",$this->_ReplicateFloor->pluck("prop_floor_detail_id"))
                ->update(["lock_status"=>true]);
    
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
    
            $this->_PropertyOwnerDetail
                    ->where("property_detail_id",$property->id)
                    ->forceDelete();
    
            foreach($this->_Owner->where("lock_status",false) as $val){
                $owner = $val->propertyReplicateOwner();
                $owner->property_detail_id = $this->_PropId;
                $owner->setTable($this->_PropertyOwnerDetail->getTable());
                $owner->save();
            }
        }
    }

    public function generateDemand(){
        // deactivate all update demand after the first rule apply            
        $firstFyear = collect($this->_TAX["FyearWiseTax"])->min("year");
        
        // deactivate unpaid demand first
        $this->_PropertyDemand
            ->where("property_detail_id",$this->_PropId)
            ->where("paid_status",false)
            ->where("fyear",">=",$firstFyear)
            ->update(["lock_status"=>true]);

        // generate new demand
        foreach($this->_TAX["RuleSetVersionTax"] as $rulSet){ 
            if(!$rulSet["taxDiff"]) {
                continue;
            }    
            foreach($rulSet["taxDiff"] as $Tax){
                $taxRequest = new Request($Tax);
                $taxRequest->merge(["propertyDetailId"=>$this->_PropId]);          
                $minFyear = collect($Tax["yearlyTax"])->min("year");
                $minYearTax = collect($Tax["yearlyTax"])->where("year",$minFyear)->first();
                $minQtr = $minYearTax["qtr"];
                $taxRequest->merge(["Fyear"=>$minFyear,"Qtr"=>$minQtr]);

                $taxId = $this->_PropertyTax->store($taxRequest);

                foreach($Tax["yearlyTax"] as $yearTax){
                    list($from_date,$upto_date) = FyearFromUptoDate($yearTax["year"]);
                    $newDemandRequest = new Request($yearTax);
                    $newDemandRequest->merge([
                        "propertyDetailId"=>$this->_PropId,
                        "propertyTaxId"=>$taxId,
                        "wardMstrId"=>$this->_REQUEST->wardMstrId,
                        "fyear"=>$yearTax["year"],
                        "dueDate"=>$upto_date,
                        "TotalTax"=>$yearTax["netTotalTax"],
                        "demandDmount"=>$yearTax["TotalTax"],
                        "FineTax"=>$yearTax["penal"],
                        "otheramt"=>$yearTax["arrayPenalty"],
                    ]);  
                    
                    $paidTotalYearlyOnPast = PropertyCollection::where("property_detail_id",$this->_PropId)
                                            ->where("fyear",$newDemandRequest->fyear)
                                            ->where("lock_status",false)
                                            ->sum("total_tax");
                    if($paidTotalYearlyOnPast){
                        $totalAdjustAmt = ($newDemandRequest->AdjustAmt??0) + $paidTotalYearlyOnPast;
                        $newDemandRequest->merge(["AdjustAmt"=>$totalAdjustAmt]);
                        if($totalAdjustAmt>$newDemandRequest->netTotalTax){
                            $newDemandRequest->merge(["AdjustAmt"=>$newDemandRequest->netTotalTax]);
                        }
                    }                    
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

    public function addFormFee(){
        $objAdditionalTax = new AdditionalTax();
        $newRequest = new Request(); 
        $newRequest->merge([
            "saf_detail_id"=>$this->_SAF->id,
            "property_detail_id"=>$this->_PropId,
            "amount"=>10,
            "tax_type"=>"Form Fee",
        ]);

        $objAdditionalTax->store($newRequest);

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