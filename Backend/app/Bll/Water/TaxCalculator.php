<?php

namespace App\Bll\Water;

use App\Models\Water\WaterNewConnectionRate;
use Carbon\Carbon;

class TaxCalculator
{
    public $_GRID;
    public $_CurrentDate;
    public $_ConnectionTypeId;
    public $_CategoryType;
    public $_PropertyTypeId;
    public $_AreaInSqrtFt;
    public $_REQUEST;
    public $_Charges;

    private $_WaterNewConnectionRate;

    function __construct($request)
    {
        $this->_REQUEST = $request;
        $this->_WaterNewConnectionRate = new WaterNewConnectionRate();

        $this->loadParam();
    }

    public function loadParam(){        
        $this->_CurrentDate = $this->_REQUEST->currentDate ? $this->_REQUEST->currentDate : Carbon::now()->format('Y-m-d');
        $this->_ConnectionTypeId = $this->_REQUEST->connectionTypeId;
        $this->_CategoryType = $this->_REQUEST->category;
        $this->_PropertyTypeId = $this->_REQUEST->propertyTypeId;
        $this->_AreaInSqrtFt = $this->_REQUEST->areaSqft;
    }

    public function calculateTax(){
        $rate = $this->_WaterNewConnectionRate
                ->where("property_type_id",$this->_PropertyTypeId)
                ->where("effective_from",'<=',$this->_CurrentDate)
                ->where(function($orWhere){
                    $orWhere->where('effective_upto',">=",$this->_CurrentDate)
                    ->orWhereNull("effective_upto");
                });
        if(in_array($this->_PropertyTypeId,[1,7])){
            $rate->where("from_area","<=",round($this->_AreaInSqrtFt))
            ->where(function($orWhere){
                $orWhere->where('upto_area',">=",round($this->_AreaInSqrtFt))
                ->orWhereNull("upto_area");
            });

        }
        $rate = $rate->where("lock_status",false)
                ->orderBy("effective_from","DESC")
                ->first();
        $conn_fee=$rate['rate'] * $this->_AreaInSqrtFt ;
        if($rate['calculation_type']=='Fixed')
        {
            $conn_fee=$rate['rate'];
        }
        $six_months_after=Carbon::parse('2021-01-01')->addMonths(6)->format("Y-m-d");
        $penalty=0;
        $description="";
        if($this->_ConnectionTypeId==2) // Regularization
        {
            switch($this->_PropertyTypeId){
                case 1 : $penalty = 4000; // for resident
                         if($this->_CurrentDate < $six_months_after){
                            $penalty=2000;
                         }
                         break;
                default : $penalty=10000;
                         if($this->_CurrentDate < $six_months_after){
                            $penalty=5000;
                         }
            }
            $description="If Pay Full Payment In Case Of Realization Then 10% Discount";
        }
        

        $this->_GRID=[
            "rate"=>$rate,
            "connFee"=>$conn_fee,
            "penalty"=>$penalty,
            "description"=>$description,
            "totalCharge"=> round($conn_fee + $penalty),
        ];
    }
}
