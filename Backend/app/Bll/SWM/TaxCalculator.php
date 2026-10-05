<?php

namespace App\Bll\SWM;

use App\Exceptions\CustomException;
use App\Models\SWM\RateMaster;
use Carbon\Carbon;

class TaxCalculator
{
    public $_GRID;
    public $_CurrentDate;
    public $_CategoryTypeMasterId;
    public $_SubCategoryTypeMasterId;
    public $_HasCompostingMachineProvision;
    public $_REQUEST;
    public $_Charges;

    private $_RateMaster;

    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_RateMaster = new RateMaster();

        $this->loadParam();
    }

    public function loadParam(){        
        $this->_CurrentDate = $this->_REQUEST->dateOfEffective ? $this->_REQUEST->dateOfEffective : Carbon::now()->format('Y-m-d');
        $this->_CategoryTypeMasterId = $this->_REQUEST->categoryTypeMasterId;
        $this->_SubCategoryTypeMasterId = $this->_REQUEST->subCategoryTypeMasterId;
    }

    public function getCharge(){
        $currentDate = Carbon::parse($this->_CurrentDate);
        $rates = $this->_RateMaster->getRateList();
        $rate = $rates->filter(function ($item) use ($currentDate){
            $effectiveFrom = Carbon::parse($item->effective_from);
            $effectiveUpto = $item->effective_upto ? Carbon::parse($item->effective_upto) : null;

            return $item->sub_category_type_master_id == $this->_SubCategoryTypeMasterId
                && $effectiveFrom->lte($currentDate)
                && (!$effectiveUpto || $effectiveUpto->gte($currentDate))
                && !$item->lock_status;
        })->sortByDesc('effective_from')->first();

        // fallback: earliest rate if none matched
        if (!$rate) {
            $rate = $rates->where('sub_category_type_master_id', $this->_SubCategoryTypeMasterId)->first();
        }

        if (!$rate) {
            throw new CustomException("No rate found for SubCategory ID: {$this->_SubCategoryTypeMasterId}");
        }
        $effectiveFrom = $this->_CurrentDate ;
        $firmDate = Carbon::parse($rate->effective_from);
        $currentDate = Carbon::parse($this->_CurrentDate);        
        if ($firmDate->greaterThan($currentDate)) {
            $effectiveFrom = $firmDate->clone()->format("Y-m-d");
        } 
        $this->_GRID=[
            "rate"=>$rate,
            'effectiveFrom'=>$effectiveFrom,
            "ratePerMonth"=>$this->_HasCompostingMachineProvision ?($rate->is_percent_composting_machine_rate ? (($rate->rate_per_month/100)*$rate->composting_machine_rate) : $rate->is_percent_composting_machine_rate) : $rate->rate_per_month,
        ];
    }
}
