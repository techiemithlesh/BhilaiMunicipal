<?php

namespace App\Bll\Trade;

use App\Exceptions\CustomException;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeTransaction;

class TransactionDeactivationBll
{
    /**
     * Create a new class instance.
     */
    public $_REQUEST;
    public $_TranId;
    public $_TradeTransaction;
    public $_Transaction;
    public function __construct($tranId)
    {
        $this->_TranId= $tranId;
        $this->_TradeTransaction = new TradeTransaction();
        $this->_Transaction =  $this->_TradeTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->find($this->_TranId);
    }

    private function appTranDeactivation(){
        $app = ActiveTradeLicense::find($this->_Transaction->trade_license_id);
        if(!$app){
            $app = TradeLicense::find($this->_Transaction->trade_license_id);
        }
        if(!$this->_TradeTransaction->where("trade_license_id",$app->id)->where("id","<>",$this->_TranId)->where("lock_status",false)->count()){
            $app->payment_status = 0;            
        }
        $app->update();
    }

    public function deactivateTransaction(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }
        $this->appTranDeactivation();               
        $this->_Transaction->lock_status =  true;        
        $this->_Transaction->update();
    }

    public function chequeBounce(){
        if(!$this->_Transaction){
            throw new CustomException("Transaction Not Found");
        }
        $this->appTranDeactivation(); 
    }
}
