<?php

namespace App\Bll\Property;

use App\Exceptions\CustomException;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\AdditionalTax;
use App\Models\Property\AdjustmentDetail;
use App\Models\Property\AdvanceDetail;
use App\Models\Property\PenaltyDetail;
use App\Models\Property\PropertyCollection;
use App\Models\Property\PropertyDemand;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropTransaction;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafCollection;
use App\Models\Property\SafDemand;
use App\Models\Property\SafDetail;

class TransactionDeactivationBll
{
    /**
     * Create a new class instance.
     */
    public $_REQUEST;
    public $_TranId;
    public $_PropTransaction;
    public $_Transaction;

    public function __construct($tranId)
    {
        $this->_TranId= $tranId;
        $this->_PropTransaction = new PropTransaction();
        $this->_Transaction =  $this->_PropTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->find($this->_TranId);
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

    private function deactivateOtherPenaltyPaid(){
        $penalty = PenaltyDetail::where("lock_status",false)->where("paid_status",true)->where("transaction_id",$this->_TranId)->get();
        foreach($penalty as $p){
            $p->paid_status =  false;
            $p->transaction_id = null;
            $p->update();
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

    private function safTranDeactivation(){
        $saf = ActiveSafDetail::find($this->_Transaction->saf_detail_id);
        if(!$saf){
            $saf = SafDetail::find($this->_Transaction->saf_detail_id);
        }if(!$saf){
            $saf = RejectedSafDetail::find($this->_Transaction->saf_detail_id);
        }
        $collection = SafCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        foreach($collection as $coll){
            $demand = SafDemand::find($coll->saf_demand_id);
            $demand->balance_tax = $demand->balance_tax + $coll->total_tax;
            $demand->due_holding_tax = $demand->due_holding_tax + $coll->holding_tax;
            $demand->due_latrine_tax = $demand->due_latrine_tax + $coll->latrine_tax;
            $demand->due_water_tax = $demand->due_water_tax + $coll->water_tax;
            $demand->due_health_cess_tax = $demand->due_health_cess_tax + $coll->health_cess_tax;  
            $demand->due_education_cess_tax = $demand->due_education_cess_tax + $coll->education_cess_tax; 
            $demand->due_rwh_tax = $demand->due_rwh_tax + $coll->rwh_tax; 
            if($demand->balance_tax > 0 ){
                $demand->is_full_paid = false;
            }
            if(round($demand->balance_tax) == round($demand->total_tax)){
                $demand->paid_status = false;
            } 
            $demand->update();
            $coll->lock_status = true;
            $coll->update();
        }
        if(!$this->_PropTransaction->where("saf_detail_id",$saf->id)->where("id","<>",$this->_TranId)->where("lock_status",false)->count()){
            $saf->payment_status = 0;            
        }
        $saf->update();
    }

    private function propertyTranDeactivation(){
        $property = PropertyDetail::find($this->_Transaction->property_detail_id);
        $collection = PropertyCollection::where("lock_status",false)->where("transaction_id",$this->_TranId)->get();
        foreach($collection as $coll){
            $demand = PropertyDemand::find($coll->property_demand_id);
            $demand->balance_tax = $demand->balance_tax + $coll->total_tax;
            $demand->due_holding_tax = $demand->due_holding_tax + $coll->holding_tax;
            $demand->due_latrine_tax = $demand->due_latrine_tax + $coll->latrine_tax;
            $demand->due_water_tax = $demand->due_water_tax + $coll->water_tax;
            $demand->due_health_cess_tax = $demand->due_health_cess_tax + $coll->health_cess_tax;  
            $demand->due_education_cess_tax = $demand->due_education_cess_tax + $coll->education_cess_tax; 
            $demand->due_rwh_tax = $demand->due_rwh_tax + $coll->rwh_tax; 
            if($demand->balance_tax > 0 ){
                $demand->is_full_paid = false;
            }
            if(round($demand->balance_tax) == round($demand->total_tax)){
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
        if($this->_Transaction->saf_detail_id){
            $this->safTranDeactivation();
        }else{
            $this->propertyTranDeactivation();
        }
        $this->deactivateAdvance();
        $this->deactivateAdjustment();   
        $this->deactivateOtherPenaltyPaid();
        $this->deactivateAdditionalTaxPaid();             
        $this->_Transaction->lock_status =  true;        
        $this->_Transaction->update();
        
        $this->deactivateSwmTransaction();
    }

    public function deactivateSwmTransaction(){
        $swmTran = $this->_Transaction->getSwmTrans();
        foreach($swmTran as $tran){
            $obj = new SwmTransactionDeactivationBll($tran->id);
            $obj->deactivateTransaction();
        }
    }

    public function chequeBounce(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }

        if($this->_Transaction->saf_detail_id){
            $this->safTranDeactivation();
        }else{
            $this->propertyTranDeactivation();
        }
        $this->deactivateAdvance();
        $this->deactivateAdjustment();
        $this->deactivateOtherPenaltyPaid();
        $this->deactivateAdditionalTaxPaid();

        $this->deactivateSwmTransaction();
    }
}
