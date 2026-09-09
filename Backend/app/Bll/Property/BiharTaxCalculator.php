<?php

namespace App\Bll\Property;

use App\Models\DBSystem\UlbMaster;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\BuildingArvRateMaster;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\FloorMaster;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\RoadType;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\UsageTypeMaster;
use App\Models\Property\VacantArvRateMaster;
use App\Models\Property\WaterTaxType;
use App\Trait\Property\PropertyTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

class BiharTaxCalculator
{
    use PropertyTrait;
    /**
     * Create a new class instance.
     */
    public $_GRID;    
    public $_ACT_LIMIT;
    public $_fromDate;
    public $_acctOfLimitation;
    public $_FloorWiseTax;
    public $_FYearWiseTax;
    public $_PropertyType;
    public $_RoadTypeId;
    public $_ulbId;
    public $_ulbTypeId;
    public $_hasRWH = false;
    public $_isVacantLand = false;
    public $_ruleSets;
    public $_REQUEST;
    public $_ObjOccupancyTypeMaster;
    public $_ObjConstructionTypeMaster;
    public $_ObjApartmentDetail;
    public $_ObjFloorMaster;
    public $_ObjOwnershipTypeMaster;
    public $_ObjPropertyTypeMaster;
    public $_ObjRoadTypeMaster;
    public $_ObjRoadType;
    public $_ObjUsageTypeMaster;    
    public $_ObjUlbMaster;
    public $_ObjBuildingArvRateMaster;
    public $_ObjVacantArvRateMaster;
    public $_ObjWaterTaxType;

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
    public $_mBuildingArvRates;
    public $_mVacantArvRates;
    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_FloorWiseTax = collect();
        $this->_FYearWiseTax = collect();
        $this->_ruleSets = collect(Config::get("PropertyConstant.BIHAR_RULE_SETS"));
        $this->_ACT_LIMIT = Config::get("PropertyConstant.ACT_OF_LIMITATION");

        $this->_ObjUsageTypeMaster = new UsageTypeMaster();
        $this->_ObjOccupancyTypeMaster = new OccupancyTypeMaster();
        $this->_ObjConstructionTypeMaster= new ConstructionTypeMaster();
        $this->_ObjApartmentDetail = new ApartmentDetail();
        $this->_ObjFloorMaster = new FloorMaster();
        $this->_ObjOwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_ObjPropertyTypeMaster = new PropertyTypeMaster();
        $this->_ObjRoadTypeMaster = new RoadTypeMaster();
        $this->_ObjRoadType = new RoadType();

        $this->_ObjBuildingArvRateMaster = new BuildingArvRateMaster();
        $this->_ObjVacantArvRateMaster = new VacantArvRateMaster();
        $this->_ObjWaterTaxType= new WaterTaxType();

        $this->setAcctOfLimitation();
        $this->setPropertyType();
        $this->setUlb();
        $this->loadParam();
        $this->testVacantLand();
        $this->hasRwh();
        $this->setFromDate();
        $this->initFloorWiseTax();
    }

    public function setPropertyType(){
        $this->_PropertyType = $this->_REQUEST->propTypeMstrId;
    }

    public function setUlb(){
        $this->_ulbId = $this->_REQUEST->ulbId;
        $this->_ulbTypeId = UlbMaster::find($this->_ulbId)?->ulb_type_id;
    }

    public function loadParam(){
        $this->_mOccupancyTypeMaster = $this->_ObjOccupancyTypeMaster->getOccupancyTypeList();
        $this->_mConstructionTypeMaster = $this->_ObjConstructionTypeMaster->getConstructionTypeList();
        $this->_mFloorMaster = $this->_ObjFloorMaster->getFloorList();
        $this->_mOwnershipTypeMaster = $this->_ObjOwnershipTypeMaster->getOwnershipTypeList();
        $this->_mPropertyTypeMaster = $this->_ObjPropertyTypeMaster->getPropertyTypeList();
        $this->_mRoadTypeMaster = $this->_ObjRoadTypeMaster->getRoadTypeList();
        $this->_mRoadType = $this->_ObjRoadType->getRoadTypeList();
        $this->_mUsageTypeMaster  = $this->_ObjUsageTypeMaster->getUsageTypeList();
        $this->_mBuildingArvRates = $this->_ObjBuildingArvRateMaster->getRate();
        $this->_mVacantArvRates = $this->_ObjVacantArvRateMaster->getRate();
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
        $this->_acctOfLimitation = getFY(subtractYear(null,$this->_ACT_LIMIT));
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

    public function initFloorWiseTax(){
        
        if($this->_isVacantLand){
            $mobileAndHordingTowerArea = 0;
            if($this->_REQUEST["isMobileTower"])
                $mobileAndHordingTowerArea += (float) ($this->_REQUEST["towerArea"]??0);
          
            if($this->_REQUEST["isHoardingBoard"])
                $mobileAndHordingTowerArea += (float)($this->_REQUEST["hoardingArea"]??0);

            $floor = [
                "floorName"=>"VacantLand",
                "areaOfPlot"=>$this->_REQUEST["areaOfPlot"],
                "builtupArea"=>($this->_REQUEST["areaOfPlot"]) - ($mobileAndHordingTowerArea*1.43),
                "mobileAndHordingTowerArea"=>$mobileAndHordingTowerArea,
                "dateFrom"=>$this->_REQUEST["landOccupationDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"1",
                "constructionTypeMasterId"=>0,
                "occupancyTypeMasterId"=>1,
                "tax"=>collect(),
            ];
            $floor["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$floor["usageTypeMasterId"])->first())->usage_type??"";
            $floor["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$floor["constructionTypeMasterId"])->first())->construction_type??"";
            $floor["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$floor["occupancyTypeMasterId"])->first())->occupancy_name??"";
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null),false));
            $this->_FloorWiseTax[] = $floor;
        }
        else{
            //Land + Building
            if($this->_PropertyType==3){
                $landOccupationDate = isset($this->_REQUEST["landOccupationDate"]) ? $this->_REQUEST["landOccupationDate"] : (explode("-",$this->_acctOfLimitation)[0]."-04-01");
                $minDate = collect($this->_REQUEST["floorDtl"])->min("dateFrom");
                $isFirstAcquired = Carbon::parse($minDate)->gt(Carbon::parse($landOccupationDate));                
                if($isFirstAcquired){
                    $area = $this->_REQUEST["areaOfPlot"];
                    $landOccupationDate=Carbon::parse($minDate)->format("Y-m-d");
                    $floor = [
                        "floorName"=>"VacantLand",
                        "areaOfPlot"=>$this->_REQUEST["areaOfPlot"],
                        "builtupArea"=>$area,
                        "dateFrom"=>isset($this->_REQUEST["landOccupationDate"]) ? $this->_REQUEST["landOccupationDate"] : (explode("-",$this->_acctOfLimitation)[0]."-04-01"),
                        "dateUpto"=>$landOccupationDate,
                        "floorMasterId"=>"0",
                        "usageTypeMasterId"=>"1",
                        "constructionTypeMasterId"=>0,
                        "occupancyTypeMasterId"=>1,
                        "tax"=>collect(),
                    ];
                    $floor["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$floor["usageTypeMasterId"])->first())->usage_type??"";
                    $floor["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$floor["constructionTypeMasterId"])->first())->construction_type??"";
                    $floor["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$floor["occupancyTypeMasterId"])->first())->occupancy_name??"";
                    $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null),false));
                    $this->_FloorWiseTax[] = $floor;
                }

                $remainArea = ($this->_REQUEST["areaOfPlot"]) - ($this->_REQUEST["builtupArea"]*1.43);                
                if($remainArea>0){
                    $floor = [
                        "floorName"=>"VacantLand",
                        "areaOfPlot"=>$this->_REQUEST["areaOfPlot"],
                        "builtupArea"=>$remainArea,
                        "dateFrom"=>$landOccupationDate,
                        "floorMasterId"=>"0",
                        "usageTypeMasterId"=>"1",
                        "constructionTypeMasterId"=>0,
                        "occupancyTypeMasterId"=>1,
                        "tax"=>collect(),
                    ];
                    $floor["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$floor["usageTypeMasterId"])->first())->usage_type??"";
                    $floor["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$floor["constructionTypeMasterId"])->first())->construction_type??"";
                    $floor["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$floor["occupancyTypeMasterId"])->first())->occupancy_name??"";
                    $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null),false));
                    $this->_FloorWiseTax[] = $floor;
                }
            }

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
                "dateFrom"=>$this->_REQUEST["towerInstallationDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"2",
                "constructionTypeMasterId"=>2,
                "occupancyTypeMasterId"=>$this->_isVacantLand ? 2 : 2,
                "tax"=>collect(),
            ];    
            $floor["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$floor["usageTypeMasterId"])->first())->usage_type??"";
            $floor["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$floor["constructionTypeMasterId"])->first())->construction_type??"";
            $floor["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$floor["occupancyTypeMasterId"])->first())->occupancy_name??"";        
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null)));
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
                "dateFrom"=>$this->_REQUEST["hoardingInstallationDate"],
                "floorMasterId"=>"0",
                "usageTypeMasterId"=>"2",
                "constructionTypeMasterId"=>$this->_isVacantLand ? 2 : 1,
                "occupancyTypeMasterId"=>2,
                "tax"=>collect(),
            ]; 
            $floor["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$floor["usageTypeMasterId"])->first())->usage_type??"";
            $floor["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$floor["constructionTypeMasterId"])->first())->construction_type??"";
            $floor["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$floor["occupancyTypeMasterId"])->first())->occupancy_name??"";           
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null)));
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
            $floor["usageType"] = (collect($this->_mUsageTypeMaster)->where("id",$floor["usageTypeMasterId"])->first())->usage_type??"";
            $floor["constructionType"] = (collect($this->_mConstructionTypeMaster)->where("id",$floor["constructionTypeMasterId"])->first())->construction_type??"";
            $floor["occupancyType"] = (collect($this->_mOccupancyTypeMaster)->where("id",$floor["occupancyTypeMasterId"])->first())->occupancy_name??"";           
            $floor["ruleSets"]=collect($this->setRuleSet($floor["dateFrom"],($floor["dateUpto"]??null)));
            $this->_FloorWiseTax[]=$floor;
        }
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
                $dueDate = FyearQutUptoDate($fromFyear,$qtr);              
                $fyearTax["quarterly"][] = [
                    "qtr"=>$qtr,
                    "dueDate" => $dueDate,
                    "fyear"=>$fromFyear,
                    "ARV" => ($RuleSetTax["ARV"]??0)/4,
                    "propertyTax" => ($RuleSetTax["propertyTax"]??0)/4,
                    "arvRate" => $RuleSetTax["arvRate"]??0,
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
                    "RWHTaxPercent" => $RuleSetTax["RWHTaxPercent"]??0,
                    "RWH" => ($RuleSetTax["RWHQuarterly"]??0),
                    "TotalTax" => $RuleSetTax["TotalTaxQuarterly"]??0,
                ];
                $qtr+=1;
            }
            $qtr = 1;
            // $this->_FYearWiseTax[]=$fyearTax;
            $fyearTax["quarterly"] = array_map(function($item){
                $item = $this->getOnePercentPenalty($item);
                return $item;
            },$fyearTax["quarterly"]);
            $fyearTax["monthlyPenalty"] = round(collect($fyearTax["quarterly"])->sum("monthlyPenalty"),2);
            $AllfyearTax[]= $fyearTax;
            list($fromYear,$uptoYear) = explode("-",$fromFyear);
            $fromFyear = $uptoYear."-".($uptoYear+1);
        }
        return $AllfyearTax;

    }

    public function BuildingRules1($floor){
        $floorTax = [
            "ruleSet"=>"BuildingRules1",
            "effectiveFrom"=>explode("-",$this->_acctOfLimitation)[0]."-04-01",
            "effectiveFromFYear"=>$this->_acctOfLimitation,
            "effectiveUpto"=>explode("-",getFY(null))[1]."-03-31" ,
            "effectiveUptoFYear"=>getFY(null),
            "description"=>"<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Taxable Area/ CarpetArea = Buildup Area(Sq. Ft) X [ 70% (If Resident) 80% (If Commercial) ]
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              Annual Rental Value (ARV)  : Taxable Area(Sq. Ft) X Rental Rate X Occupancy factor
                                \n*      --------------------------------------------------------------------------------------------
                                \n*              Annual Property Tax = ARV x 9%
                                \n* 
                                \n*      --------------------Case Rebate-------------------------------------------
                                \n*              RWH Rebate : - If Property Has Rain Water Harvesting Then 5% 
                                \n* 
                                \n*      ------------------------ Tax -----------------------------------------
                                \n*          (a) Holding tax 100%
                                \n*          (b) Latrine tax 0%
                                \n*          (c) Water tax 0%
                                \n*          (d) Health cess 0%
                                \n*          (e) Education cess 0%
                            \n</pre>",
        ];

        $roadTypeId = (collect($this->_mRoadType)
                    ->filter(function ($item) use ($floorTax) {
                        // ✅ effective date overlap
                        $dateValid =
                            $item->effective_from <= $floorTax['effectiveUpto'] &&
                            (is_null($item->effective_upto) || $item->effective_upto >= $floorTax['effectiveFrom']);

                        // ✅ road width range

                        $widthValid = floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);

                        return $dateValid && $widthValid;
                    })->first())->road_type_id??0;
        
        $roadTypeId = isset($this->_REQUEST["roadTypeMstrId"]) ? $this->_REQUEST["roadTypeMstrId"] : $roadTypeId;
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();

        $buildupArea =  $floor["builtupArea"];
        $isResidentialUse = $floor["usageTypeMasterId"]==1 ? true : false;
        $taxableArea = $buildupArea * 0.8;
        if($isResidentialUse){
            $taxableArea = $buildupArea * 0.7;
        }
        // 1-> Resident, 2-> Comm, 3-> other
        $usageTypeRateId = $isResidentialUse ? 1 : 2;
        if($floor["usageTypeMasterId"]==46){
            $usageTypeRateId = 3;
        }
        $arvRate = collect($this->_mBuildingArvRates)
            ->where("ulb_type_id",$this->_ulbTypeId)
            ->where("construction_type_master_id",$floor["constructionTypeMasterId"])
            ->where("road_type_id",$roadTypeId)
            ->where("usage_type_id",$usageTypeRateId)
            ->filter(function ($item) use ($floorTax) {
                $itemFrom = $item["effective_from"];
                $itemUpto = $item["effective_upto"];
                return (
                    // condition 1: starts before my end
                    $itemFrom <= $floorTax["effectiveUpto"]
                    &&
                    // condition 2: ends after my start
                    ($itemUpto === null || $itemUpto >= $floorTax["effectiveFrom"])
                );
            })
            ->sortBy("effective_from")
            ->first();
        $ARV = $taxableArea * $arvRate->rate * $occupancyRate->mult_factor;
        $propertyTax = round(($ARV * 9)/100);

        $HoldingTaxPercent = 0.95; 
        $LatrineTaxPercent = 0;
        $WaterTaxPercent = 0;
        $HealthCessTaxPercent = 0;            
        $EducationCessTaxPercent = 0;
        $rwhTaxPercent = 0.05;

        $HoldingTax = round(($propertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($propertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($propertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($propertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($propertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH ? 0 : round(($propertyTax * $rwhTaxPercent),2) ;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);

        $taxMinFrom = subtractYear(null,$this->_ACT_LIMIT);
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
            "ARV" =>$ARV,
            "propertyTax"=>$propertyTax,
            "arvRate"=>$arvRate->rate,
            "taxableArea"=>$taxableArea,
            "usageType"=> $this->floorResCommOtherUsage($usageTypeRateId),//;$usageTypeRateId==1 ? "Resident" : ($usageTypeRateId==2?"Commercial":"Other"),
            "occupancyRate"=>$occupancyRate->mult_factor,
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
            "RWHTaxPercent" => $RWH ? $rwhTaxPercent *100 : 0,
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        $floorTax["monthlyPenalty"] = round(collect($floorTax["fyearTax"])->sum("monthlyPenalty"),2);
        return $floorTax;
    }

    public function VacantRules1($floor){
        $floorTax = [
            "ruleSet"=>"VacantRules1",
            "effectiveFrom"=>explode("-",$this->_acctOfLimitation)[0]."-04-01",
            "effectiveFromFYear"=>$this->_acctOfLimitation,
            "effectiveUpto"=>explode("-",getFY(null))[1]."-03-31" ,
            "effectiveUptoFYear"=>getFY(null),
            "description"=>"<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Taxable Area/ CarpetArea = Plot Area(Sq. Ft) 
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              Annual Rental Value (ARV)  : Taxable Area(Sq. Ft) X Rental Rate 
                                \n*      --------------------------------------------------------------------------------------------
                                \n*              Annual Property Tax = ARV 
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
                    ->filter(function ($item) use ($floorTax) {
                        // ✅ effective date overlap
                        $dateValid =
                            $item->effective_from <= $floorTax['effectiveUpto'] &&
                            (is_null($item->effective_upto) || $item->effective_upto >= $floorTax['effectiveFrom']);

                        // ✅ road width range

                        $widthValid = floatval($item->from_width) <= floatval($this->_REQUEST["roadWidth"]) && 
                               floatval($this->_REQUEST["roadWidth"]) <= floatval($item->upto_width);

                        return $dateValid && $widthValid;
                    })->first())->road_type_id??0;

        $roadTypeId = isset($this->_REQUEST["roadTypeMstrId"]) ? $this->_REQUEST["roadTypeMstrId"] : $roadTypeId;
        
        $occupancyRate = collect($this->_mOccupancyTypeMaster)
                ->where("id",$floor["occupancyTypeMasterId"])
                ->first();

        $buildupArea =  $floor["builtupArea"];
        $taxableArea = $buildupArea ;

        $arvRate = collect($this->_mVacantArvRates)
            ->where("ulb_type_id",$this->_ulbTypeId)
            ->where("road_type_id",$roadTypeId)
            ->filter(function ($item) use ($floorTax) {
                $itemFrom = $item["effective_from"];
                $itemUpto = $item["effective_upto"];
                return (
                    // condition 1: starts before my end
                    $itemFrom <= $floorTax["effectiveUpto"]
                    &&
                    // condition 2: ends after my start
                    ($itemUpto === null || $itemUpto >= $floorTax["effectiveFrom"])
                );
            })
            ->sortBy("effective_from")
            ->first();
        $ARV = $taxableArea * $arvRate->rate;
        $propertyTax = round(($ARV));

        $HoldingTaxPercent = 1; 
        $LatrineTaxPercent = 0;
        $WaterTaxPercent = 0;
        $HealthCessTaxPercent = 0;            
        $EducationCessTaxPercent = 0;
        $rwhTaxPercent = 0;

        $HoldingTax = round(($propertyTax * $HoldingTaxPercent),2);
        $LatrineTax = round(($propertyTax * $LatrineTaxPercent),2);
        $WaterTax = round(($propertyTax * $WaterTaxPercent),2);
        $HealthCessTax = round(($propertyTax * $HealthCessTaxPercent),2);
        $EducationCessTax = round(($propertyTax * $EducationCessTaxPercent),2);
        $RWH = $this->_hasRWH ? 0 : round(($propertyTax * $rwhTaxPercent),2) ;
        $TotalTax = round(($HoldingTax +  $LatrineTax + $WaterTax + $HealthCessTax + $EducationCessTax + $RWH),2);

        $taxMinFrom = subtractYear(null,$this->_ACT_LIMIT);
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
            "ARV" =>$ARV,
            "propertyTax"=>$propertyTax,
            "arvRate"=>$arvRate->rate,
            "taxableArea"=>$taxableArea,
            "usageType"=>"Resident",
            "occupancyRate"=>$occupancyRate->mult_factor,
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
            "RWHTaxPercent" => $RWH ? $rwhTaxPercent *100 : 0,
            "RWH"=>$RWH,
            "RWHQuarterly"=>roundFigure($RWH/4),
            "TotalTax" => $TotalTax,
            "TotalTaxQuarterly" => round($TotalTax/4,2),
        ];
        
        $floorTax=array_merge($floorTax,$tax);
        $floorTax["fyearTax"] = $this->GenerateRuleSetFyearTax($floorTax);
        return $floorTax;

    }


    public function FloorTaxCalculator(){
        foreach($this->_FloorWiseTax as $key=>$val){
            foreach($val["ruleSets"] as $rulName=>$ruleSets){
                # this is the calling point of ruleset
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
                            "dueDate" => $qTaxes->max("dueDate"),
							"fyear" => $year,
							"propertyTax" => roundFigure($qTaxes->sum("propertyTax")),
							"HoldingTax" => roundFigure($qTaxes->sum("HoldingTax")),
							"LatrineTax" => roundFigure($qTaxes->sum("LatrineTax")),
							"WaterTax" => roundFigure($qTaxes->sum("WaterTax")),
							"HealthCessTax" => roundFigure($qTaxes->sum("HealthCessTax")),
							"EducationCessTax" => roundFigure($qTaxes->sum("EducationCessTax")),
							"RWH" => roundFigure($qTaxes->sum("RWH")),
							"TotalTax" => roundFigure($qTaxes->sum("TotalTax")),
                            "monthDiff" => roundFigure($qTaxes->sum("monthDiff")),
                            "monthlyPenalty" => roundFigure($qTaxes->sum("monthlyPenalty")),
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
                    "monthlyPenalty" => roundFigure($currentTax->sum("monthlyPenalty")),    
                ];
                $this->_GRID["FyearWiseTax"][] = $RuleSetTax;
            }            

        } 
    }

    public function getOnePercentPenalty($demandList){
        $penalty = 0 ;
        $monthDiff = 0;
        $currentDate = Carbon::now();
        if(getFY($demandList["dueDate"])<getFY())
        {
            $monthDiff = floor(Carbon::parse($demandList["dueDate"])->diffInMonths($currentDate));
            $penalty = roundFigure(($demandList["TotalTax"] * $monthDiff * 1.5)/100);
        }
        if(getFY($demandList["dueDate"])==getFY()  && $currentDate->copy()->format("Y-m-d")>=FyearQutFromDate(getFY(),3) ){
            $monthDiff = floor(Carbon::parse(FyearQutUptoDate(getFY(),2))->diffInMonths($currentDate));
            $penalty = roundFigure(($demandList["TotalTax"] * $monthDiff * 1.5)/100);
        }

        if(in_array(getFY(),["2025-2026"])){
            $penalty = 0 ;
            $monthDiff = 0;
        }
        $demandList["monthDiff"] = $monthDiff;
        $demandList["monthlyPenalty"] = $penalty;
        return $demandList;
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
                            // $dueDate = $FYear."-06-30";
                            // if($cFromQtr==2){
                            //     $dueDate = $FYear."-09-30";
                            // }
                            // if($cFromQtr==3){
                            //     $dueDate = $FYear."-12-31";
                            // }
                            // if($cFromQtr==4){
                            //     $dueDate = $UYear."-03-31";
                            // }
                            if($qTaxes->count()>0){
                                $qt = [
                                    "floorCount"=>$qTaxes->count(),
                                    "qtr" => $cFromQtr,
                                    "dueDate" => $qTaxes->max("dueDate"),
                                    "fyear" => $year,
                                    "propertyTax" => roundFigure($qTaxes->sum("propertyTax")),
                                    "HoldingTax" => roundFigure($qTaxes->sum("HoldingTax")),
                                    "LatrineTax" => roundFigure($qTaxes->sum("LatrineTax")),
                                    "WaterTax" => roundFigure($qTaxes->sum("WaterTax")),
                                    "HealthCessTax" => roundFigure($qTaxes->sum("HealthCessTax")),
                                    "EducationCessTax" => roundFigure($qTaxes->sum("EducationCessTax")),
                                    "RWH" => roundFigure($qTaxes->sum("RWH")),
                                    "TotalTax" => roundFigure($qTaxes->sum("TotalTax")),
                                    "monthlyPenalty"=> roundFigure($qTaxes->sum("monthlyPenalty")),
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
                            "monthlyPenalty"=> roundFigure($currentTax->sum("monthlyPenalty")),   
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
                    "ARV"=>roundFigure($tax->sum("ARV")),
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
                    "monthlyPenalty"=> roundFigure($tax->sum("monthlyPenalty")),
                    "Fyearlytax"=>$Fyearlytax,
                    "DTL"=>collect($tax)->values()
                ];
                $this->_GRID["RuleSetVersionTax"][] = $ruleSetTax;
            }
        }
    }

    public function calculateWaterSingleTimePayment(){
        $this->_GRID["singleTimeWaterTax"] = 0;
        $singleTimeTax = 0;
        if($this->_REQUEST->waterTaxTypeId){
            $singleTimeTax = $this->_ObjWaterTaxType->find($this->_REQUEST->waterTaxTypeId)?->amount;            
        }
        if($singleTimeTax){
            $this->_GRID["singleTimeWaterTax"] =$singleTimeTax;
        }
    }

    public function getLateAssesPenalty()
    {
        $applyDate = Carbon::parse($this->_REQUEST->applyDate);
        $before90Days = $applyDate->copy()->subDays(90);

        $this->_GRID["lateAssessmentPenalty"] = 0;
        $lateAssessmentPenalty = 0;

        /* ---------------- Vacant Land Case ---------------- */
        if ($this->_isVacantLand) {

            if (!empty($this->_REQUEST->landOccupationDate)) {
                $landOccDate = Carbon::parse($this->_REQUEST->landOccupationDate);

                if ($landOccDate->lt($before90Days)) {
                    $lateAssessmentPenalty =
                        ($this->_REQUEST->isMobileTower || $this->_REQUEST->isHoardingBoard)
                            ? 5000
                            : 5000;
                }
            }

        }
        /* ---------------- Constructed Property Case ---------------- */
        else {

            $newFloors = collect($this->_REQUEST->floorDtl)
                ->filter(function ($floor) use ($before90Days) {
                    if (empty($floor['dateFrom'])) {
                        return false;
                    }

                    $dateFrom = strlen($floor['dateFrom']) === 7
                        ? $floor['dateFrom'] . '-01'
                        : $floor['dateFrom'];

                    return Carbon::parse($dateFrom)->lt($before90Days);
                });
            if(!in_array($this->_REQUEST->assessmentType,["New Assessment"])){
                $newFloors = $newFloors->whereNull("propFloorDetailId");
            }
            if ($newFloors->isNotEmpty()) {

                $commercialFloor = $newFloors
                    ->whereNotIn("usageTypeMasterId", [1]);

                $lateAssessmentPenalty = $commercialFloor->isNotEmpty()
                    ? 5000
                    : 2000;
                    
            }
        }

        $this->_GRID["lateAssessmentPenalty"] = $lateAssessmentPenalty;
    }


    public function calculateTax(){
        $this->FloorTaxCalculator();
        $this->FYearTaxCalculator();
        $this->RuleSetTaxCalculator();
        $this->RuleSetVersionTaxCalculator();
        $this->calculateWaterSingleTimePayment();
        $this->getLateAssesPenalty();
    }
}
