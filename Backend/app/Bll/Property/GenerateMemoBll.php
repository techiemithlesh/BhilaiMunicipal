<?php

namespace App\Bll\Property;

use App\Models\Property\MemoDetail;
use App\Models\Property\PropertyDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GenerateMemoBll
{
    protected $_OSafApprovalBll;
    public $_SafId;
    public $_Saf;
    public $_PropId;
    public $_HoldingNo;
    public $_MemoType;
    public $_MemoDetail;
    public $_User;
    public $_MemoId;

    function __construct($safId,$memoType="")
    {
        $this->_SafId = $safId;
        $this->_MemoType = $memoType;
        $this->_User = Auth()->user();
        $this->_OSafApprovalBll = new SafApprovalBll($this->_SafId);
        $this->_MemoDetail = new MemoDetail();
    }

    public function generateMemo(){
        $isApply = false;
        if($this->_MemoType=="SAM" && $this->_MemoDetail->where("saf_detail_id",$this->_SafId)->count()<=0){
            $this->_OSafApprovalBll->generateSAM();    
            $isApply=true;        
        }
        elseif($this->_MemoType=="FAM"){            
            $this->_OSafApprovalBll->generateFAM();
            $isApply=true;
        }
        if($isApply){

            $this->_Saf = $this->_OSafApprovalBll->_SAF;
            $this->_PropId = $this->_OSafApprovalBll->_PropId;
            $this->_HoldingNo = $this->_OSafApprovalBll->_HoldingNo;
            $tax=$this->_Saf->getAllTaxDetail()->get();
            $tax = collect($tax);
            $lastTax = $tax->where("fyear",$tax->max("fyear"));
            $metaRequest = [
                "userId"=> $this->_User ? $this->_User->id : 0,
                "safDetailId"=>$this->_SafId,
                "wardMstrId"=>$this->_Saf->ward_mstr_id,
                "propertyDetailId"=>$this->_PropId,
                "holdingNo"=>$this->_HoldingNo,
                "memoType"=>$this->_MemoType,
                "fyear"=>$lastTax->max("fyear"),
                "qtr"=>$lastTax->max("qtr"),
                "arv"=>$lastTax->max("arv"),
                "quarterlyTax"=>$lastTax->max("quarterly_tax"),
            ];
            $request = new Request($metaRequest);
            $this->_MemoId = $this->_MemoDetail->store($request);
            $this->_Saf->prop_dtl_id=$this->_PropId;
            $this->_Saf->update();
        }
    }
}