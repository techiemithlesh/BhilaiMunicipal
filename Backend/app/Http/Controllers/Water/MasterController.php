<?php

namespace App\Http\Controllers\Water;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Water\MeterTypeMaster;
use App\Models\Water\PropertyTypeMaster;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;



class MasterController extends Controller
{

    /**
     * Created By Mithlesh
     * Date 2026-09-28
     * Status : Open
     */

   private $_UlbWardMaster;
   private $_UlbMaster;
   private $_SYSTEM_CONST;
   private $_PropertyTypeMaster;
   private $_MeterTypeMaster;

    public function __construct()
    {
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_UlbMaster = new UlbMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_MeterTypeMaster = new MeterTypeMaster();
        $this->_SYSTEM_CONST = Config::get("SystemConstant");
    }


    public function getPropertyTypeList(){
        try{
            $propertyTypeList = $this->_PropertyTypeMaster->getPropertyTypeList();
            return responseMsg(true,"Property Type List",camelCase(remove_null($propertyTypeList)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function getMeterTypeList(){
        try{
            $data = $this->_MeterTypeMaster->where("lock_status",false)->get();
            return responseMsg(true,"Meter Type List",remove_null(camelCase($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

}
