<?php
namespace App\Bll\Property;

use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\CapitalValueRate;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\FloorMaster;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\RentalRateMaster;
use App\Models\Property\RoadType;
use App\Models\Property\RoadTypeConstructionTypeRateMaster;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\TransferModeMaster;
use App\Models\Property\UsageTypeMaster;
use App\Models\Property\UsageTypeRateMaster;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

class TaxCalculator {

    public $_GRID;
    public $_fromDate;
    public $_acctOfLimitation;
    public $_FloorWiseTax;
    public $_FYearWiseTax;
    public $_ulbId;
    public $_zoneId;
    public $_oldWardNo;
    public $_oldWardId;
    public $_newWardNo;
    public $_newWardId;
    public $_isVacantLand = false;
    public $_hasRWH = false;

    public $_ruleSets;
    public $_PropertyType;
    public $_REQUEST;

    public $_ObjOccupancyTypeMaster;
    public $_ObjConstructionTypeMaster;
    public $_ObjApartmentDetail;
    public $_ObjFloorMaster;
    public $_ObjOwnershipTypeMaster;
    public $_ObjPropertyTypeMaster;
    public $_ObjRoadTypeMaster;
    public $_ObjRoadType;
    public $_ObjTransferModeMaster;
    public $_ObjUsageTypeMaster;
    public $_ObjUlbWardMaster;
    public $_ObjOldWardNewWardMap;
    public $_ObjUlbMaster;
    public $_ObjRentalRateMaster;
    public $_ObjUsageTypeRateMaster;
    public $_ObjRoadTypeConstructionTypeRateMaster;
    public $_ObjCapitalValueRate;

    public $_mOccupancyTypeMaster;
    public $_mConstructionTypeMaster;
    public $_mApartmentDetail;
    public $_mFloorMaster;
    public $_mOwnershipTypeMaster;
    public $_mPropertyTypeMaster;
    public $_mRoadTypeMaster;
    public $_mRoadType;
    public $_mTransferModeMaster;
    public $_mUsageTypeMaster;
    public $_mUlbWardMaster;
    public $_mRentalRateMaster;
    public $_mUsageTypeRateMaster;
    public $_mRoadTypeConstructionTypeRateMaster;
    public $_mCapitalValueRate;

    public $_numericWardList;

    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_FloorWiseTax = collect();
        $this->_FYearWiseTax = collect();
        $this->_ruleSets = collect(Config::get("PropertyConstant.RULE_SETS"));

        $this->_ObjOccupancyTypeMaster = new OccupancyTypeMaster();
        $this->_ObjConstructionTypeMaster= new ConstructionTypeMaster();
        $this->_ObjApartmentDetail = new ApartmentDetail();
        $this->_ObjFloorMaster = new FloorMaster();
        $this->_ObjOwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_ObjPropertyTypeMaster = new PropertyTypeMaster();
        $this->_ObjRoadTypeMaster = new RoadTypeMaster();
        $this->_ObjRoadType = new RoadType();
        $this->_ObjTransferModeMaster = new TransferModeMaster();
        $this->_ObjUsageTypeMaster = new UsageTypeMaster();
        $this->_ObjUlbWardMaster = new UlbWardMaster();
        $this->_ObjOldWardNewWardMap = new OldWardNewWardMap();
        $this->_ObjUlbMaster = new UlbMaster();
        $this->_ObjRentalRateMaster = new RentalRateMaster();
        $this->_ObjUsageTypeRateMaster = new UsageTypeRateMaster();
        $this->_ObjRoadTypeConstructionTypeRateMaster = new RoadTypeConstructionTypeRateMaster();
        $this->_ObjCapitalValueRate = new CapitalValueRate();

        // $this->_ObjPropertyTypeMaster->getPropertyTypeList();

        $this->setPropertyType();
        $this->setUlb();
        $this->setZone();
        $this->setAcctOfLimitation();
        $this->loadParam();
        $this->testVacantLand();
        $this->hasRwh();
        $this->setFromDate();
        $this->initFloorWiseTax();
        // $this->initFYearWiseTax();
    }

    
    public function setPropertyType(){
        $this->_PropertyType = $this->_REQUEST->propTypeMstrId;
    }

    public function setUlb(){
        $this->_ulbId = $this->_REQUEST->ulbId;
    }

    public function setZone(){
        $this->_zoneId = $this->_REQUEST["zoneMstrId"];
    }

    public function setOldWard(){
        $oldWard = (collect($this->_mUlbWardMaster)->where("id",$this->_REQUEST["wardMstrId"])->first());
        preg_match('/\d+/', $oldWard->ward_no??"", $matches);
        $this->_oldWardNo = $matches[0];
        $this->_oldWardId = $oldWard->id??"";
    }

    public function setNewWard(){
        $newWard = (collect($this->_mUlbWardMaster)->where("id",$this->_REQUEST["newWardMstrId"])->first());
        if($newWard){
            preg_match('/\d+/', $newWard->ward_no??"", $matches);
            $this->_newWardNo = $matches[0];
            $this->_newWardId = $newWard->id??"";
        }
        else{
            $this->_newWardNo = $this->_oldWardNo;
            $this->_newWardId = $this->_oldWardId;
        }
    }

    public function loadParam(){
        $this->_mOccupancyTypeMaster = $this->_ObjOccupancyTypeMaster->getOccupancyTypeList();
        $this->_mConstructionTypeMaster = $this->_ObjConstructionTypeMaster->getConstructionTypeList();
        $this->_mFloorMaster = $this->_ObjFloorMaster->getFloorList();
        $this->_mOwnershipTypeMaster = $this->_ObjOwnershipTypeMaster->getOwnershipTypeList();
        $this->_mPropertyTypeMaster = $this->_ObjPropertyTypeMaster->getPropertyTypeList();
        $this->_mRoadTypeMaster = $this->_ObjRoadTypeMaster->getRoadTypeList();
        $this->_mRoadType = $this->_ObjRoadType->getRoadTypeList();
        $this->_mTransferModeMaster = $this->_ObjTransferModeMaster->getTransferModeList();
        $this->_mUsageTypeMaster  = $this->_ObjUsageTypeMaster->getUsageTypeList();
        $this->_mUlbWardMaster = $this->_ObjUlbWardMaster->getWardList($this->_ulbId);
        $this->_numericWardList = $this->_ObjUlbWardMaster->getNumericWardList($this->_ulbId);
        $this->_mRentalRateMaster = $this->_ObjRentalRateMaster->getRate();
        $this->_mUsageTypeRateMaster = $this->_ObjUsageTypeRateMaster->getRate();
        $this->_mRoadTypeConstructionTypeRateMaster = $this->_ObjRoadTypeConstructionTypeRateMaster->getRate();
        $this->_mCapitalValueRate = $this->_ObjCapitalValueRate->getRate();

        $this->setOldWard();
        $this->setNewWard();
    }

    public function testVacantLand(){
        $vacantLand = collect($this->_mPropertyTypeMaster)->where("property_type","VACANT LAND")->first();
        if($this->_PropertyType==($vacantLand->id??"")){
            $this->_isVacantLand = true;
        }
    }

    public function hasRwh(){
        if(($this->_REQUEST["isWaterHarvesting"]??false) || ($this->_isVacantLand)){
            $this->_hasRWH = true;
        }
    }

    public function setFromDate(){
        if($this->_isVacantLand){
            $this->_fromDate = $this->_REQUEST["landOccupationDate"];
        }
        else{
            $this->_fromDate = collect($this->_REQUEST["floorDtl"])->min("dateFrom");
        }
        $this->_fromDate = Carbon::parse($this->_fromDate)->format("Y-m-01");
    }

    public function setAcctOfLimitation(){
        $this->_acctOfLimitation = getFY(subtractYear(null,12));
    }

    public function initFloorWiseTax(){
        
        if($this->_isVacantLand){
            $mobileAndHordingTowerArea = 0;
            if($this->_REQUEST["isMobileTower"])
                $mobileAndHordingTowerArea += (float) ($this->_REQUEST["towerArea"]??0);
          
         if($this->_REQUEST["isHoardingBoard"])
            $mobileAndHordingTowerArea += (float)($this->_REQUEST["hoardingArea"]??0);

            $floor = [
                "floorName"=>"VacantLand",
                "builtupArea"=>$this->_REQUEST["areaOfPlot"],
                "mobileAndHordingTowerArea"=>$mobileAndHordingTowerArea,
                "dateFrom"=>Carbon::parse($this->_REQUEST["landOccupationDate"])->lessThan("2016-04-01") ? "2016-04-01" : $this->_REQUEST["landOccupationDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"1",
                "constructionTypeMasterId"=>0,
                "occupancyTypeMasterId"=>1,
                "tax"=>collect(),
            ];
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null),false));
            $this->_FloorWiseTax[] = $floor;
        }
        else{
            foreach($this->_REQUEST["floorDtl"] as $key=>$val){
                $val["tax"]=collect();                
                $val["ruleSets"]=collect($this->setRuleSet($val["dateFrom"],($val["dateUpto"]??null)));
                $val["floorName"] = (collect($this->_mFloorMaster)->where("id",$val["floorMasterId"])->first())->floor_name??"";
                $val["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$val["usageTypeMasterId"])->first())->usage_type??"";
                $val["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$val["constructionTypeMasterId"])->first())->construction_type??"";
                $val["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$val["occupancyTypeMasterId"])->first())->occupancy_name??"";
                $this->_FloorWiseTax->push($val);
            }
        }
        if($this->_REQUEST["isMobileTower"]){
            $floor = [
                "floorName"=>"MobileTower",
                "builtupArea"=>$this->_REQUEST["towerArea"],
                "dateFrom"=>Carbon::parse($this->_REQUEST["towerInstallationDate"])->lessThan("2016-04-01") ? "2016-04-01" : $this->_REQUEST["towerInstallationDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"2",
                "constructionTypeMasterId"=>2,
                "occupancyTypeMasterId"=>$this->_isVacantLand ? 2 : 2,
                "tax"=>collect(),
            ];            
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null),!$this->_isVacantLand));
            if($this->_isVacantLand && $this->_REQUEST["roadWidth"]<=0){

            }
            else{
                $this->_FloorWiseTax[]=$floor;
            }
        }
        if($this->_REQUEST["isHoardingBoard"]){
            $floor = [
                "floorName"=>"HoardingBoard",
                "builtupArea"=>$this->_REQUEST["hoardingArea"],
                "dateFrom"=>Carbon::parse($this->_REQUEST["hoardingInstallationDate"])->lessThan("2016-04-01") ? "2016-04-01" : $this->_REQUEST["hoardingInstallationDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"2",
                "constructionTypeMasterId"=>$this->_isVacantLand ? 2 : 1,
                "occupancyTypeMasterId"=>2,
                "tax"=>collect(),
            ];            
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null),!$this->_isVacantLand));
            if($this->_isVacantLand && $this->_REQUEST["roadWidth"]<=0){

            }
            else{
                $this->_FloorWiseTax[]=$floor;
            }
        }
        if($this->_REQUEST["isPetrolPump"]){
            $floor =[
                "floorName"=>"PetrolPump",
                "builtupArea"=>$this->_REQUEST["underGroundArea"],
                "dateFrom"=>Carbon::parse($this->_REQUEST["petrolPumpCompletionDate"])->lessThan("2016-04-01") ? "2016-04-01" : $this->_REQUEST["petrolPumpCompletionDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"2",
                "constructionTypeMasterId"=>1,
                "occupancyTypeMasterId"=>1,
                "tax"=>collect(),
            ];            
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null)));
            $this->_FloorWiseTax[]=$floor;
        }
    }

    public function setRuleSet($dateFrom,$dateUpto,$isBuilding=true){
        $dateFrom = Carbon::parse($dateFrom)->format("Y-m-d");
        $dateUpto = Carbon::parse($dateUpto)->format("Y-m-d");
        $dateFromFyear = getFY($dateFrom);
        if($dateFromFyear < $this->_acctOfLimitation){
            $dateFromFyear =   $this->_acctOfLimitation;
        }
        $dateUptoFyear = getFY($dateUpto);
        $rules = [];
        while($dateFromFyear<=$dateUptoFyear){
            $testRule = $this->_ruleSets->where("effective_upto_fyear","<=",$dateFromFyear)->where("is_building",$isBuilding);
            if($testRule->isEmpty()){
                $testRule = $this->_ruleSets->where("effective_from_fyear","<=",$dateFromFyear)->where("is_building",$isBuilding);
            }
            // dd($dateFromFyear,$dateUptoFyear,$testRule,$this->_ruleSets);
            foreach($testRule as $key=>$item){
                $rulesFromFYear = getFY($item["effective_from"]);
                $rulesUptoFYear = getFY($item["effective_upto"]);
                if($dateFromFyear>=$rulesFromFYear){
                    $rules[$key] = $item;
                }
            }
            list($fromFyear,$uptoFYear) = explode("-",$dateFromFyear);
            $dateFromFyear = $uptoFYear."-".($uptoFYear+1);
        }
        return collect($rules)->unique();
    }

    public function FloorTaxCalculator(){
        foreach($this->_FloorWiseTax as $key=>$val){
            foreach($val["ruleSets"] as $rulName=>$ruleSets){
                $tax = $this->$rulName($val);
                $this->_FloorWiseTax[$key]["tax"]->push($tax);
                if(!($this->_FYearWiseTax[$rulName]??false)){
                    $this->_FYearWiseTax[$rulName] = collect();
                }
                $floorDtl["floorDtl"] = collect($val)->only(["builtupArea","dateFrom","dateUpto","floorName","usageType","constructionType","occupancyType"]);
                $tax = collect($tax)->merge($floorDtl);
                $this->_FYearWiseTax[$rulName]->push($tax->toArray());
            }
        }
        $this->_GRID["FloorWiseTax"] = $this->_FloorWiseTax;
    }

    public function FYearTaxCalculator(){
        $allTaxes = collect();
        foreach($this->_ruleSets as $key=>$val){
            $ruleTax = ($this->_FYearWiseTax[$key]??[]);
            foreach($ruleTax as $tax){
                foreach($tax["fyearTax"] as $yearlytax){
                    $allTaxes->push($yearlytax);
                }
            }
        }
        $fyearList = collect($allTaxes)->unique("fyear")->pluck("fyear")->sort();
        foreach($fyearList as $year){
            $currentTax = collect($allTaxes)->where("fyear",$year);
            if($currentTax->count()>0){
                $allQuarterlyTax = collect();
                foreach($currentTax as $QTax){
                    foreach($QTax["quarterly"] as $QuarterlyTax){
                        $allQuarterlyTax->push($QuarterlyTax);
                    }
                }
                $fromQtr = $allQuarterlyTax->min("qtr");
                $uptoQtr = $allQuarterlyTax->max("qtr");
                $quarterly = [];
                $cFromQtr = $fromQtr;
                while($cFromQtr <= $uptoQtr){
                    $qTaxes = $allQuarterlyTax->where("qtr",$cFromQtr);
                    
                    if($qTaxes->count()>0){
                        $qt = [
                            "floorCount"=>$qTaxes->count(),
                            "qtr" => $cFromQtr,
							"fyear" => $year,
							"propertyTax" => roundFigure($qTaxes->sum("propertyTax")),
							"HoldingTax" => roundFigure($qTaxes->sum("HoldingTax")),
							"LatrineTax" => roundFigure($qTaxes->sum("LatrineTax")),
							"WaterTax" => roundFigure($qTaxes->sum("WaterTax")),
							"HealthCessTax" => roundFigure($qTaxes->sum("HealthCessTax")),
							"EducationCessTax" => roundFigure($qTaxes->sum("EducationCessTax")),
							"RWH" => roundFigure($qTaxes->sum("RWH")),
							"TotalTax" => roundFigure($qTaxes->sum("TotalTax")),
                        ];
                        $quarterly[]=$qt;
                    }
                    $cFromQtr+=1;
                }
                $RuleSetTax = [
                    "floorCount"=>$currentTax->count(),
                    "fyear"=>$year,
                    "quarterly"=>$quarterly,
                    "fromFYear" => $currentTax->min("fyear"),
                    "fromQtr" => $fromQtr,
                    "uptoFYear" => $currentTax->max("fyear"),
                    "uptoQtr" => $uptoQtr,
                    "propertyTax" => roundFigure($currentTax->sum("propertyTax")),
                    "HoldingTax" => roundFigure($currentTax->sum("HoldingTax")),
                    "HoldingTaxQuarterly" => roundFigure($currentTax->sum("HoldingTaxQuarterly")),
                    "LatrineTax" => roundFigure($currentTax->sum("LatrineTax")),
                    "LatrineTaxQuarterly" => roundFigure($currentTax->sum("LatrineTaxQuarterly")),
                    "WaterTax" => roundFigure($currentTax->sum("WaterTax")),
                    "WaterTaxQuarterly" => roundFigure($currentTax->sum("WaterTaxQuarterly")),
                    "HealthCessTax" => roundFigure($currentTax->sum("HealthCessTax")),
                    "HealthCessTaxQuarterly" => roundFigure($currentTax->sum("HealthCessTaxQuarterly")),
                    "EducationCessTax" => roundFigure($currentTax->sum("EducationCessTax")),
                    "EducationCessTaxQuarterly" => roundFigure($currentTax->sum("EducationCessTaxQuarterly")),
                    "RWH" => roundFigure($currentTax->sum("RWH")),
                    "TotalTax" => roundFigure($currentTax->sum("TotalTax")),
                    "TotalTaxQuarterly" => roundFigure($currentTax->sum("TotalTaxQuarterly")),    
                ];
                $this->_GRID["FyearWiseTax"][] = $RuleSetTax;
            }            

        } 
    }

    public function RuleSetTaxCalculator(){
        $this->_GRID["RuleSetWiseTax"] = $this->_FYearWiseTax;
    }

    public function RuleSetVersionTaxCalculator(){
        $ruleSetTax =[];
        $allRuleSetTax = collect();
        foreach($this->_FYearWiseTax as $rTax){
            foreach($rTax as $tax){
                $allRuleSetTax->push($tax);
            }
        }
        $ruleSetsVersion = $this->_ruleSets->where("is_building",!$this->_isVacantLand);
        foreach($ruleSetsVersion as $key=>$val){
            $tax = $allRuleSetTax
                    ->where("effectiveFrom",">=",$val["effective_from"])
                    ->where("effectiveUpto","<=",$val["effective_upto"]);
            if($tax){                
                $Fyearlytax=[];
                $allTaxes = collect();
                $ruleTax = ($this->_FYearWiseTax[$key]??[]);
                foreach($tax as $Ytax){
                    foreach($Ytax["fyearTax"] as $yearlytax){
                        $allTaxes->push($yearlytax);
                    }
                }
                
                $fyearList = collect($allTaxes)->unique("fyear")->pluck("fyear")->sort();
                foreach($fyearList as $year){
                    $currentTax = collect($allTaxes)->where("fyear",$year);
                    if($currentTax->count()>0){
                        $allQuarterlyTax = collect();
                        foreach($currentTax as $QTax){
                            foreach($QTax["quarterly"] as $QuarterlyTax){
                                $allQuarterlyTax->push($QuarterlyTax);
                            }
                        }
                        $fromQtr = $allQuarterlyTax->min("qtr");
                        $uptoQtr = $allQuarterlyTax->max("qtr");
                        $quarterly = [];
                        $cFromQtr = $fromQtr;
                        while($cFromQtr <= $uptoQtr){
                            $qTaxes = $allQuarterlyTax->where("qtr",$cFromQtr);
                            list($FYear,$UYear) =explode("-",$year); 
                            $dueDate = $FYear."-06-30";
                            if($cFromQtr==2){
                                $dueDate = $FYear."-09-30";
                            }
                            if($cFromQtr==3){
                                $dueDate = $FYear."-12-31";
                            }
                            if($cFromQtr==4){
                                $dueDate = $UYear."-03-31";
                            }
                            if($qTaxes->count()>0){
                                $qt = [
                                    "floorCount"=>$qTaxes->count(),
                                    "qtr" => $cFromQtr,
                                    "dueDate"=>$dueDate,
                                    "fyear" => $year,
                                    "propertyTax" => roundFigure($qTaxes->sum("propertyTax")),
                                    "HoldingTax" => roundFigure($qTaxes->sum("HoldingTax")),
                                    "LatrineTax" => roundFigure($qTaxes->sum("LatrineTax")),
                                    "WaterTax" => roundFigure($qTaxes->sum("WaterTax")),
                                    "HealthCessTax" => roundFigure($qTaxes->sum("HealthCessTax")),
                                    "EducationCessTax" => roundFigure($qTaxes->sum("EducationCessTax")),
                                    "RWH" => roundFigure($qTaxes->sum("RWH")),
                                    "TotalTax" => roundFigure($qTaxes->sum("TotalTax")),
                                ];
                                $quarterly[]=$qt;
                            }
                            $cFromQtr+=1;
                        }
                        $quarterly = collect($quarterly)->sortBy("qtr")->toArray();
                        
                        $Tax = [
                            "floorCount"=>$currentTax->count(),
                            "fyear"=>$year,
                            "quarterly"=>$quarterly,
                            "fromFYear" => $currentTax->min("fyear"),
                            "fromQtr" => $fromQtr,
                            "uptoFYear" => $currentTax->max("fyear"),
                            "uptoQtr" => $uptoQtr,
                            "propertyTax" => roundFigure($currentTax->sum("propertyTax")),
                            "HoldingTax" => roundFigure($currentTax->sum("HoldingTax")),
                            "HoldingTaxQuarterly" => roundFigure($currentTax->sum("HoldingTaxQuarterly")),
                            "LatrineTax" => roundFigure($currentTax->sum("LatrineTax")),
                            "LatrineTaxQuarterly" => roundFigure($currentTax->sum("LatrineTaxQuarterly")),
                            "WaterTax" => roundFigure($currentTax->sum("WaterTax")),
                            "WaterTaxQuarterly" => roundFigure($currentTax->sum("WaterTaxQuarterly")),
                            "HealthCessTax" => roundFigure($currentTax->sum("HealthCessTax")),
                            "HealthCessTaxQuarterly" => roundFigure($currentTax->sum("HealthCessTaxQuarterly")),
                            "EducationCessTax" => roundFigure($currentTax->sum("EducationCessTax")),
                            "EducationCessTaxQuarterly" => roundFigure($currentTax->sum("EducationCessTaxQuarterly")),
                            "RWH" => roundFigure($currentTax->sum("RWH")),
                            "TotalTax" => roundFigure($currentTax->sum("TotalTax")),
                            "TotalTaxQuarterly" => roundFigure($currentTax->sum("TotalTaxQuarterly")),    
                        ];
                        $Fyearlytax[] = $Tax;
                    }            

                }
                $Fyearlytax = collect($Fyearlytax)->sortBy("fyear")->toArray();
                $ruleSetTax = [
                    "ruleSet" => collect($tax)->unique("ruleSet")->implode("ruleSet",", "),
                    "description"=>collect($tax)->unique("description")->implode("description",", "),
                    "effectiveFrom"=>$tax->min("effectiveFrom"),
                    "effectiveFromFYear"=>$tax->min("effectiveFromFYear"),
                    "effectiveUpto"=>$tax->max("effectiveUpto"),
                    "effectiveUptoFYear"=>$tax->max("effectiveUptoFYear"),
                    "fromFYear"=>$tax->min("fromFYear"),
                    "fromQtr"=>$tax->min("fromQtr"),
                    "uptoFYear"=>$tax->max("uptoFYear"),
                    "uptoQtr"=>$tax->max("uptoQtr"),
                    "ALV"=>roundFigure($tax->sum("ALV")),
                    "propertyTax"=>roundFigure($tax->sum("propertyTax")),
                    "HoldingTax"=>roundFigure($tax->sum("HoldingTax")),
                    "HoldingTaxQuarterly"=>roundFigure($tax->sum("HoldingTaxQuarterly")),
                    "LatrineTax"=>roundFigure($tax->sum("LatrineTax")),
                    "LatrineTaxQuarterly"=>roundFigure($tax->sum("LatrineTaxQuarterly")),
                    "WaterTax"=>roundFigure($tax->sum("WaterTax")),
                    "WaterTaxQuarterly"=>roundFigure($tax->sum("WaterTaxQuarterly")),                    
                    "HealthCessTax"=>roundFigure($tax->sum("HealthCessTax")),
                    "HealthCessTaxQuarterly"=>roundFigure($tax->sum("HealthCessTaxQuarterly")),                    
                    "EducationCessTax"=>roundFigure($tax->sum("EducationCessTax")),                                       
                    "EducationCessTaxQuarterly"=>roundFigure($tax->sum("EducationCessTaxQuarterly")),
                    "RWH"=>roundFigure($tax->sum("RWH")),
                    "RWHQuarterly"=>roundFigure($tax->sum("Quarterly")),
                    "TotalTax"=>roundFigure($tax->sum("TotalTax")),
                    "TotalTaxQuarterly"=>roundFigure($tax->sum("TotalTaxQuarterly")),
                    "Fyearlytax"=>$Fyearlytax,
                    "DTL"=>collect($tax)->values()
                ];
                $this->_GRID["RuleSetVersionTax"][] = $ruleSetTax;
            }
        }
    }



    /**
     * effective From: 2016-04-01 upto : 2022-03-31
     * ======================== Formula ==========================================
     *              Tax = Area (sqm) X Rental Rate X Occupancy Factor
     *              =========if(no road)===============
     *              Tax = (Area/100) X Rental Rate X Occupancy Factor
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 100%
     *          (b) Latrine tax 0%
     *          (c) Water tax 0%
     *          (d) Health cess 0%
     *          (e) Education cess 0%
     *          (f) Rain Water Harvesting 0%
     */
    public function VacantRules1($floor){
        $floorTax = [
            "ruleSet"=>"VacantRules1",
            "effectiveFrom"=>"2016-04-01",
            "effectiveFromFYear"=>getFY("2016-04-01"),
            "effectiveUpto"=> "2022-03-31",
            "effectiveUptoFYear"=>getFY("2022-03-31"),
            "description"=>"<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Tax = Area (sqm) X Rental Rate X Occupancy Factor
                                \n*              =========if(no road)===============
                                \n*              Tax = (Area/100) X Rental Rate X Occupancy Factor
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 100%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                                \n*          (f) Rain Water Harvesting 0%
                            \n</pre>",
        ];
        
        $roadTypeId = (collect($this->_mRoadType)
                    ->where("effective_from",">=",$floorTax["effectiveFrom"])
                    ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                    ->where("effective_from","<=",$floorTax["effectiveUpto"])
                    ->filter(function ($item) {
                        return floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);
                    })->first())->road_type_id??0;
        $areaInSqMt = decimalToSqMt($floor["builtupArea"])-sqFtToSqMt($floor["mobileAndHordingTowerArea"]??0);
        if($floor["floorName"]!="VacantLand"){
            $areaInSqMt =  sqFtToSqMt($floor["builtupArea"]);
        }
        if($roadTypeId==4){
            $areaInSqMt = decimalToAcre($floor["builtupArea"]-sqMtToDecimal($floor["mobileAndHordingTowerArea"]??0));
        }
        
        $rentalRete = collect($this->_mRoadTypeConstructionTypeRateMaster)
                ->where("construction_type_id",$floor["constructionTypeMasterId"])
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("road_type_id",$roadTypeId)
                ->first(); 
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();

        $PropertyTax = $areaInSqMt * $rentalRete->rate * $occupancyRate->mult_factor;
        $HoldingTaxPercent = 1; 
        $LatrineTaxPercent = 0.0;
        $WaterTaxPercent = 0.0;
        $HealthCessTaxPercent = 0.0;            
        $EducationCessTaxPercent = 0.0;

        $HoldingTax = round(($PropertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($PropertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($PropertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($PropertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($PropertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH ? 0 : $HoldingTax/2;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        $taxMinFrom = subtractYear(null,12);
        $taxMinFYear = getFY($taxMinFrom);
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }
        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "calculateArea"=>$areaInSqMt,
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>0,
            "propertyTax"=>$PropertyTax,
            "RentalRate"=>$rentalRete->rate,
            "occupancyRate"=>$occupancyRate->mult_factor,
            "RebatePercent"=>0,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;

    }

    /**
     * effective From: 2022-04-01 upto : ____-__-__
     * ======================== Formula ==========================================
     *              Tax = Area (sqm) X Rental Rate X Occupancy Factor
     *              =========if(no road)===============
     *              Tax = (Area/100) X Rental Rate X Occupancy Factor
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 100%
     *          (b) Latrine tax 0%
     *          (c) Water tax 0%
     *          (d) Health cess 0%
     *          (e) Education cess 0%
     *          (f) Rain Water Harvesting 0%
     */
    public function VacantRules2($floor){
        $floorTax = [
            "ruleSet"=>"VacantRules2",
            "effectiveFrom"=>"2022-04-01",
            "effectiveFromFYear"=>getFY("2022-04-01"),
            "effectiveUpto"=>explode("-",getFY(null))[1]."-03-31" ,
            "effectiveUptoFYear"=>getFY(null),
            "description"=>"<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Tax = Area (sqm) X Rental Rate X Occupancy Factor
                                \n*              =========if(no road)===============
                                \n*              Tax = (Area/100) X Rental Rate X Occupancy Factor
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 100%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                                \n*          (f) Rain Water Harvesting 0%
                            \n</pre>",
        ];
        
        $roadTypeId = (collect($this->_mRoadType)
                    ->where("effective_from",">=",$floorTax["effectiveFrom"])
                    ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                    ->where("effective_from","<=",$floorTax["effectiveUpto"])
                    ->filter(function ($item) {
                        return floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);
                    })->first())->road_type_id??0;
        $areaInSqMt = decimalToSqMt($floor["builtupArea"])-sqFtToSqMt($floor["mobileAndHordingTowerArea"]??0);
        if($floor["floorName"]!="VacantLand"){
            $floor["constructionTypeMasterId"] =1;
            return $this->VacantBuildingRules3MobilHording($floor);
            $areaInSqMt =  ($this->_REQUEST["builtupArea"]);
        }
        if($roadTypeId==4){
            $areaInSqMt = decimalToAcre($floor["builtupArea"]-sqMtToDecimal($floor["mobileAndHordingTowerArea"]??0));
        }
        $rentalRete = collect($this->_mRoadTypeConstructionTypeRateMaster)
                ->where("construction_type_id",$floor["constructionTypeMasterId"])
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("road_type_id",$roadTypeId)
                ->first(); 
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();

        $PropertyTax = $areaInSqMt * $rentalRete->rate * $occupancyRate->mult_factor;
        $HoldingTaxPercent = 1; 
        $LatrineTaxPercent = 0.0;
        $WaterTaxPercent = 0.0;
        $HealthCessTaxPercent = 0.0;            
        $EducationCessTaxPercent = 0.0;

        $HoldingTax = round(($PropertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($PropertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($PropertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($PropertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($PropertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH ? 0 : $HoldingTax/2;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        $taxMinFrom = subtractYear(null,12);
        $taxMinFYear = getFY($taxMinFrom);
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }
        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "calculateArea"=>$areaInSqMt,
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>0,
            "propertyTax"=>$PropertyTax,
            "RentalRate"=>$rentalRete->rate,            
            "occupancyRate"=>$occupancyRate->mult_factor,
            "RebatePercent"=>0,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;

    }

    /**
     * effective From:2022-04-01 upto: 2024-03-31
     * ========================= Formula ===========================================
     *              Property Tax = Capital Value Rate X Buildup Area X Occupancy Factor X Tax Percentage X Calculation Factor X Matrix Factor Rate (Only in case of 100% residential property)
     *          
     *          -----------------Case Tax Percentage of(Property Tax)---------------------------------
     *              a. Residential - 0.075%
     *              b. Commercial - 0.150%
     *              c. Commercial & greater than 25000 sQ.Ft. - 0.20%
     * 
     *          ---------------------------------------------------------------------
     *          |                                                                    |
     *          |       Property Tax = Property Tax X (Case Tax Percentage)          |
     *          |                                                                    |
     *          ----------------------------------------------------------------------
     *          
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 100%
     *          (b) Latrine tax 0%
     *          (c) Water tax 0%
     *          (d) Health cess 0%
     *          (e) Education cess 0%
     *          (f) Rain Water Harvesting = (Holding tax/2)
     */

    public function VacantBuildingRules3MobilHording($floor){
        $floorTax = [
            "ruleSet"=>"VacantRules2",
            "effectiveFrom"=>"2022-04-01",
            "effectiveFromFYear"=>getFY("2022-04-01"),
            "effectiveUpto"=>explode("-",getFY(null))[1]."-03-31" ,
            "effectiveUptoFYear"=>getFY(null),
            "description"=>"<pre>
                                \n*-------------<b><u>FOR CONTRACT AREA LIKE: MOBILE TOWER OR HORDING BOARD</u></b>------------
                                \n* ========================= Formula ===========================================
                                \n*              Property Tax = Capital Value Rate X Buildup Area X Occupancy Factor X Tax Percentage X Calculation Factor X Matrix Factor Rate (Only in case of 100% residential property)
                                \n*          
                                \n*          -----------------Case Tax Percentage of(Property Tax)---------------------------------
                                \n*              a. Residential - 0.075%
                                \n*              b. Commercial - 0.150%
                                \n*              c. Commercial & greater than 25000 sQ.Ft. - 0.20%
                                \n* 
                                \n*          ---------------------------------------------------------------------
                                \n*          |                                                                    |
                                \n*          |       Property Tax = Property Tax X (Case Tax Percentage)          |
                                \n*          |                                                                    |
                                \n*          ----------------------------------------------------------------------
                                \n*          
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 100%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                                \n*          (f) Rain Water Harvesting = (Holding tax/2)
                            \n</pre>",
        ];
        $roadTypeId = (collect($this->_mRoadType)
                    ->where("effective_from",">=",$floorTax["effectiveFrom"])
                    ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                    ->where("effective_from","<=",$floorTax["effectiveUpto"])
                    ->filter(function ($item) {
                        return floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);
                    })->first())->road_type_id??0;
        $road_type_mstr_id = ($roadTypeId == 2) ? 1 : 0;

        $buildupArea =  $floor["builtupArea"];
        $isResidentialUse = $floor["usageTypeMasterId"]==1 ? true : false;
        $carpetArea = $buildupArea * 0.8;
        if($isResidentialUse){
            $carpetArea = $buildupArea * 0.7;
        }
        $taxPercent = 0.00150;
        if(!$isResidentialUse && $buildupArea > 25000){
            $taxPercent = (float)0.0020;
        }
        if($isResidentialUse || $floor["usageTypeMasterId"]==44){#44 is NGOS ON NO-PROFIT
            $taxPercent = (float)0.00075;
        }
        $property_type = "BUILDING_PAKKA";
        $usage_type = $isResidentialUse ? "RESIDENTIAL" : "COMMERCIAL";
        $matrixFactorRate = 1;
        if ( $isResidentialUse && $road_type_mstr_id == 0 && $property_type == "DLX_APARTMENT") {
            $matrixFactorRate = 0.8;
        } else if ($isResidentialUse && $road_type_mstr_id == 1 && $property_type == "BUILDING_KACCHA") {
            $matrixFactorRate = 0.5;
        } else if ($isResidentialUse && $road_type_mstr_id == 0 && $property_type == "BUILDING_PAKKA") {
            $matrixFactorRate = 0.8;
        } else if ($isResidentialUse && $road_type_mstr_id == 0 && $property_type == "BUILDING_KACCHA") {
            $matrixFactorRate = 0.4;
        }
        $capitalValue = collect($this->_mCapitalValueRate)
                        ->where("ulb_id",$this->_ulbId)
                        ->where("effective_from",">=",$floorTax["effectiveFrom"])
                        ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                        ->where("effective_from","<=",$floorTax["effectiveUpto"])
                        ->where("road_type_master_id",$road_type_mstr_id)
                        ->where("property_type",$property_type)
                        ->where("usage_type",$usage_type)
                        ->where("ward_no",$this->_oldWardNo)
                        ->first();
        
        $usageRate = collect($this->_mUsageTypeRateMaster)
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("usage_type_master_id",$floor["usageTypeMasterId"])
                ->first();
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();
        
        $propertyTax = $capitalValue->rate * $buildupArea  * $occupancyRate->mult_factor * $taxPercent * $usageRate->rate * $matrixFactorRate;
        
        $HoldingTaxPercent = 0.02; 
        $LatrineTaxPercent = 0.0;
        $WaterTaxPercent = 0.0;
        $HealthCessTaxPercent = 0.0;            
        $EducationCessTaxPercent = 0.0;

        $HoldingTax = round(($propertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($propertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($propertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($propertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($propertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH?0:$HoldingTax/2;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        $taxMinFrom = subtractYear(null,12);
        $taxMinFYear = getFY($taxMinFrom);
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }
        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>0,
            "propertyTax"=>$propertyTax,
            "capitalValue"=>$capitalValue->rate,
            "buildupArea"=>$buildupArea,
            "occupancyRate"=>$occupancyRate->mult_factor,
            "taxPercent"=>$taxPercent,
            "usageRate"=>$usageRate->rate,
            "matrixFactorRate"=>$matrixFactorRate,
            "RentalRate"=>0,
            "RebatePercent"=>0,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;
    }
    

    /**
     * effective From: ____-__-__ upto : 2016-03-31
     * ======================== Formula ==========================================
     *              Annual Rental Value (ARV)  : Buildup Area(Sq. Ft) X Rental Rate
     * 
     *      --------------------Case Rebate(Less The Amount)-------------------------------------------
     *              After calculating the A.R.V. the rebates are allowed in following manner : - Holding older than 25 years (as on 1967-68) - 10% Own occupation (INDEPENDENT BUILDING)
     *              
     *              a. Residential - 30%
     *              b. Commercial - 15%
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 12.5%
     *          (b) Latrine tax 7.5%
     *          (c) Water tax 7.5%
     *          (d) Health cess 6.25%
     *          (e) Education cess 5.0%
     *          (f) Rain Water Harvesting 0%
     */
    #
    public function BuildingRules1($floor){
        $floorTax = [
            "ruleSet"=>"BuildingRules1",
            "effectiveFrom"=>explode("-",$this->_acctOfLimitation)[0]."-04-01",
            "effectiveFromFYear"=>$this->_acctOfLimitation,
            "effectiveUpto"=> "2016-03-31",
            "effectiveUptoFYear"=>getFY("2016-03-31"),
            "description"=>"<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Annual Rental Value (ARV)  : Buildup Area(Sq. Ft) X Rental Rate
                                \n* 
                                \n*      --------------------Case Rebate(Less The Amount)-------------------------------------------
                                \n*              After calculating the A.R.V. the rebates are allowed in following manner : - Holding older than 25 years (as on 1967-68) - 10% Own occupation (INDEPENDENT BUILDING)
                                \n*              
                                \n*              a. Residential - 30%
                                \n*              b. Commercial - 15%
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 12.5%
                                \n*          (b) Latrine tax 7.5%
                                \n*          (c) Water tax 7.5%
                                \n*          (d) Health cess 6.25%
                                \n*          (e) Education cess 5.0%
                                \n*          (f) Rain Water Harvesting 0%
                            \n</pre>",
        ];
        $isIndependentBuilding = $this->_PropertyType==(collect($this->_mPropertyTypeMaster)->where("property_type","INDEPENDENT BUILDING")->first())->id??"" ? true : false;        
        $buildupArea =  $floor["builtupArea"];
        $isResidentialUse = $floor["usageTypeMasterId"]==1 ? true : false;
        
        $floorAge = yearDiff($floor["dateFrom"],"1967-04-01");
        $rebate = $isResidentialUse ? 30 : 15 ;
        if($floorAge >= 25 && $isIndependentBuilding && $isResidentialUse){
            $rebate +=10;
        }
        $RentalRate = collect($this->_mRentalRateMaster)->where("zone_id",$this->_zoneId)
                ->where("is_residential",$isResidentialUse)
                ->where("construction_type_master_id",$floor["constructionTypeMasterId"])
                ->first();
        $lessARVPercent = $rebate/100;
        $ARV = $floor["builtupArea"] * ($RentalRate->rate);
        $LessARV = $ARV - ($ARV * $lessARVPercent);
        $HoldingTaxPercent = 0.125; 
        $LatrineTaxPercent = 0.075;
        $WaterTaxPercent = 0.075;
        $HealthCessTaxPercent = 0.0625;            
        $EducationCessTaxPercent = 0.05;

        $HoldingTax = round(($LessARV * $HoldingTaxPercent),2);
        $LatrineTax = round(($LessARV * $LatrineTaxPercent),2);
        $WaterTax = round(($LessARV * $WaterTaxPercent),2);
        $HealthCessTax = round(($LessARV * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($LessARV * $EducationCessTaxPercent),2);
        $RWH = 0;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        $taxMinFrom = subtractYear(null,12);
        $taxMinFYear = getFY($taxMinFrom);
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }
        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>$LessARV,
            "propertyTax"=>0,
            "RentalRate"=>$RentalRate->rate,
            "RebatePercent"=>$lessARVPercent,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;
    }

    /**
     * effective From:2016-04-01 upto: 2022-03-31
     * ========================= Formula ===========================================
     *              Annual Rental Value (ARV) = Carpet Area X Usage Factor X Occupancy Factor X Rental Rate
     *          
     *          -----------------Case Carpet Area---------------------------------
     *              a. Carpet area for residential - 70% of buildup area
     *              b. Carpet area for commercial - 80% of buildup area
     *          
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 2%
     *          (b) Latrine tax 0%
     *          (c) Water tax 0%
     *          (d) Health cess 0%
     *          (e) Education cess 0%
     *          (f) Rain Water Harvesting = (Holding tax/2)
     */

    public function BuildingRules2($floor){
        $floorTax = [
            "ruleSet"=>"BuildingRules2",
            "effectiveFrom"=>"2016-04-01",
            "effectiveFromFYear"=>getFY("2016-04-01"),
            "effectiveUpto"=>"2022-03-31" ,
            "effectiveUptoFYear"=>getFY("2022-03-31"),
            "description"=>"<pre>
                                \n* ========================= Formula ===========================================
                                \n*              Annual Rental Value (ARV) = Carpet Area X Usage Factor X Occupancy Factor X Rental Rate
                                \n*          
                                \n*          -----------------Case Carpet Area---------------------------------
                                \n*              a. Carpet area for residential - 70% of buildup area
                                \n*              b. Carpet area for commercial - 80% of buildup area
                                \n*          
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 2%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                                \n*          (f) Rain Water Harvesting = (Holding tax/2)
                            \n</pre>",
        ];
        $roadTypeId = (collect($this->_mRoadType)
                    ->where("effective_from",">=",$floorTax["effectiveFrom"])
                    ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                    ->where("effective_from","<=",$floorTax["effectiveUpto"])
                    ->filter(function ($item) {
                        return floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);
                    })->first())->road_type_id??0;

        $buildupArea =  $floor["builtupArea"];
        $isResidentialUse = $floor["usageTypeMasterId"]==1 ? true : false;
        $carpetArea = $buildupArea * 0.8;
        if($isResidentialUse){
            $carpetArea = $buildupArea * 0.7;
        }
        $usageRate = collect($this->_mUsageTypeRateMaster)
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("usage_type_master_id",$floor["usageTypeMasterId"])
                ->first();
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();
        $rentalRete = collect($this->_mRoadTypeConstructionTypeRateMaster)
                ->where("construction_type_id",$floor["constructionTypeMasterId"])
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("road_type_id",$roadTypeId)
                ->first();            
        
        $ARV = $carpetArea * ($usageRate->rate) * ($occupancyRate->mult_factor) * ($rentalRete->rate);
        $HoldingTaxPercent = 0.02; 
        $LatrineTaxPercent = 0.0;
        $WaterTaxPercent = 0.0;
        $HealthCessTaxPercent = 0.0;            
        $EducationCessTaxPercent = 0.0;

        $HoldingTax = round(($ARV * $HoldingTaxPercent),2);
        $LatrineTax = round(($ARV * $LatrineTaxPercent),2);
        $WaterTax = round(($ARV * $WaterTaxPercent),2);
        $HealthCessTax = round(($ARV * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($ARV * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH?0:$HoldingTax/2;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        $taxMinFrom = subtractYear(null,12);
        $taxMinFYear = getFY($taxMinFrom);
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }
        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>$ARV,
            "propertyTax"=>0,
            "RentalRate"=>$rentalRete->rate,
            "carpetArea"=>$carpetArea,
            "usageRate"=>$usageRate->rate,
            "occupancyRate"=>$occupancyRate->mult_factor,
            "rentalRete"=>$rentalRete->rate,
            "RebatePercent"=>0,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;
    }

    /**
     * effective From:2022-04-01 upto: 2024-03-31
     * ========================= Formula ===========================================
     *              Property Tax = Capital Value Rate X Buildup Area X Occupancy Factor X Tax Percentage X Calculation Factor X Matrix Factor Rate (Only in case of 100% residential property)
     *          
     *          -----------------Case Tax Percentage of(Property Tax)---------------------------------
     *              a. Residential - 0.075%
     *              b. Commercial - 0.150%
     *              c. Commercial & greater than 25000 sQ.Ft. - 0.20%
     * 
     *          ---------------------------------------------------------------------
     *          |                                                                    |
     *          |       Property Tax = Property Tax X (Case Tax Percentage)          |
     *          |                                                                    |
     *          ----------------------------------------------------------------------
     *          
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 100%
     *          (b) Latrine tax 0%
     *          (c) Water tax 0%
     *          (d) Health cess 0%
     *          (e) Education cess 0%
     *          (f) Rain Water Harvesting = (Holding tax/2)
     */
    public function BuildingRules3($floor){
        $floorTax = [
            "ruleSet"=>"BuildingRules3",
            "effectiveFrom"=>"2022-04-01",
            "effectiveFromFYear"=>getFY("2022-04-01"),
            "effectiveUpto"=>"2024-03-31" ,
            "effectiveUptoFYear"=>getFY("2024-03-31"),
            "description"=>"<pre>
                                \n* ========================= Formula ===========================================
                                \n*              Property Tax = Capital Value Rate X Buildup Area X Occupancy Factor X Tax Percentage X Calculation Factor X Matrix Factor Rate (Only in case of 100% residential property)
                                \n*          
                                \n*          -----------------Case Tax Percentage of(Property Tax)---------------------------------
                                \n*              a. Residential - 0.075%
                                \n*              b. Commercial - 0.150%
                                \n*              c. Commercial & greater than 25000 sQ.Ft. - 0.20%
                                \n* 
                                \n*          ---------------------------------------------------------------------
                                \n*          |                                                                    |
                                \n*          |       Property Tax = Property Tax X (Case Tax Percentage)          |
                                \n*          |                                                                    |
                                \n*          ----------------------------------------------------------------------
                                \n*          
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 100%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                                \n*          (f) Rain Water Harvesting = (Holding tax/2)
                            \n</pre>",
        ];
        $roadTypeId = (collect($this->_mRoadType)
                    ->where("effective_from",">=",$floorTax["effectiveFrom"])
                    ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                    ->where("effective_from","<=",$floorTax["effectiveUpto"])
                    ->filter(function ($item) {
                        return floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);
                    })->first())->road_type_id??0;
        $road_type_mstr_id = ($roadTypeId == 1) ? 1 : 0;

        $buildupArea =  $floor["builtupArea"];
        $isResidentialUse = $floor["usageTypeMasterId"]==1 ? true : false;
        $carpetArea = $buildupArea * 0.8;
        if($isResidentialUse){
            $carpetArea = $buildupArea * 0.7;
        }
        $taxPercent = 0.00150;
        if(!$isResidentialUse && $buildupArea > 25000){
            $taxPercent = (float)0.0020;
        }
        if($isResidentialUse || $floor["usageTypeMasterId"]==44){#44 is NGOS ON NO-PROFIT
            $taxPercent = (float)0.00075;
        }
        $property_type = "DLX_APARTMENT";
        if (in_array($this->_PropertyType, ["1", "2", "5"])) { // 1=Super, 2=Independent, 3=Occupied
            $property_type = ($floor['constructionTypeMasterId'] == 1) ? "BUILDING_PAKKA" : "BUILDING_KACCHA";
        }
        if ($property_type == "DLX_APARTMENT" && $floor['constructionTypeMasterId']!= 1) {
            $property_type = "BUILDING_KACCHA";
        }
        $usage_type = $isResidentialUse ? "RESIDENTIAL" : "COMMERCIAL";
        $matrixFactorRate = 1;
        if ( $isResidentialUse && $road_type_mstr_id == 0 && $property_type == "DLX_APARTMENT") {
            $matrixFactorRate = 0.8;
        } else if ($isResidentialUse && $road_type_mstr_id == 1 && $property_type == "BUILDING_KACCHA") {
            $matrixFactorRate = 0.5;
        } else if ($isResidentialUse && $road_type_mstr_id == 0 && $property_type == "BUILDING_PAKKA") {
            $matrixFactorRate = 0.8;
        } else if ($isResidentialUse && $road_type_mstr_id == 0 && $property_type == "BUILDING_KACCHA") {
            $matrixFactorRate = 0.4;
        }
        $capitalValue = collect($this->_mCapitalValueRate)
                        ->where("ulb_id",$this->_ulbId)
                        ->where("effective_from",">=",$floorTax["effectiveFrom"])
                        ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                        ->where("effective_from","<=",$floorTax["effectiveUpto"])
                        ->where("road_type_master_id",$road_type_mstr_id)
                        ->where("property_type",$property_type)
                        ->where("usage_type",$usage_type)
                        ->where("ward_no",$this->_oldWardNo)
                        ->first();
        
        $usageRate = collect($this->_mUsageTypeRateMaster)
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("usage_type_master_id",$floor["usageTypeMasterId"])
                ->first();
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();
        
        $propertyTax = $capitalValue->max_rate * $buildupArea  * $occupancyRate->mult_factor * $taxPercent * $usageRate->rate * $matrixFactorRate;

        $HoldingTaxPercent = 0.02; 
        $LatrineTaxPercent = 0.0;
        $WaterTaxPercent = 0.0;
        $HealthCessTaxPercent = 0.0;            
        $EducationCessTaxPercent = 0.0;

        $HoldingTax = round(($propertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($propertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($propertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($propertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($propertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH?0:$HoldingTax/2;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        $taxMinFrom = subtractYear(null,12);
        $taxMinFYear = getFY($taxMinFrom);
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }
        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>0,
            "propertyTax"=>$propertyTax,
            "capitalValue"=>$capitalValue->max_rate,            
            "buildupArea"=>$buildupArea,
            "occupancyRate"=>$occupancyRate->mult_factor,
            "taxPercent"=>$taxPercent,
            "usageRate"=>$usageRate->rate,
            "matrixFactorRate"=>$matrixFactorRate,
            "RentalRate"=>0,
            "RebatePercent"=>0,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;
    }

    /**
     * effective From:2024-04-01 upto: ____-__-__
     * ========================= Formula ===========================================
     *              Property Tax = Capital Value Rate X Buildup Area X Occupancy Factor X Tax Percentage X Calculation Factor X Matrix Factor Rate (Only in case of 100% residential property)
     *          
     *          -----------------Case Tax Percentage of(Property Tax)---------------------------------
     *              a. Residential - 0.075%
     *              b. Commercial - 0.150%
     *              c. Commercial & greater than 25000 sQ.Ft. - 0.20%
     * 
     *          ---------------------------------------------------------------------
     *          |                                                                    |
     *          |       Property Tax = Property Tax X (Case Tax Percentage)          |
     *          |                                                                    |
     *          ----------------------------------------------------------------------
     *          
     * 
     *      ------------------------ Tax -----------------------------------------
     *          (a) Holding tax 100%
     *          (b) Latrine tax 0%
     *          (c) Water tax 0%
     *          (d) Health cess 0%
     *          (e) Education cess 0%
     *          (f) Rain Water Harvesting = (Holding tax/2)
     */
    public function BuildingRules4($floor){
        $floorTax = [
            "ruleSet"=>"BuildingRules4",
            "effectiveFrom"=>"2024-04-01",
            "effectiveFromFYear"=>getFY("2024-04-01"),
            "effectiveUpto"=>explode("-",getFY(null))[1]."-03-31" ,
            "effectiveUptoFYear"=>getFY(null),
            "description"=>trim("<pre>
                                \n* ========================= Formula ===========================================
                                \n*              Property Tax = Capital Value Rate X Buildup Area X Occupancy Factor X Tax Percentage X Calculation Factor X Matrix Factor Rate (Only in case of 100% residential property)
                                \n*          
                                \n*          -----------------Case Tax Percentage of(Property Tax)---------------------------------
                                \n*              a. Residential - 0.075% 
                                \n*              b. Commercial - 0.150% 
                                \n*              c. Commercial & greater than 25000 sQ.Ft. - 0.20% 
                                \n* 
                                \n*          ---------------------------------------------------------------------
                                \n*          |                                                                    |
                                \n*          |       Property Tax = Property Tax X (Case Tax Percentage)          |
                                \n*          |                                                                    |
                                \n*          ----------------------------------------------------------------------
                                \n*          
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 100%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                                \n*          (f) Rain Water Harvesting = (Holding tax/2)
                            \n</pre>"," "),
        ];
        $roadTypeId = (collect($this->_mRoadType)
                    ->where("effective_from",">=",$floorTax["effectiveFrom"])
                    ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                    ->where("effective_from","<=",$floorTax["effectiveUpto"])
                    ->filter(function ($item) {
                        return floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);
                    })->first())->road_type_id??0;
        $road_type_mstr_id = ($roadTypeId == 1) ? 1 : 0; 

        $buildupArea =  $floor["builtupArea"];
        $isResidentialUse = $floor["usageTypeMasterId"]==1 ? true : false;
        $carpetArea = $buildupArea * 0.8;
        if($isResidentialUse){
            $carpetArea = $buildupArea * 0.7;
        }
        $taxPercent = 0.00150;
        if(!$isResidentialUse && $buildupArea > 25000){
            $taxPercent = (float)0.0020;
        }
        if($isResidentialUse || $floor["usageTypeMasterId"]==44){#44 is NGOS ON NO-PROFIT
            $taxPercent = (float)0.00075;
        }
        $property_type = "DLX_APARTMENT";
        if (in_array($this->_PropertyType, ["1", "2", "5"])) { // 1=Super, 2=Independent, 3=Occupied
            $property_type = ($floor['constructionTypeMasterId'] == 1) ? "BUILDING_PAKKA" : "BUILDING_KACCHA";
        }
        if ($property_type == "DLX_APARTMENT" && $floor['constructionTypeMasterId']!= 1) {
            $property_type = "BUILDING_KACCHA";
        }
        $usage_type = $isResidentialUse ? "RESIDENTIAL" : "COMMERCIAL";
        $matrixFactorRate = 1;
        if ( $isResidentialUse && $road_type_mstr_id == 0 && $property_type == "DLX_APARTMENT") {
            $matrixFactorRate = 0.8;
        } else if ($isResidentialUse && $road_type_mstr_id == 1 && $property_type == "BUILDING_KACCHA") {
            $matrixFactorRate = 0.5;
        } else if ($isResidentialUse && $road_type_mstr_id == 0 && $property_type == "BUILDING_PAKKA") {
            $matrixFactorRate = 0.8;
        } else if ($isResidentialUse && $road_type_mstr_id == 0 && $property_type == "BUILDING_KACCHA") {
            $matrixFactorRate = 0.4;
        }
        $capitalValue = collect($this->_mCapitalValueRate)
                        ->where("ulb_id",$this->_ulbId)
                        ->where("effective_from",">=",$floorTax["effectiveFrom"])
                        ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                        // ->where("effective_from","<=",$floorTax["effectiveUpto"]) # when another rate given then update database and active it
                        ->where("road_type_master_id",$road_type_mstr_id)
                        ->where("property_type",$property_type)
                        ->where("usage_type",$usage_type)
                        ->where("ward_no",$this->_newWardNo)
                        ->first();
        $usageRate = collect($this->_mUsageTypeRateMaster)
                ->where("effective_from",">=",$floorTax["effectiveFrom"])
                ->where("effective_upto","<=",$floorTax["effectiveUpto"])
                // ->where("effective_from","<=",$floorTax["effectiveUpto"])
                ->where("usage_type_master_id",$floor["usageTypeMasterId"])
                ->first();
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();
        
        $propertyTax = $capitalValue->max_rate * $buildupArea  * $occupancyRate->mult_factor * $taxPercent * $usageRate->rate * $matrixFactorRate;
        
        $HoldingTaxPercent = 0.02; 
        $LatrineTaxPercent = 0.0;
        $WaterTaxPercent = 0.0;
        $HealthCessTaxPercent = 0.0;            
        $EducationCessTaxPercent = 0.0;

        $HoldingTax = round(($propertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($propertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($propertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($propertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($propertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH?0:$HoldingTax/2;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);
        
        $taxMinFYear = $this->_acctOfLimitation;
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);
        if($floorFYear < $taxMinFYear){
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"]??"");
        $uptoQtr = getQtr($floor["dateUpto"]??"");
        if(!($floor["dateUpto"]??false)){
            $uptoQtr =4;
        }

        if($uptoFYear > $floorTax["effectiveUptoFYear"]){
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = getQtr($floorTax["effectiveUpto"]??"");
            if(!($floorTax["effectiveUpto"]??"")){
                $uptoQtr =4;
            }
        }
        $tax = [
            "fromFYear"=>$floorFYear,
            "fromQtr"=>$qtr,
            "uptoFYear"=>$uptoFYear,
            "uptoQtr"=> $uptoQtr,
            "ALV" =>0,
            "propertyTax"=>$propertyTax,
            "RentalRate"=>0,
            "RebatePercent"=>0,
            "capitalValue"=>$capitalValue->max_rate,
            "buildupArea"=>$buildupArea,
            "occupancyRate"=>$occupancyRate->mult_factor,
            "taxPercent"=>$taxPercent,
            "usageRate"=>$usageRate->rate,
            "matrixFactorRate"=>$matrixFactorRate,
            "HoldingTaxPercent" => $HoldingTaxPercent *100,
            "HoldingTax" => $HoldingTax,
            "HoldingTaxQuarterly" => round($HoldingTax/4,2),
            "LatrineTaxPercent" => $LatrineTaxPercent *100,
            "LatrineTax" => $LatrineTax,
            "LatrineTaxQuarterly" => round($LatrineTax/4,2),
            "WaterTaxPercent" => $WaterTaxPercent *100,
            "WaterTax" => $WaterTax,
            "WaterTaxQuarterly" => round($WaterTax/4,2),
            "HealthCessTaxPercent" => $HealthCessTaxPercent *100,
            "HealthCessTax" => $HealthCessTax,
            "HealthCessTaxQuarterly" => round($HealthCessTax/4,2),
            "EducationCessTaxPercent" => $EducationCessTaxPercent *100,
            "EducationCessTax" => $EducationCessTax,
            "EducationCessTaxQuarterly" => round($EducationCessTax/4,2),
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;
    }

    public function GenerateRuleSetFyearTax(array $RuleSetTax){
        $fromFyear = $RuleSetTax["fromFYear"];        
        $qtr = $RuleSetTax["fromQtr"];
        if(isset($RuleSetTax["effectiveFromFYear"]) && $fromFyear < $RuleSetTax["effectiveFromFYear"]){
            $fromFyear = $RuleSetTax["effectiveFromFYear"];
            $qtr = getQtr($RuleSetTax["effectiveFrom"]);
        }
        $uptoFYear = $RuleSetTax["uptoFYear"];
        $uptoQtr = 4;
        if(isset($RuleSetTax["effectiveUptoFYear"]) && $uptoFYear > $RuleSetTax["effectiveUptoFYear"]){
            $uptoFYear = $RuleSetTax["effectiveUptoFYear"];
        }
        $AllfyearTax =[];
        while($fromFyear<=$uptoFYear){ 
            $fyearTax =$RuleSetTax;           
            $fyearTax["fyear"]=$fromFyear;
            if($fromFyear==$uptoFYear){
                $uptoQtr = $RuleSetTax["uptoQtr"];
            }
            while($qtr<=$uptoQtr){                
                $fyearTax["quarterly"][] = [
                    "qtr"=>$qtr,
                    "fyear"=>$fromFyear,
                    "ALV" => ($RuleSetTax["ALV"]??0)/4,
                    "propertyTax" => ($RuleSetTax["propertyTax"]??0)/4,
                    "RentalRate" => $RuleSetTax["RentalRate"]??0,
                    "RebatePercent" => $RuleSetTax["RebatePercent"]??0,
                    "HoldingTaxPercent" => $RuleSetTax["HoldingTaxPercent"]??0,
                    "HoldingTax" => $RuleSetTax["HoldingTaxQuarterly"]??0,
                    "LatrineTaxPercent" => $RuleSetTax["LatrineTaxPercent"]??0,
                    "LatrineTax" => $RuleSetTax["LatrineTaxQuarterly"]??0,
                    "WaterTaxPercent" => $RuleSetTax["WaterTaxPercent"]??0,
                    "WaterTax" => $RuleSetTax["WaterTaxQuarterly"]??0,
                    "HealthCessTaxPercent" => $RuleSetTax["HealthCessTaxPercent"]??0,
                    "HealthCessTax" => $RuleSetTax["HealthCessTaxQuarterly"]??0,
                    "EducationCessTaxPercent" => $RuleSetTax["EducationCessTaxPercent"]??0,
                    "EducationCessTax" => $RuleSetTax["EducationCessTaxQuarterly"]??0,
                    "RWH" => ($RuleSetTax["RWHQuarterly"]??0),
                    "TotalTax" => $RuleSetTax["TotalTaxQuarterly"]??0,
                ];
                $qtr+=1;
            }
            $qtr = 1;
            // $this->_FYearWiseTax[]=$fyearTax;
            $AllfyearTax[]= $fyearTax;
            list($fromYear,$uptoYear) = explode("-",$fromFyear);
            $fromFyear = $uptoYear."-".($uptoYear+1);
        }
        return $AllfyearTax;

    }

    public function calculateTax(){
        $this->FloorTaxCalculator();
        $this->FYearTaxCalculator();
        $this->RuleSetTaxCalculator();
        $this->RuleSetVersionTaxCalculator();
    }
}