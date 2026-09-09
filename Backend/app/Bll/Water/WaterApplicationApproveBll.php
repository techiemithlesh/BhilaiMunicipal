<?php

namespace App\Bll\Water;

use App\Models\Water\Consumer;
use App\Models\Water\ConsumerOwner;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterApplicationFiledVerification;
use App\Models\Water\WaterApplicationOwner;
use App\Models\Water\WaterRejectedApplication;
use App\Models\Water\WaterRejectedApplicationOwner;
use App\Trait\Water\WaterTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WaterApplicationApproveBll
{
    use WaterTrait;
    /**
     * Create a new class instance.
     */
    public $_AppId;
    public $_ConsumerNo;
    public $_User;
    public $_Owners;
    public $_ConsumerId;
    
    private $_REQUEST;
    private $_Consumer;
    private $_ConsumerOwnerDetail;
    private $_WaterActiveApplication;
    private $_WaterApplicationFiledVerification;

    public function __construct($appid)
    {
        $this->_AppId = $appid;
        $this->_User = Auth::user();
        $this->_REQUEST = new Request();   
        $this->_Consumer = new Consumer();
        $this->_ConsumerOwnerDetail = new ConsumerOwner();
        $this->_WaterApplicationFiledVerification = new WaterApplicationFiledVerification();
        $this->loadParam();
    }

    private function loadParam(){
        $this->_WaterActiveApplication = WaterActiveApplication::find($this->_AppId);
        $this->_Owners = $this->_WaterActiveApplication->getAllOwners();
        $this->_ConsumerNo = $this->generateConsumerNo($this->_WaterActiveApplication->id);
    }

    private function generateConsumer(){
        $consumerRequest = new Request($this->_WaterActiveApplication->toArray());
        $verificationData = $this->_WaterApplicationFiledVerification->where("lock_status",false)
                            ->where("verified_by","Assistant Engineer")
                            ->orderBy("id","DESC")
                            ->first()
                            ->only(["connection_type_id","property_type_id","connection_through_id","category","pipeline_type_id","area_sqft"]);
        $consumerRequest->merge($verificationData);
        $consumerRequest->merge([
            "application_id"=>$this->_WaterActiveApplication->id,
            "connection_date"=>Carbon::now() ,
            "consumer_no"=>$this->_ConsumerNo,
        ]);
        $objConsumer = new Consumer();
        $objOwners = new ConsumerOwner();
        $this->_ConsumerId = $objConsumer->store($consumerRequest);
        foreach($this->_Owners->where("lock_status",false) as $val){
            $consumerOwnerRequest = new Request($val->toArray());
            $consumerOwnerRequest->merge([
                "application_owner_id"=>$val->id,
                "consumer_id"=>$this->_ConsumerId ,
            ]);
            $objOwners->store($consumerOwnerRequest);
        }
    }

    public function approveApplication(){
             
        $replicate = $this->_WaterActiveApplication->replicate();
        $replicate->id = $this->_WaterActiveApplication->id;
        $replicate->approved_date = Carbon::now() ;
        $replicate->approved_user_id = $this->_User->id ;
        $replicate->setTable((new WaterApplication())->getTable());
        $replicate->save();
        foreach($this->_Owners as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new WaterApplicationOwner())->getTable());
            $owner->save();
            $val->forceDelete();
        }         
        $this->_WaterActiveApplication->forceDelete();        
        $this->generateConsumer();
    }

    public function rejectApplication(){
        $replicate = $this->_WaterActiveApplication->replicate();
        $replicate->id = $this->_WaterActiveApplication->id;
        $replicate->approved_date = Carbon::now() ;
        $replicate->approved_user_id = $this->_User->id ;
        $replicate->setTable((new WaterRejectedApplication())->getTable());
        $replicate->save();
        $this->_WaterActiveApplication->forceDelete();
        foreach($this->_Owners as $val){
            $owner = $val->replicate();
            $owner->id = $val->id;
            $owner->setTable((new WaterRejectedApplicationOwner())->getTable());
            $owner->save();
            $val->forceDelete();
        }
    }
}
