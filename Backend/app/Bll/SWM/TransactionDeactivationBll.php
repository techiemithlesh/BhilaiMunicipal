<?php

namespace App\Bll\SWM;

use App\Exceptions\CustomException;
use App\Models\SWM\AdjustmentDetail;
use App\Models\SWM\AdvanceDetail;
use App\Models\SWM\ConnectionChargeCollection;
use App\Models\SWM\ConsumerDemand;
use App\Models\SWM\ConsumerDemandsCollection;
use App\Models\SWM\ConsumerTransaction;

class TransactionDeactivationBll
{
    /**
     * Create a new class instance.
     */
    public $_REQUEST;
    public $_TranId;
    public $_ConsumerTransaction;
    public $_Transaction;

    public function __construct($tranId)
    {
        $this->_TranId= $tranId;
        $this->_ConsumerTransaction = new ConsumerTransaction();
        $this->_Transaction =  $this->_ConsumerTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->find($this->_TranId);
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
        $this->consumerTranDeactivation();
        $this->deactivateAdvance();
        $this->deactivateAdjustment();                
        $this->_Transaction->lock_status =  true;        
        $this->_Transaction->update();
    }

    public function chequeBounce(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }
        $this->consumerTranDeactivation();
        $this->deactivateAdvance();
        $this->deactivateAdjustment();
    }
}
