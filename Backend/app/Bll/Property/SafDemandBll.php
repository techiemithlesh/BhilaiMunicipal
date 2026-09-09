<?php

namespace App\Bll\Property;

use App\Models\Property\ActiveSafDetail;
use App\Models\Property\AdvanceDetail;
use App\Models\Property\PenaltyDetail;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\SafDemand;
use App\Models\Property\SafDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SafDemandBll
{
    public $_GRID;
    public $_SAFId;
    public $_tranDate;
    public $_tranDateFyear ;
    public $_SAF;
    public $_isVacantLand = false ;
    public $_demandAmount = 0;
    public $_currentDemandAmount = 0 ;
    public $_arrearDemandAmount = 0;
    public $_currentDemandMonthlyPenalty = 0 ;
    public $_arrearDemandMonthlyPenalty = 0;
    public $_DemandList;
    public $_otherPenaltyList;
    public $_monthlyPenalty = 0;
    public $_demandFromFyear;
    public $_demandFromQtr;
    public $_demandUptoFyear;
    public $_demandUptoQtr;
    public $_lateAssessmentPenalty = 0 ;
    public $_otherPenalty = 0;
    public $_onlineRebate = 0;
    public $_jskRebate = 0;
    public $_firstQtrRebate = 0;
    public $_quarterlyRebate = 0;
    public $_specialRebate = 0;

    public $_advanceAmount = 0 ;

    public $_lastPaymentIsClear = true;

    function __construct($safId,$tranDate=null)
    {
        $this->_SAFId = $safId;
        $this->_tranDate = Carbon::parse($tranDate);
        $this->_tranDateFyear = getFY($this->_tranDate->copy()->format("Y-m-d"));
        $this->_SAF = ActiveSafDetail::find($this->_SAFId);
        if(!$this->_SAF){
            $this->_SAF = SafDetail::find($this->_SAFId);
        }        
        $this->setDemandList();
        $this->testLastTran();
    }

    public function testLastTran(){
        $last = $this->_SAF->getLastTran();
        if($last && $last->payment_status==2){
            $this->_lastPaymentIsClear = false;
        }
    }
    public function setDemandList(){        
        $currentFyear = getFY($this->_tranDate->copy()->format("Y-m-d"));
        $safDemand = new SafDemand();
        $this->_DemandList = collect($safDemand->getDueDemand($this->_SAFId))->where("fyear","<=",$this->_tranDateFyear);
        $this->_DemandList = $this->_DemandList->map(function($item){                                
                                $item = $this->getOnePercentPenalty($item);
                                return $item;
                            });
        $this->_monthlyPenalty = roundFigure($this->_DemandList->sum("monthlyPenalty"));
        $this->_demandAmount = roundFigure($this->_DemandList->sum("balance_tax"));

        $currentDemand = $this->_DemandList->where("fyear",$this->_tranDateFyear);
        $currentDemandAmt = $currentDemand->sum("balance_tax");
        $currentDemandMonthlyPenalty = $currentDemand->sum("monthlyPenalty");

        $previousDemand = $this->_DemandList->where("fyear","<",$this->_tranDateFyear);
        $previousDemandAmt = $previousDemand->sum("balance_tax");
        $previousDemandMonthlyPenalty = $previousDemand->sum("monthlyPenalty");

        $this->_currentDemandAmount = roundFigure($currentDemandAmt);
        $this->_arrearDemandAmount = roundFigure($previousDemandAmt);

        $this->_currentDemandMonthlyPenalty = roundFigure($currentDemandMonthlyPenalty);
        $this->_arrearDemandMonthlyPenalty = roundFigure($previousDemandMonthlyPenalty);
                
        $this->_demandFromFyear = $this->_DemandList->min("fyear");
        $this->_demandFromQtr = $this->_DemandList->where("fyear",$this->_demandFromFyear)->min("qtr");
        $this->_demandUptoFyear = $this->_DemandList->max("fyear");
        $this->_demandUptoQtr = $this->_DemandList->where("fyear",$this->_demandUptoFyear)->max("qtr");
    }

    public function testVacantLand(){
        $propertyTypeMaster = new PropertyTypeMaster();
        $vacantLand = collect($propertyTypeMaster->getPropertyTypeList())->where("property_type","VACANT LAND")->first();
        if($this->_SAF->property_type_mstr_id==($vacantLand->id??"")){
            $this->_isVacantLand = true;
        }
    }

    public function getLateAssesPenalty(){
        $before90Days = $this->_tranDate->copy()->subDays("90")->format("Y-m-d");
        if($this->_isVacantLand && $this->_SAF->land_occupation_date < $before90Days){
            if($this->_SAF->is_mobile_tower || $this->_SAF->is_hoarding_board){
                $this->_lateAssessmentPenalty = 0;
            }
            else{
                $this->_lateAssessmentPenalty = 0;
            }
        }
        else{
            $floor = $this->_SAF->getFloors();
            $newFloors = collect($floor)->whereNull("prop_floor_detail_id")->where("date_from","<",$before90Days);
            $commercialFloor = collect($newFloors)->whereNotIn("usage_type_master_id",[1,11]);
            if($newFloors->isNotEmpty()){
                $this->_lateAssessmentPenalty = 0;
                if($commercialFloor->isNotEmpty()){
                    $this->_lateAssessmentPenalty = 0;
                }
            }
        }

        if($this->_SAF->payment_status && $this->_SAF->payment_status!=3){
            $this->_lateAssessmentPenalty = 0;
        }
    }
    public function getOtherPenalty(){
        $this->_otherPenaltyList = PenaltyDetail::where("lock_status",false)->where("saf_detail_id",$this->_SAFId)->get();
        $this->_otherPenalty = roundFigure($this->_otherPenaltyList->sum("penalty_amt"));
    }

    public function getQtrRebate(){
        $user = Auth()->user();
        $currentDate = $this->_tranDate->copy()->format("Y-m-d");
        list($fromYear,$uptoYear) = explode("-",$this->_tranDateFyear);
        $firstQuarterLastDate = calculateQuaterDueDate($fromYear."-04-01");
        $firstQuarterStartDate = calculateQuarterStartDate($firstQuarterLastDate);
        # 5% online Rebate
        if(!$user || $user->getTable()!="users"){ 
            $this->_onlineRebate = ($this->_currentDemandAmount * 0.0);
        }# 2.5% JSK Rebate
        elseif($user->getTable()=="users"){
            $role = $user->getRoleDetailsByUserId()->first();
            $roleId = $role->id??0;
            if(in_array($roleId,[1,8])){
                $this->_jskRebate = ($this->_currentDemandAmount * 0.0);
            }
            
        }
        # 5% first quarter rebate
        if($firstQuarterStartDate >= $currentDate && $currentDate <= $firstQuarterLastDate){
            $this->_firstQtrRebate = ($this->_currentDemandAmount * 0.05);
        }
        $this->_quarterlyRebate = roundFigure($this->_firstQtrRebate + $this->_jskRebate + $this->_onlineRebate);
    }

    public function getSpecialRebate(){
        if(in_array($this->_SAF->holding_type,['PURE_RESIDENTIAL', 'VACANT_LAND'])){
            $currentDate = $this->_tranDate->copy()->format("Y-m-d");
            list($fromYear,$uptoYear) = explode("-",$this->_tranDateFyear);
            $firstQuarterLastDate = calculateQuaterDueDate($fromYear."-04-01");
            $owners = $this->_SAF->getOwners();
            if($owners->count() == 1){
                $owners = $owners->first();
                #5% when female Or transgender
                if(in_array($owners->gender, ['Female','Other'])){
                    $this->_specialRebate = $this->_demandAmount * 0.0;
                }
                #5% when armed force
                if($owners->is_armed_force){
                    $this->_specialRebate = $this->_demandAmount * 0.0;
                }
                #5% when specially able
                if($owners->is_specially_abled){
                    $this->_specialRebate = $this->_demandAmount * 0.0;
                }
                #5% when Senior Citizen
                if($owners->dob && Carbon::parse($owners->dob)->diffInYears($firstQuarterLastDate)>=60){
                    $this->_specialRebate = $this->_demandAmount * 0.0;
                }
            }
            $this->_specialRebate = roundFigure($this->_specialRebate);
        }
    }

    public function getAdvanceAmount(){
        $AdvanceDetail = new AdvanceDetail();DB::connection("pgsql_property")->enableQueryLog();
        $this->_advanceAmount = $AdvanceDetail->getSafAdvanceAmount($this->_SAFId)->advance_amount??0;
    }

    public function getOnePercentPenalty($demandList){
        $penalty = 0 ;
        $monthDiff = 0;
        # 1.5 percent penalty applicable
        // if($demandList->due_date && $demandList->due_date < $this->_tranDate->copy()->format("Y-m-d") && getFY($demandList->due_date)<getFY())
        if(getFY($demandList->due_date)<getFY())
        {
            $monthDiff = floor(Carbon::parse($demandList->due_date)->diffInMonths($this->_tranDate));
            $penalty = roundFigure(($demandList->balance_tax * $monthDiff * 1.5)/100);
        }
        if(getFY($demandList->due_date)==getFY()  && $this->_tranDate->copy()->format("Y-m-d")>=FyearQutFromDate(getFY(),3) ){
            $monthDiff = floor(Carbon::parse(FyearQutUptoDate(getFY(),2))->diffInMonths($this->_tranDate));
            $penalty = roundFigure(($demandList->balance_tax * $monthDiff * 1.5)/100);
        }
        $demandList->monthDiff = $monthDiff;
        $demandList->monthlyPenalty = $penalty;
        return $demandList;
    }

    public function generateDemand(){
        $previousDemand = $this->generateGrantTax($this->_DemandList->where("fyear","<",$this->_tranDateFyear));
        $currentTax = $this->generateGrantTax($this->_DemandList->where("fyear",$this->_tranDateFyear));
        $this->_GRID = [
            "lastPaymentClear" => $this->_lastPaymentIsClear,
            "demandList"=>$this->_DemandList,
            "previousDemand"=> $previousDemand,
            "currentDemand"=> $currentTax,
            "grantTax"=>$this->generateGrantTax($this->_DemandList),
            "otherPenaltyList"=>$this->_otherPenaltyList,
            "demandAmount"=>$this->_demandAmount,
            "advanceAmount" => $this->_advanceAmount,
            "lateAssessmentPenalty" => $this->_lateAssessmentPenalty,
            "OtherPenalty"=>$this->_otherPenalty,
            "monthlyPenalty"=>$this->_monthlyPenalty,
            "rebateAmount"=>$this->_quarterlyRebate,
            "firstQuatreRebate" => roundFigure($this->_firstQtrRebate),
            "onlineRebate" => roundFigure($this->_onlineRebate),
            "jskRebate" => roundFigure($this->_jskRebate),
            "specialRebate"=>$this->_specialRebate,
            "fromFyear"=>$this->_demandFromFyear,
            "fromQtr"=>$this->_demandFromQtr,
            "uptoFyear"=>$this->_demandUptoFyear,
            "uptoQtr"=>$this->_demandUptoQtr,
            "currentDemandAmount" =>$this->_currentDemandAmount,
            "arrearDemandAmount" => $this->_arrearDemandAmount,
            "arrearDemandMonthlyPenalty"=>$this->_arrearDemandMonthlyPenalty,
            "payableAmount" => roundFigure(($this->_demandAmount + $this->_lateAssessmentPenalty + $this->_otherPenalty + $this->_monthlyPenalty) - ($this->_quarterlyRebate + $this->_specialRebate + $this->_advanceAmount) ),
            "arrearPayableAmount" => roundFigure(($this->_arrearDemandAmount + $this->_lateAssessmentPenalty + $this->_otherPenalty + $this->_arrearDemandMonthlyPenalty) - ( $this->_specialRebate + $this->_advanceAmount) ),
        ];
    }

    public function generateGrantTax($demandList){
        $demandList = collect($demandList);
        $returnData = [
            "total_tax"=>roundFigure($demandList->sum("total_tax")),
            "holding_tax"=> roundFigure($demandList->sum("holding_tax")),
            "latrine_tax"=> roundFigure($demandList->sum("latrine_tax")),
            "water_tax"=> roundFigure($demandList->sum("water_tax")),
            "health_cess_tax"=> roundFigure($demandList->sum("health_cess_tax")),
            "education_cess_tax"=> roundFigure($demandList->sum("education_cess_tax")),
            "rwh_tax"=> roundFigure($demandList->sum("rwh_tax")),
            "fine_tax"=> roundFigure($demandList->sum("fine_tax")),
            "adjust_amt"=> roundFigure($demandList->sum("adjust_amt")),
            "balance_tax"=> roundFigure($demandList->sum("balance_tax")),
            "due_holding_tax"=> roundFigure($demandList->sum("due_holding_tax")),
            "due_latrine_tax"=> roundFigure($demandList->sum("due_latrine_tax")),
            "due_water_tax"=> roundFigure($demandList->sum("due_water_tax")),
            "due_health_cess_tax"=> roundFigure($demandList->sum("due_health_cess_tax")),
            "due_education_cess_tax"=> roundFigure($demandList->sum("due_education_cess_tax")),
            "due_rwh_tax"=> roundFigure($demandList->sum("due_rwh_tax")),
            "monthlyPenalty"=> roundFigure($demandList->sum("monthlyPenalty")),
        ];
        return collect($returnData);
    }

    public function getSafDue(){
        $this->getLateAssesPenalty();
        $this->getQtrRebate();
        $this->getSpecialRebate();
        $this->getAdvanceAmount();
        $this->generateDemand();
    }
}