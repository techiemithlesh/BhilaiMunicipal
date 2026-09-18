<?php

namespace App\Bll\Property;

use App\Models\DBSystem\UlbMaster;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\ArvRangRate;
use App\Models\Property\BuildingArvRateMaster;
use App\Models\Property\CompositeTaxRate;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\FloorMaster;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\RoadType;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\UsageTypeMaster;
use App\Models\Property\UsageTypeRateMaster;
use App\Models\Property\VacantArvRateMaster;
use App\Models\Property\ZoneMaster;
use App\Trait\Property\PropertyTrait;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;

class BhiliaTaxCalculator
{
    use PropertyTrait;

    public array $_GRID = [];
    public Collection $_FloorWiseTax;
    public Collection $_FYearWiseTax;
    public Collection $_ruleSets;

    public string $_TaxFromYear;
    public string $_ThousandPenaltyFromYear;
    public int $_ACT_LIMIT;
    public string $_fromDate;
    public string $_acctOfLimitation;
    public mixed $_PropertyType;
    public mixed $_RoadTypeId;
    public mixed $_ulbId;
    public mixed $_ulbTypeId;
    public bool $_hasRWH = false;
    public bool $_isVacantLand = false;
    public $_REQUEST;

    // Direct Cached Collections
    public Collection $_mOccupancyTypeMaster;
    public Collection $_mConstructionTypeMaster;
    public Collection $_mFloorMaster;
    public Collection $_mOwnershipTypeMaster;
    public Collection $_mPropertyTypeMaster;
    public Collection $_mRoadTypeMaster;
    public Collection $_mRoadType;
    public Collection $_mUsageTypeMaster;
    public Collection $_mBuildingArvRates;
    public Collection $_mVacantArvRates;
    public Collection $_mArvRangRates;
    public Collection $_mUsageTypeRateMaster;
    public Collection $_mCompositeTaxRates;
    public Collection $_mZoneMaster;

    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_FloorWiseTax = collect();
        $this->_FYearWiseTax = collect();

        $this->_ruleSets = collect(Config::get("PropertyConstant.BHILIA_RULE_SETS"));
        $this->_TaxFromYear = Config::get("PropertyConstant.BHILIA_TAX_FROM_DATE", "1999-04-01");
        $this->_acctOfLimitation = getFY($this->_TaxFromYear);
        $this->_ACT_LIMIT = Carbon::now()->year - Carbon::parse($this->_TaxFromYear)->year;
        $this->_ThousandPenaltyFromYear = Config::get("PropertyConstant.THOUSAND_PENALTY_EFFECTIVE_YEAR", "2016-2017");

        $this->setPropertyType();
        $this->setUlb();
        $this->setRoadType();
        $this->loadParam();
        $this->testVacantLand();
        $this->hasRwh();
        $this->setFromDate();
        $this->initFloorWiseTax();
    }

    public function setPropertyType(): void
    {
        $this->_PropertyType = $this->_REQUEST->propTypeMstrId;
    }

    public function setUlb(): void
    {
        $this->_ulbId = $this->_REQUEST->ulbId;
        $this->_ulbTypeId = UlbMaster::find($this->_ulbId)?->ulb_type_id;
    }

    public function setRoadType(): void
    {
        $this->_RoadTypeId = $this->_REQUEST->roadTypeMstrId;
    }

    public function loadParam(): void
    {
        $this->_mOccupancyTypeMaster = (new OccupancyTypeMaster())->getOccupancyTypeList();
        $this->_mConstructionTypeMaster = (new ConstructionTypeMaster())->getConstructionTypeList();
        $this->_mFloorMaster = (new FloorMaster())->getFloorList();
        $this->_mOwnershipTypeMaster = (new OwnershipTypeMaster())->getOwnershipTypeList();
        $this->_mPropertyTypeMaster = (new PropertyTypeMaster())->getPropertyTypeList();
        $this->_mRoadTypeMaster = (new RoadTypeMaster())->getRoadTypeList();
        $this->_mRoadType = (new RoadType())->getRoadTypeList();
        $this->_mUsageTypeMaster  = (new UsageTypeMaster())->getUsageTypeList();
        $this->_mBuildingArvRates = (new BuildingArvRateMaster())->getRate();
        $this->_mVacantArvRates = (new VacantArvRateMaster())->getRate();
        $this->_mArvRangRates = (new ArvRangRate())->getArvRangeTypeList();
        $this->_mUsageTypeRateMaster = (new UsageTypeRateMaster())->getRate();
        $this->_mCompositeTaxRates = (new CompositeTaxRate())->getRate();
        $this->_mZoneMaster = (new ZoneMaster())->getZoneList()->where("ulb_id", $this->_ulbId);
    }

    public function testVacantLand(): void
    {
        $vacantLand = $this->_mPropertyTypeMaster->firstWhere("property_type", "VACANT LAND");
        if ($this->_PropertyType == ($vacantLand->id ?? "")) {
            $this->_isVacantLand = true;
        }
    }

    public function hasRwh(): void
    {
        if (($this->_REQUEST["isWaterHarvesting"] ?? false) || $this->_isVacantLand) {
            $this->_hasRWH = true;
        }
    }

    public function setFromDate(): void
    {
        $this->_fromDate = $this->_isVacantLand 
            ? $this->_REQUEST["landOccupationDate"] 
            : collect($this->_REQUEST["floorDtl"])->min("dateFrom");

        $this->_fromDate = Carbon::parse($this->_fromDate)->format("Y-m-01");
    }

    public function setRuleSet(string $dateFrom, ?string $dateUpto = null, bool $isBuilding = true): Collection
    {
        // Handle date formatting with safe defaults
        $dateFrom = Carbon::parse($dateFrom)->format("Y-m-d");
        $dateUpto = $dateUpto ? Carbon::parse($dateUpto)->format("Y-m-d") : '2027-03-31';

        $dateFromFyear = getFY($dateFrom);

        if (isset($this->_acctOfLimitation) && $dateFromFyear < $this->_acctOfLimitation) {
            $dateFromFyear = $this->_acctOfLimitation;
        }

        $dateUptoFyear = getFY($dateUpto);
        $rules = [];

        // Ensure _ruleSets is a Collection
        $ruleSets = $this->_ruleSets;

        while ($dateFromFyear <= $dateUptoFyear) {
            // Filter rules matching type AND covering the current financial year ($dateFromFyear)
            $testRule = $ruleSets->filter(function ($item) use ($dateFromFyear, $isBuilding) {
                if ($item["is_building"] !== $isBuilding) {
                    return false;
                }

                // A rule covers $dateFromFyear if effective_from_fyear <= FY AND effective_upto_fyear >= FY
                return ($item["effective_from_fyear"] <= $dateFromFyear) 
                    && ($item["effective_upto_fyear"] >= $dateFromFyear);
            });

            foreach ($testRule as $key => $item) {
                $rules[$key] = $item;
            }

            // Increment Financial Year (e.g., "2012-2013" -> "2013-2014")
            list($fromYear, $toYear) = explode("-", $dateFromFyear);
            $nextFrom = (int)$fromYear + 1;
            $nextTo = (int)$toYear + 1;
            $dateFromFyear = $nextFrom . "-" . $nextTo;
        }

        return collect($rules)->unique();
    }
    
    public function initFloorWiseTax(): void
    {
        $code=0;
        if ($this->_isVacantLand) {            
            ++$code;
            $mobileAndHordingTowerArea = 0;
            if ($this->_REQUEST["isMobileTower"] ?? false) {
                $mobileAndHordingTowerArea += (float) ($this->_REQUEST["towerArea"] ?? 0);
            }
            if ($this->_REQUEST["isHoardingBoard"] ?? false) {
                $mobileAndHordingTowerArea += (float) ($this->_REQUEST["hoardingArea"] ?? 0);
            }

            $plotArea = $this->_REQUEST["areaOfPlot"];
            $floor = [
                "code"=>"COD".str_pad($code,2,"0",STR_PAD_LEFT),
                "floorName" => "VacantLand",
                "areaOfPlot" => $plotArea,
                "builtupArea" => $plotArea - ($mobileAndHordingTowerArea * 1.43),
                "mobileAndHordingTowerArea" => $mobileAndHordingTowerArea,
                "dateFrom" => $this->_REQUEST["landOccupationDate"],
                "floorMasterId" => "0",
                "usageTypeMasterId" => "1",
                "constructionTypeMasterId" => 0,
                "occupancyTypeMasterId" => 1,
                "tax" => collect(),
            ];

            $floor["usageType"] = $this->_mUsageTypeMaster->firstWhere("id", $floor["usageTypeMasterId"])->usage_type ?? "";
            $floor["constructionType"] = $this->_mConstructionTypeMaster->firstWhere("id", $floor["constructionTypeMasterId"])->construction_type ?? "";
            $floor["occupancyType"] = $this->_mOccupancyTypeMaster->firstWhere("id", $floor["occupancyTypeMasterId"])->occupancy_name ?? "";
            $floor["ruleSets"] = $this->setRuleSet($floor["dateFrom"], $floor["dateUpto"] ?? null, false);
            
            $this->_FloorWiseTax->push($floor);
        } else {
            foreach ($this->_REQUEST["floorDtl"] as $val) {                
                ++$code;
                $val["tax"] = collect();
                $val["code"]="COD".str_pad($code,2,"0",STR_PAD_LEFT);
                $val["ruleSets"] = $this->setRuleSet($val["dateFrom"], $val["dateUpto"] ?? null);
                $val["zoneName"] = $this->_mZoneMaster->firstWhere("id", $val["zoneMstrId"])->zone_name ?? "";
                $val["floorName"] = $this->_mFloorMaster->firstWhere("id", $val["floorMasterId"])->floor_name ?? "";
                $val["usageType"] = $this->_mUsageTypeMaster->firstWhere("id", $val["usageTypeMasterId"])->usage_type ?? "";
                $val["constructionType"] = $this->_mConstructionTypeMaster->firstWhere("id", $val["constructionTypeMasterId"])->construction_type ?? "";
                $val["occupancyType"] = $this->_mOccupancyTypeMaster->firstWhere("id", $val["occupancyTypeMasterId"])->occupancy_name ?? "";
                
                $this->_FloorWiseTax->push($val);
            }
        }
    }

    public function FloorTaxCalculator(): void
    {
        foreach ($this->_FloorWiseTax as $key => $val) {
            foreach ($val["ruleSets"] as $rulName => $ruleSets) {
                $tax = $this->$rulName($val);
                $this->_FloorWiseTax[$key]["tax"]->push($tax);

                if (!isset($this->_FYearWiseTax[$rulName])) {
                    $this->_FYearWiseTax[$rulName] = collect();
                }
                $floorDtl = [
                    "floorDtl" => array_merge($tax,$val)
                ];

                $this->_FYearWiseTax[$rulName]->push(collect($tax)->merge($floorDtl)->toArray());
            }
        }
        $this->_GRID["FloorWiseTax"] = $this->_FloorWiseTax;
    }

    public function addPenalties($allYearlyTax)
    {
        $allTaxes = collect($allYearlyTax)->map(function($item){
            $penal = 0;
            $arrayPenalty=0;
            if($item["year"]<getFY()){
                $penal = $item["TotalTax"] * 0.18; // 18%;                
            }
            if($item["year"]<getFY() && $item["year"]>=$this->_ThousandPenaltyFromYear){
                $arrayPenalty = 1000; // 1000;                
            }
            $item["penal"] = $penal;
            $item["arrayPenalty"] = $arrayPenalty;
            $item["netTotalTax"] = round(($item["TotalTax"] + $penal + $arrayPenalty),2);
            return $item;
        });
        $this->_GRID["FyearWiseTax"] = $allTaxes;
    }

    public function FYearTaxCalculator(): void
    {
        $allTaxes = collect(); 
        foreach ($this->_ruleSets as $key => $val) {
            if (!isset($this->_FYearWiseTax[$key]) || empty($this->_FYearWiseTax[$key])) {
                continue; // Skip execution for this ruleSet key
            }
            $fYearStrings = collect($this->_FYearWiseTax[$key])
                ->pluck('taxIncludeYear')
                ->flatten(1)
                ->pluck('fyear')
                ->unique()
                ->sort()
                ->values();

            $yearlyTaxDtl = collect();

            foreach ($fYearStrings as $year) {
                list($startDateOfYear,$uptoDateOfYear) = FyearFromUptoDate($year);
                // Filter items in $this->_FYearWiseTax[$key] that contain the current $year
                $allArv = collect($this->_FYearWiseTax[$key])->filter(function ($item) use ($year) {
                    return collect($item['taxIncludeYear'] ?? [])->pluck('fyear')->contains($year);
                });

                // Sum ARV for the current $year across matching items
                $sumARV = $allArv->sum(function ($item) use ($year) {
                    return collect($item['taxIncludeYear'] ?? [])->firstWhere('fyear', $year)['ARV'] ?? 0;
                });

                // Sum TaxableArea across matching items
                $sumTaxableArea = $allArv->pluck('taxableArea')->map(fn($area) => (float)$area)->sum();

                // Extract factors and evaluate conditions
                $usageTypeFactorId = $allArv->pluck('usageTypeFactorId')->unique()->values();
                $isResident = $usageTypeFactorId->isNotEmpty() && $usageTypeFactorId->every(fn($id) => (int)$id === 1);

                // Fixed variable bug: changed $usageTypeFactorId to $constructionTypeId
                $constructionTypeId = $allArv->pluck('constructionType')->unique()->values();
                $isKacha = $constructionTypeId->isNotEmpty() && $constructionTypeId->every(fn($id) => (int)$id === 3);

                // Fixed boolean check: properly evaluate truthy boolean values
                $educationCessFromHoldingTax = $allArv->pluck('isEducationCessFromHoldingTax')->unique()->values();
                $isEducationCessFromHoldingTax = $educationCessFromHoldingTax->isNotEmpty() && $educationCessFromHoldingTax->every(fn($val) => (bool)$val === true);
                
                // Match rate percentage based on ARV range and Financial Year string
                $ratePercentDtl = $this->_mArvRangRates
                    ->where("ulb_id", $this->_ulbId)
                    ->first(fn($item) => 
                        $item["from_arv"] <= $sumARV &&
                        ($item["upto_arv"] == null || $item["upto_arv"] >= $sumARV) &&
                        $item["from_date"] <= $startDateOfYear &&
                        ($item["upto_date"] == null || $item["upto_date"] >= $startDateOfYear)
                    );

                $ratePercent = $ratePercentDtl->rate_percent ?? 0;

                if (($sumTaxableArea <= 500 && $isResident && $isKacha) || ($this->_REQUEST->isDp ?? false)) {
                    $ratePercent = 0;
                }

                $usageTypeMasterId = $isResident ? 1 : 2;

                // Match Usage Factor by effective financial year
                $usageFactorDtl = $this->_mUsageTypeRateMaster
                                ->where("usage_type_master_id", $usageTypeMasterId)
                                ->first(fn($item) => $item->effective_from <= $startDateOfYear && ($item->effective_upto === null || $item->effective_upto >= $startDateOfYear));

                $usageFactor = $usageFactorDtl->rate ?? 1.0;

                // Calculate holding & composite taxes
                $HoldingTax = round(($sumARV * ($ratePercent / 100) * $usageFactor), 2);
                
                // Fetch composite tax if present in rules or set default
                $compositeTaxDtl = $this->_mCompositeTaxRates
                                ->where("ulb_id",$this->_ulbId)
                                ->first(fn($item) => $item->from_date <= $startDateOfYear && ($item->upto_date === null || $item->upto_date >= $startDateOfYear));
                $compositeTax = round($compositeTaxDtl->tax ?? 0, 2);

                // Calculate Education Cess
                $EducationCessTax = $isEducationCessFromHoldingTax 
                    ? round(($HoldingTax * 0.02), 2) 
                    : round(($sumARV * 0.02), 2);

                $TotalTax = round($HoldingTax + $compositeTax + $EducationCessTax, 2);

                $yearlyTax=[
                    "ruleSet"                   =>$key,
                    "year"                      => $year,
                    "qrt"                       => getQtr($startDateOfYear),
                    "ARV"                       => $sumARV, 
                    "ratePercent"               => $ratePercent,
                    "usageFactor"               => $usageFactor,
                    "HoldingTax"                => $HoldingTax,
                    "HoldingTaxQuarterly"       => round($HoldingTax / 4, 2),
                    "CompositeTax"              => $compositeTax,
                    "CompositeTaxQuarterly"     => round($compositeTax / 4, 2),
                    "LatrineTax"                => 0,
                    "LatrineTaxQuarterly"       => 0,
                    "WaterTax"                  => 0,
                    "WaterTaxQuarterly"         => 0,
                    "HealthCessTax"             => 0,
                    "HealthCessTaxQuarterly"    => 0,
                    "EducationCessTax"          => $EducationCessTax,
                    "EducationCessTaxQuarterly" => round($EducationCessTax / 4, 2),
                    "RWH"                       => 0,
                    "RWHQuarterly"              => 0,
                    "TotalTax"                  => $TotalTax,
                    "TotalTaxQuarterly"         => round($TotalTax / 4, 2),
                ];

                $yearlyTaxDtl->push($yearlyTax);
                $allTaxes->push($yearlyTax);
            }
            // Identify first year where values changed (e.g. rate change, ARV shift, factor change)
            $taxDiff = [];
            
            if ($yearlyTaxDtl->isNotEmpty()) {
                $firstYear = $yearlyTaxDtl->first();
                $taxDiff[] = $firstYear;

                $previous = $firstYear;
                foreach ($yearlyTaxDtl->slice(1) as $current) {
                    // Check if key financial metrics shifted compared to previous calculated year
                    if (
                        $current['ARV'] !== $previous['ARV'] ||
                        $current['ratePercent'] !== $previous['ratePercent'] ||
                        $current['usageFactor'] !== $previous['usageFactor'] ||
                        $current['TotalTax'] !== $previous['TotalTax']
                    ) {
                        $taxDiff[] = $current;
                        $previous = $current;
                    }
                }
            }
            
            $description = $this->_FYearWiseTax[$key]->pluck("description")->unique()->values();
            $floorDtl = $this->_FYearWiseTax[$key]->pluck("floorDtl");
            $rules=[
                "ruleSet"=>$key,
                "effective_from_fyear"=>$val["effective_from_fyear"],
                "effective_upto_fyear"=>$val["effective_upto_fyear"],
                "description"=>$description,
                "floors"=>$floorDtl,
                "taxDiff"=>$taxDiff,
            ];
            $this->_GRID["RuleSetVersionTax"][]=$rules;
            
        }
        $this->addPenalties($allTaxes);
        
    }

    public function RuleSetTaxCalculator(): void
    {
        $this->_GRID["RuleSetWiseTax"] = $this->_FYearWiseTax;
    }


    private function generateTaxIncludeYear(array $RuleSetTax):array
    {
        $fromFyear = $RuleSetTax["fromFYear"];
        $qtr = $RuleSetTax["fromQtr"];

        if (isset($RuleSetTax["effectiveFromFYear"]) && $fromFyear < $RuleSetTax["effectiveFromFYear"]) {
            $fromFyear = $RuleSetTax["effectiveFromFYear"];
            $qtr = getQtr($RuleSetTax["effectiveFrom"]);
        }

        $uptoFYear = $RuleSetTax["uptoFYear"];
        if (isset($RuleSetTax["effectiveUptoFYear"]) && $uptoFYear > $RuleSetTax["effectiveUptoFYear"]) {
            $uptoFYear = $RuleSetTax["effectiveUptoFYear"];
        }

        $AllfyearTax = [];

        while ($fromFyear <= $uptoFYear) {
            $fyearTax =[]; $RuleSetTax;
            $fyearTax["fyear"] = $fromFyear;
            $currentUptoQtr = ($fromFyear == $uptoFYear) ? $RuleSetTax["uptoQtr"] : 4;
            $fyearTax["fromQtr"]=$qtr;
            $fyearTax["uptoQtr"]=$currentUptoQtr;
            $fyearTax["dueDate"]= FyearQutUptoDate($fromFyear, $currentUptoQtr);
            $fyearTax["ARV"] = $RuleSetTax["ARV"];
            while ($qtr <= $currentUptoQtr) {
                $fyearTax["quarterly"][] = [
                    "qtr"                     => $qtr,
                    "dueDate"                 => FyearQutUptoDate($fromFyear, $qtr),
                    "fyear"                   => $fromFyear,
                    "ARV"                     => ($RuleSetTax["ARV"] ?? 0) / 4,
                ];
                $qtr++;
            }
            $qtr = 1;
            $AllfyearTax[] = $fyearTax;

            [, $uptoYear] = explode("-", $fromFyear);
            $fromFyear = $uptoYear . "-" . ($uptoYear + 1);
        }

        return $AllfyearTax;
    }

    public function GenerateRuleSetFyearTax(array $RuleSetTax): array
    {
        $fromFyear = $RuleSetTax["fromFYear"];
        $qtr = $RuleSetTax["fromQtr"];

        if (isset($RuleSetTax["effectiveFromFYear"]) && $fromFyear < $RuleSetTax["effectiveFromFYear"]) {
            $fromFyear = $RuleSetTax["effectiveFromFYear"];
            $qtr = getQtr($RuleSetTax["effectiveFrom"]);
        }

        $uptoFYear = $RuleSetTax["uptoFYear"];
        if (isset($RuleSetTax["effectiveUptoFYear"]) && $uptoFYear > $RuleSetTax["effectiveUptoFYear"]) {
            $uptoFYear = $RuleSetTax["effectiveUptoFYear"];
        }

        $AllfyearTax = [];

        while ($fromFyear <= $uptoFYear) {
            $fyearTax = $RuleSetTax;
            $fyearTax["fyear"] = $fromFyear;
            $currentUptoQtr = ($fromFyear == $uptoFYear) ? $RuleSetTax["uptoQtr"] : 4;

            while ($qtr <= $currentUptoQtr) {
                $fyearTax["quarterly"][] = [
                    "qtr"                     => $qtr,
                    "dueDate"                 => FyearQutUptoDate($fromFyear, $qtr),
                    "fyear"                   => $fromFyear,
                    "ARV"                     => ($RuleSetTax["ARV"] ?? 0) / 4,
                    "propertyTax"             => ($RuleSetTax["propertyTax"] ?? 0) / 4,
                    "arvRate"                 => $RuleSetTax["arvRate"] ?? 0,
                    "HoldingTaxPercent"       => $RuleSetTax["HoldingTaxPercent"] ?? 0,
                    "HoldingTax"              => $RuleSetTax["HoldingTaxQuarterly"] ?? 0,
                    "CompositeTax"            => $RuleSetTax["CompositeTaxQuarterly"] ?? 0,
                    "LatrineTaxPercent"       => $RuleSetTax["LatrineTaxPercent"] ?? 0,
                    "LatrineTax"              => $RuleSetTax["LatrineTaxQuarterly"] ?? 0,
                    "WaterTaxPercent"         => $RuleSetTax["WaterTaxPercent"] ?? 0,
                    "WaterTax"                => $RuleSetTax["WaterTaxQuarterly"] ?? 0,
                    "HealthCessTaxPercent"    => $RuleSetTax["HealthCessTaxPercent"] ?? 0,
                    "HealthCessTax"           => $RuleSetTax["HealthCessTaxQuarterly"] ?? 0,
                    "EducationCessTaxPercent" => $RuleSetTax["EducationCessTaxPercent"] ?? 0,
                    "EducationCessTax"        => $RuleSetTax["EducationCessTaxQuarterly"] ?? 0,
                    "RWHTaxPercent"           => $RuleSetTax["RWHTaxPercent"] ?? 0,
                    "RWH"                     => $RuleSetTax["RWHQuarterly"] ?? 0,
                    "TotalTax"                => $RuleSetTax["TotalTaxQuarterly"] ?? 0,
                ];
                $qtr++;
            }
            $qtr = 1;

            $fyearTax["monthlyPenalty"] = round(collect($fyearTax["quarterly"])->sum("monthlyPenalty"), 2);
            $AllfyearTax[] = $fyearTax;

            [, $uptoYear] = explode("-", $fromFyear);
            $fromFyear = $uptoYear . "-" . ($uptoYear + 1);
        }

        return $AllfyearTax;
    }

    /**
     * Central execution pipeline while maintaining exact description/formulas
     */
    private function processBuildingRules(string $ruleName, array $floor, string $description, bool $isEducationCessFromHoldingTax = false): array
    {
        $rules = $this->_ruleSets[$ruleName];
        $floorTax = [
            "ruleSet"            => $ruleName,
            "effectiveFrom"      => $rules["effective_from"],
            "effectiveFromFYear" => $rules["effective_from_fyear"],
            "effectiveUpto"      => $rules["effective_upto"],
            "effectiveUptoFYear" => $rules["effective_upto_fyear"],
            "description"        => $description,
        ];

        $buildupArea = $floor["builtupArea"];
        $zoneMstrId = $floor["zoneMstrId"];
        $constructionTypeMasterId = $floor["constructionTypeMasterId"];
        $usageTypeMasterId = $floor["usageTypeMasterId"];

        $usageTypeFactorId = $usageTypeMasterId==1 ? 1 : 2;

        $arvRateDtl = $this->_mBuildingArvRates
            ->where("ulb_id", $this->_ulbId)
            ->where("zone_id", $zoneMstrId)
            ->where("road_type_id", $this->_RoadTypeId)
            ->where("construction_type_master_id", $constructionTypeMasterId)
            ->where("usage_type_id", $usageTypeMasterId)
            ->first(fn($item) => $item["effective_from"] <= $floorTax["effectiveUpto"] && ($item["effective_upto"] === null || $item["effective_upto"] >= $floorTax["effectiveFrom"]));

        $arvRate = $arvRateDtl->rate ?? 0;

        $yearlyARV = $buildupArea * $arvRate;
        $arv10Percent = $yearlyARV * 0.1;
        $taxableARV = $yearlyARV - $arv10Percent;

        $taxMinFYear = getFY(subtractYear(null, $this->_ACT_LIMIT));
        $floorFYear = getFY($floor["dateFrom"]);
        $qtr = getQtr($floor["dateFrom"]);

        if ($floorFYear < $taxMinFYear) {
            $floorFYear = $taxMinFYear;
            $qtr = 1;
        }

        $uptoFYear = getFY($floor["dateUpto"] ?? "");
        $uptoQtr = isset($floor["dateUpto"]) ? getQtr($floor["dateUpto"]) : 4;

        if ($uptoFYear > $floorTax["effectiveUptoFYear"]) {
            $uptoFYear = $floorTax["effectiveUptoFYear"];
            $uptoQtr = isset($floorTax["effectiveUpto"]) ? getQtr($floorTax["effectiveUpto"]) : 4;
        }

        $tax = [
            "fromFYear"             => $floorFYear,
            "fromQtr"               => $qtr,
            "uptoFYear"             => $uptoFYear,
            "uptoQtr"               => $uptoQtr,
            "yearlyARV"             => $yearlyARV,
            "ARV_10_percent_rebate" => $arv10Percent,
            "arvRate"               => $arvRate,
            "taxableArea"           => $buildupArea,
            "usageType"             => $this->floorResCommOtherUsage($usageTypeMasterId),
            "ARV"                   => $taxableARV,
            "constructionType"       => $constructionTypeMasterId,
            "usageTypeFactorId"     => $usageTypeFactorId,            
            "isEducationCessFromHoldingTax"=>$isEducationCessFromHoldingTax,
        ];
        

        $floorTax = array_merge($floorTax, $tax);
        $floorTax["taxIncludeYear"] = $this->generateTaxIncludeYear($floorTax);
        return $floorTax;
    }

    public function BuildingRules1(array $floor): array
    {
        $desc = "<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Yearly ARV = Buildup Area(Sq. Ft) X ARV Rate
                                \n*              Taxable ARV = Yearly ARV - ( Yearly ARV X 10 %)
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              (a) Property Tax = Taxable ARV x Rate % X Usage Factor
                                \n*                        # clause 
                                \n*                        # (a) IF custruction type other and buildup area <= 500 sq ft AND construction type other then 0
                                \n*                        # (b) IF Made By BPL catogory or construct under IHSDP (Integrated Housing and Slum Development Programme) [एकीकृत आवास और झुग्गी विकास कार्यक्रम]
                                \n*
                                \n*              (b) Composite Tax = Fix Tax 
                                \n*              (c) Education Cess = Property Tax x 2 % 
                                \n*              
                                \n*              
                                \n*              Yearly Tax = Property Tax + Composite Tax + Education Cess
                                \n*                                 
                            \n
                </pre>";

        return $this->processBuildingRules(__FUNCTION__, $floor, $desc, true);
    }

    public function BuildingRules2(array $floor): array
    {
        $desc = "<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Yearly ARV = Buildup Area(Sq. Ft) X ARV Rate
                                \n*              Taxable ARV = Yearly ARV - ( Yearly ARV X 10 %)
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              (a) Property Tax = Taxable ARV x Rate % X Usage Factor
                                \n*                        # clause 
                                \n*                        # (a) IF custruction type other and buildup area <= 500 sq ft AND construction type other then 0
                                \n*                        # (b) IF Made By BPL catogory or construct under IHSDP (Integrated Housing and Slum Development Programme) [एकीकृत आवास और झुग्गी विकास कार्यक्रम]
                                \n*
                                \n*              (b) Composite Tax = Fix Tax 
                                \n*              (c) Education Cess = Taxable ARV x 2 % 
                                \n*              
                                \n*              
                                \n*              Yearly Tax = Property Tax + Composite Tax + Education Cess
                                \n*                                 
                            \n
                </pre>";

        return $this->processBuildingRules(__FUNCTION__, $floor, $desc, false);
    }

    public function BuildingRules3(array $floor): array
    {
        $desc = "<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Yearly ARV = Buildup Area(Sq. Ft) X ARV Rate
                                \n*              Taxable ARV = Yearly ARV - ( Yearly ARV X 10 %)
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              (a) Property Tax = Taxable ARV x Rate % X Usage Factor
                                \n*                        # clause 
                                \n*                        # (a) IF custruction type other and buildup area <= 500 sq ft then 0
                                \n*                        # (b) IF Made By BPL catogory or construct under IHSDP (Integrated Housing and Slum Development Programme) [एकीकृत आवास और झुग्गी विकास कार्यक्रम]
                                \n*
                                \n*              (b) Composite Tax = Fix Tax 
                                \n*              (c) Education Cess = Taxable ARV x 2 % 
                                \n*              
                                \n*              
                                \n*              Yearly Tax = Property Tax + Composite Tax + Education Cess
                                \n*                                 
                            \n
                </pre>";

        return $this->processBuildingRules(__FUNCTION__, $floor, $desc, false);
    }

    public function BuildingRules4(array $floor): array
    {
        $desc = "<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Yearly ARV = Buildup Area(Sq. Ft) X ARV Rate
                                \n*              Taxable ARV = Yearly ARV - ( Yearly ARV X 10 %)
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              (a) Property Tax = Taxable ARV x Rate % X Usage Factor
                                \n*                        # clause 
                                \n*                        # (a) IF custruction type other and buildup area <= 500 sq ft AND construction type other then 0
                                \n*                        # (b) IF Made By BPL catogory or construct under IHSDP (Integrated Housing and Slum Development Programme) [एकीकृत आवास और झुग्गी विकास कार्यक्रम]
                                \n*
                                \n*              (b) Composite Tax = Fix Tax 
                                \n*              (c) Education Cess = Taxable ARV x 2 % 
                                \n*              
                                \n*              
                                \n*              Yearly Tax = Property Tax + Composite Tax + Education Cess
                                \n*                                 
                            \n
                </pre>";

        return $this->processBuildingRules(__FUNCTION__, $floor, $desc, false);
    }

    public function BuildingRules5(array $floor): array
    {
        $desc = "<pre>
                                \n* ======================== Formula ==========================================
                                \n*              Yearly ARV = Buildup Area(Sq. Ft) X ARV Rate
                                \n*              Taxable ARV = Yearly ARV - ( Yearly ARV X 10 %)
                                \n*      -------------------------------------------------------------------------------------------
                                \n*              (a) Property Tax = Taxable ARV x Rate % X Usage Factor
                                \n*                        # clause 
                                \n*                        # (a) IF custruction type other and buildup area <= 500 sq ft AND construction type other then 0
                                \n*                        # (b) IF Made By BPL catogory or construct under IHSDP (Integrated Housing and Slum Development Programme) [एकीकृत आवास और झुग्गी विकास कार्यक्रम]
                                \n*
                                \n*              (b) Composite Tax = Fix Tax 
                                \n*              (c) Education Cess = Taxable ARV x 2 % 
                                \n*              
                                \n*              
                                \n*              Yearly Tax = Property Tax + Composite Tax + Education Cess
                                \n*                                 
                            \n
                </pre>";

        return $this->processBuildingRules(__FUNCTION__, $floor, $desc, false);
    }

    public function calculateTax(): void
    {
        $this->FloorTaxCalculator();
        $this->FYearTaxCalculator();
        $this->RuleSetTaxCalculator();
    }
}