<?php

namespace App\Bll\Water;

use App\Models\DBSystem\UlbMaster;
use App\Models\Water\FixedRateMaster;
use Carbon\Carbon;

class BiharTaxCalculator
{
    public $_GRID;
    public $_CurrentDate;
    public $_ConnectionTypeId;
    public $_CategoryType;
    public $_PropertyTypeId;
    public $_AreaInSqrtFt;
    public $_REQUEST;
    public $_Charges;
    private $_FixedRateMaster;
    private $_UlbId;
    private $_UlbTypeId;

    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_FixedRateMaster = new FixedRateMaster();

        $this->loadParam();
    }

    public function loadParam(){        
        $this->_CurrentDate = $this->_REQUEST->currentDate ? $this->_REQUEST->currentDate : Carbon::now()->format('Y-m-d');
        $this->_ConnectionTypeId = $this->_REQUEST->connectionTypeId;
        $this->_CategoryType = $this->_REQUEST->category;
        $this->_PropertyTypeId = $this->_REQUEST->propertyTypeId;
        $this->_AreaInSqrtFt = $this->_REQUEST->areaSqft;
        $this->_UlbId = $this->_REQUEST->ulbId;
        $this->_UlbTypeId = UlbMaster::find($this->_UlbId)?->ulb_type_id;
    }

    public function calculateTax(){
        $rate = $this->_FixedRateMaster
                ->where("property_type_id",$this->_PropertyTypeId)
                ->where("ulb_type_id",$this->_UlbTypeId)
                ->where("effective_from",'<=',$this->_CurrentDate)
                ->where(function($orWhere){
                    $orWhere->where('effective_upto',">=",$this->_CurrentDate)
                    ->orWhereNull("effective_upto");
                });
        if(in_array($this->_PropertyTypeId,[1])){
            $rate->where("category",$this->_CategoryType);
        }
        $rate = $rate->where("lock_status",false)
                ->orderBy("effective_from","ASC")
                ->first();
        $conn_fee=$rate['rate'];
        $penalty=0;
        $description="";
        

        $this->_GRID=[
            "rate"=>$rate,
            "connFee"=>$conn_fee,
            "penalty"=>$penalty,
            "description"=>$description,
            "totalCharge"=> round($conn_fee + $penalty),
        ];
    }
}