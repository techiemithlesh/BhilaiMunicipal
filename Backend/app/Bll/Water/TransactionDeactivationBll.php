<?php

namespace App\Bll\Water;

use App\Exceptions\CustomException;
use App\Models\Water\AdjustmentDetail;
use App\Models\Water\AdvanceDetail;
use App\Models\Water\ConnectionChargeCollection;
use App\Models\Water\ConsumerDemand;
use App\Models\Water\ConsumerDemandsCollection;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterConnectionCharge;
use App\Models\Water\WaterRejectedApplication;
use App\Models\Water\WaterTransaction;

class TransactionDeactivationBll
{
    /**
     * Create a new class instance.
     */
    public $_REQUEST;
    public $_TranId;
    public $_WaterTransaction;
    public $_Transaction;

    public function __construct($tranId)
    {
        $this->_TranId= $tranId;
        $this->_WaterTransaction = new WaterTransaction();
        $this->_Transaction =  $this->_WaterTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->find($this->_TranId);
    }

    private function deactivateAdvance(){
        $advance = AdvanceDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->first();
        if($advance){
            $advance->lock_status =  true;
            $advance->update();
        }

    }

    private function deactivateAdjustment(){
        $adjustment = AdjustmentDetail::where("lock_status",false)->where("transaction_id",$this->_TranId)->first();
        if($adjustment){
            $adjustment->lock_status =  true;
            $adjustment->update();
        }
    }

    private function applicationTranDeactivation(){
        $app = WaterActiveApplication::find($this->_Transaction->application_id);
        if(!$app){
            $app = WaterApplication::find($this->_Transaction->application_id);
        }if(!$app){
            $app = WaterRejectedApplication::find($this->_Transaction->application_id);
        }
        $collection = ConnectionChargeCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        foreach($collection as $coll){
            $demand = WaterConnectionCharge::find($coll->connection_charge_id);
            $demand->paid_status = false;
            $demand->update();
            $coll->lock_status = true;
            $coll->update();
        }
        if(!$this->_WaterTransaction->where("application_id",$app->id)->where("id","<>",$this->_TranId)->where("lock_status",false)->count()){
            $app->payment_status = 0;            
        }
        $app->update();
    }

    private function consumerTranDeactivation(){
        $collection = ConsumerDemandsCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        foreach($collection as $coll){
            $demand = ConsumerDemand::find($coll->consumer_demand_id);
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
        if($this->_Transaction->application_id){
            $this->applicationTranDeactivation();
        }else{
            $this->consumerTranDeactivation();
        }
        $this->deactivateAdvance();
        $this->deactivateAdjustment();                
        $this->_Transaction->lock_status =  true;        
        $this->_Transaction->update();
    }

    public function chequeBounce(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }

        if($this->_Transaction->application_id){
            $this->applicationTranDeactivation();
        }else{
            $this->consumerTranDeactivation();
        }
        $this->deactivateAdvance();
        $this->deactivateAdjustment();
    }
}
