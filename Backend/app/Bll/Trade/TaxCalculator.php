<?php
namespace App\Bll\Trade;

use App\Models\Trade\LicenseRateMaster;
use App\Models\Trade\TradeItemTypeMaster;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TaxCalculator{
    public $_GRID;
    public $_CurrentDate;
    public $_ApplicationTypeId;
    public $_FirmDate;
    public $_LicenseForYear;
    public $_AreaInSqrtFt;
    public $_IsTobaccoLicense;
    public $_REQUEST;

    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_CurrentDate = $this->_REQUEST->currentDate ? $this->_REQUEST->currentDate : Carbon::now()->format('Y-m-d');
        $this->_ApplicationTypeId = $this->_REQUEST->applicationId;
        $this->_FirmDate = $this->_REQUEST->firmEstablishmentDate;
        $this->_LicenseForYear = $this->_REQUEST->licenseForYears;
        $this->_AreaInSqrtFt = $this->_REQUEST->areaInSqft;
        $this->_IsTobaccoLicense = $this->_REQUEST->isTobaccoLicense ? true : false;
    }
    

    public function getCharge1(){
        $rate = LicenseRateMaster::where("application_type_id",$this->_ApplicationTypeId)
                ->where("effective_from",'<=',$this->_CurrentDate)
                ->where(function($orWhere){
                    $orWhere->where('effective_upto',">=",$this->_CurrentDate)
                    ->orWhereNull("effective_upto");
                })
                ->where("from_area","<=",round($this->_AreaInSqrtFt))
                ->where(function($orWhere){
                    $orWhere->where('upto_area',">=",round($this->_AreaInSqrtFt))
                    ->orWhereNull("upto_area");
                })
                ->where("is_tobacco",$this->_IsTobaccoLicense)
                ->where("lock_status",false)
                ->orderBy("effective_from","DESC")
                ->first();
            
        $firmDate = Carbon::parse($this->_FirmDate);
        $currentDate = Carbon::parse($this->_CurrentDate);
        $diff = $firmDate->diff($currentDate);
        $yearDiff = $diff->y;  
        $monthDiff = $diff->m; 
        if ($firmDate->greaterThan($currentDate)) {
            $yearDiff = 0;
            $monthDiff = 0;
        } 
        $unitAmount = $rate->rate;
        $currentCharge = $unitAmount * $this->_LicenseForYear;
        $arrearCharge = $yearDiff * $unitAmount;
        $latePenalty = $monthDiff * 20;
        $this->_GRID=[
            "rate"=>$rate,
            "yearDiff"=>$yearDiff,
            "monthDiff"=>$monthDiff,
            "licenseCharge"=>$unitAmount,
            "currentCharge"=>$currentCharge,
            "arrearCharge"=>$arrearCharge,
            "latePenalty"=>$latePenalty,
            "totalCharge"=> round($currentCharge + $arrearCharge + $latePenalty),
        ];
    }

    public function getCharge(){
        $itemIds = collect($this->_REQUEST->natureOfBusiness)->pluck("tradeItemTypeId");
        $rate = TradeItemTypeMaster::whereIn("id",$itemIds)->get();
            
        $firmDate = Carbon::parse($this->_FirmDate);
        $currentDate = Carbon::parse($this->_CurrentDate);
        $diff = $firmDate->diff($currentDate);
        $yearDiff = $diff->y;  
        $monthDiff = $diff->m; 
        if ($firmDate->greaterThan($currentDate)) {
            $yearDiff = 0;
            $monthDiff = 0;
        }
        $unitAmount = 0;
        switch($this->_ApplicationTypeId){
            #NEW LICENSE
            case 1 : $unitAmount = $rate->sum("new_rate");
                    break;
            #RENEWAL LICENSE
            case 2 : $unitAmount = $rate->sum("renewal_rate");
                    break;
            #AMENDMENT LICENSE
            case 3 : $unitAmount = $rate->sum("amendment_rate");
                    break;
            #SURRENDER LICENSE
            case 4 : $unitAmount = $rate->sum("surrender_rate");
                    break;
        } 
        $currentCharge = $unitAmount * $this->_LicenseForYear;
        $arrearCharge = $yearDiff * $unitAmount;
        $latePenalty = $monthDiff * 300;
        if($this->_ApplicationTypeId==1){
            $latePenalty =0;
        }
        $this->_GRID=[
            "rate"=>$rate,
            "yearDiff"=>$yearDiff,
            "monthDiff"=>$monthDiff,
            "licenseCharge"=>$unitAmount,
            "currentCharge"=>$currentCharge,
            "arrearCharge"=>$arrearCharge,
            "latePenalty"=>$latePenalty,
            "totalCharge"=> round($currentCharge + $arrearCharge + $latePenalty),
        ];
    }
}