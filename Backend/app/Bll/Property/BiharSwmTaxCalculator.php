<?php

namespace App\Bll\Property;

use App\Models\Property\SwmRateMaster;
use Carbon\Carbon;

class BiharSwmTaxCalculator
{
    public $_GRID;
    public $_REQUEST;
    public $_dateOfEffective;
    public $_category;
    public $_subCategoryTypeId;
    private $_minFromDate;
    private $_ObjSwmRateMaster;
    private $_mSwmRateMaster;
    private $_uptoDate;
    
    public function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_dateOfEffective = Carbon::parse($this->_REQUEST->dateOfEffective)->startOfMonth()->format("Y-m-d");
        $this->_category = $this->_REQUEST->category??"APL";
        $this->_subCategoryTypeId = $this->_REQUEST->subCategoryTypeMasterId;
        $this->_ObjSwmRateMaster = new SwmRateMaster();

        $this->loadParam();
    }

    public function loadParam(){ 
        $this->_mSwmRateMaster = $this->_ObjSwmRateMaster->where("lock_status",false)->orderBy("effective_from","ASC")->get();
    }


    public function FYearTaxCalculator(){
        $allTaxes = collect();
        $this->_uptoDate = FyearFromUptoDate(getFY())[1];
        while($this->_uptoDate>=$this->_dateOfEffective){
            $uptoDate = Carbon::parse($this->_dateOfEffective)->endOfMonth()->format("Y-m-d");
            $arvRate = collect($this->_mSwmRateMaster)
                ->where("sub_category_type_master_id",$this->_subCategoryTypeId)
                ->where("category",$this->_category)
                ->filter(function ($item){
                    $itemFrom = $item["effective_from"];
                    $itemUpto = $item["effective_upto"];
                    return (
                        // condition 1: starts before my end
                        $itemFrom <= $this->_dateOfEffective
                        &&
                        // condition 2: ends after my start
                        ($itemUpto === null || $itemUpto >= $this->_dateOfEffective)
                    );
                })
                ->sortBy("effective_from")
                ->first();
            $ratePerMonth = $arvRate->rate_per_month;

            $this->_GRID[] = [
                "generationDate"=>Carbon::now()->format("Y-m-d"),
                "demandFrom"=>$this->_dateOfEffective,
                "demandUpto"=>$uptoDate,
                "amount"=>$ratePerMonth,
                "rate"=>$ratePerMonth,
                "rateId"=>$arvRate->id,
            ];
            $this->_dateOfEffective = Carbon::parse($uptoDate)->addDay()->format("Y-m-d");            
        }
    }
    public function calculateTax(){
        $this->FYearTaxCalculator();
    }
}