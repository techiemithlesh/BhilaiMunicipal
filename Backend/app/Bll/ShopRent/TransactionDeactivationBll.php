<?php

namespace App\Bll\ShopRent;

use App\Exceptions\CustomException;
use App\Models\ShopRent\AdditionalTax;
use App\Models\ShopRent\AdjustmentDetail;
use App\Models\ShopRent\AdvanceDetail;
use App\Models\ShopRent\ShopCollection;
use App\Models\ShopRent\ShopDemand;
use App\Models\ShopRent\ShopTransaction;

class TransactionDeactivationBll
{
    
    public $_REQ;
    public $_TranId;
    public $_ShopTransaction;
    public $_Transaction;

    public function __construct($tranId)
    {
        $this->_TranId= $tranId;
        $this->_ShopTransaction = new ShopTransaction();
        $this->_Transaction =  $this->_ShopTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->find($this->_TranId);
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

    private function deactivateAdditionalTaxPaid(){
        $additionalTax = AdditionalTax::where("lock_status",false)->where("paid_status",true)->where("transaction_id",$this->_TranId)->get();
        foreach($additionalTax as $tax){
            $tax->paid_status =  false;
            $tax->transaction_id = null;
            $tax->update();
        }
    }

    private function consumerTranDeactivation(){
        $collection = ShopCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        foreach($collection as $coll){
            $demand = ShopDemand::find($coll->shop_demand_id);
            $demand->balance = $demand->balance + $coll->total_demand;
            $demand->due_amount = $demand->due_amount + $coll->amount;
            $demand->due_penalty = $demand->due_penalty + $coll->penalty;
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
        $this->deactivateAdditionalTaxPaid();                
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
        $this->deactivateAdditionalTaxPaid();
    }
}
