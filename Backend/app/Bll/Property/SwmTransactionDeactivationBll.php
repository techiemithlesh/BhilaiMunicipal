<?php

namespace App\Bll\Property;

use App\Exceptions\CustomException;
use App\Models\Property\SwmConsumerDemand;
use App\Models\Property\SwmConsumerDemandsCollection;
use App\Models\Property\SwmConsumerTransaction;

class SwmTransactionDeactivationBll
{
    public $_REQUEST;
    public $_TranId;
    public $_SwmTransaction;
    public $_Transaction;

    public function __construct($tranId)
    {
        $this->_TranId= $tranId;
        $this->_SwmTransaction = new SwmConsumerTransaction();
        $this->_Transaction =  $this->_SwmTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->find($this->_TranId);
    }

    // private function deactivateAdvance(){
    //     $advance = AdvanceDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->first();
    //     if($advance){
    //         $advance->lock_status =  true;
    //         $advance->update();
    //     }

    // }

    // private function deactivateAdjustment(){
    //     $adjustment = AdjustmentDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->first();
    //     if($adjustment){
    //         $adjustment->lock_status =  true;
    //         $adjustment->update();
    //     }
    // }

    private function swmTranDeactivation(){
        // $property = PropertyDetail::find($this->_Transaction->property_detail_id);
        $collection = SwmConsumerDemandsCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        foreach($collection as $coll){
            $demand = SwmConsumerDemand::find($coll->consumer_demand_id);
            $demand->balance = $demand->balance + $coll->amount;
            if($demand->balance > 0 ){
                $demand->is_full_paid = false;
            }
            if(round($demand->balance) == round($demand->amount)){
                $demand->paid_status = false;
            } 
            $demand->update();
            $coll->lock_status = true;
            $coll->update();
        }
    }

    public function deactivateTransaction(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }
        $this->swmTranDeactivation();
        // $this->deactivateAdvance();
        // $this->deactivateAdjustment();                
        $this->_Transaction->lock_status =  true;        
        $this->_Transaction->update();
    }

    public function chequeBounce(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }

        $this->swmTranDeactivation();
        // $this->deactivateAdvance();
        // $this->deactivateAdjustment();
    }

}