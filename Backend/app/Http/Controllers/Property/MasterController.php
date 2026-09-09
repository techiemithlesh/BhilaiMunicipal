<?php

namespace App\Http\Controllers\Property;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\FloorMaster;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\RoadType;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\UsageTypeMaster;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MasterController extends Controller
{
    /**
     * Created By Sandeep
     * Date 2025-07-09
     * Status : Open
     */
    private $_UsageTypeMaster;
    private $_ConstructionTypeMaster;
    private $_OccupancyTypeMaster;
    private $_PropertyTypeMaster;
    private $_RoadType;
    private $_RoadTypeMaster;
    private $_FloorMaster;
    private $_OwnershipTypeMaster;
    private $_ApartmentDetail;
    private $_UlbWardMaster;
    private $_UlbMaster;
    private $_SYSTEM_CONST;

    function __construct()
    {   
        $this->_UsageTypeMaster = new UsageTypeMaster(); 
        $this->_ConstructionTypeMaster = new ConstructionTypeMaster();  
        $this->_OccupancyTypeMaster = new OccupancyTypeMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_RoadType = new RoadType();
        $this->_RoadTypeMaster = new RoadTypeMaster();
        $this->_FloorMaster = new FloorMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_ApartmentDetail = new ApartmentDetail();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_UlbMaster = new UlbMaster();    
        
        $this->_SYSTEM_CONST = Config::get("SystemConstant");
    }

     //usage type
    public function propUsageType(Request $request)
    {
        try{
            $list = $this->_UsageTypeMaster->select("*")->orderBy("id","ASC");
            $data = paginator($list,$request);
            return responseMsg(true,"Usage Type List",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
        
    }

    public function propUsageTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_UsageTypeMaster->find($request->id);            
            return responseMsg(true,"Usage Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropUsageType(Request $request){
        try{
            $rules = [
                "usageType"=>"required|unique:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",usage_type",
                "usageCode"=>"required|unique:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",usage_code",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_UsageTypeMaster->store($request);
            return responseMsg(true,"New Usage Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropUsageType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",id",
                "usageType"=>"required|unique:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",usage_type," . $request->id,
                "usageCode"=>"required|unique:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",usage_code," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_UsageTypeMaster->edit($request);
            return responseMsg(true,"Usage Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropUsageType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_UsageTypeMaster->getConnectionName().".".$this->_UsageTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_UsageTypeMaster->edit($request);
            return responseMsg(true,"Usage Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }


    //construction type
    public function propConstructionType(Request $request)
    {
        try{
            $list = $this->_ConstructionTypeMaster->select("*")->orderBy("id","ASC");
            $data = paginator($list,$request);
            return responseMsg(true,"Construction Type List",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
        
    }

    public function propConstructionTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ConstructionTypeMaster->getConnectionName().".".$this->_ConstructionTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_ConstructionTypeMaster->find($request->id);            
            return responseMsg(true,"Construction Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropConstructionType(Request $request){
        try{
            $rules = [
                "constructionType"=>"required|unique:".$this->_ConstructionTypeMaster->getConnectionName().".".$this->_ConstructionTypeMaster->getTable().",construction_type",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_ConstructionTypeMaster->store($request);
            return responseMsg(true,"New Construction Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropConstructionType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ConstructionTypeMaster->getConnectionName().".".$this->_ConstructionTypeMaster->getTable().",id",
                "constructionType"=>"required|unique:".$this->_ConstructionTypeMaster->getConnectionName().".".$this->_ConstructionTypeMaster->getTable().",construction_type," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_ConstructionTypeMaster->edit($request);
            return responseMsg(true,"Occupancy Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropConstructionType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ConstructionTypeMaster->getConnectionName().".".$this->_ConstructionTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_ConstructionTypeMaster->edit($request);
            return responseMsg(true,"Construction Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    //occupancy type
    public function propOccupancyType(Request $request)
    {
        try{
            $list = $this->_OccupancyTypeMaster->select("*")->orderBy("id","ASC");
            $data = paginator($list,$request);
            return responseMsg(true,"Occupancy Type List",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
        
    }

    public function propOccupancyTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_OccupancyTypeMaster->find($request->id);            
            return responseMsg(true,"Occupancy Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropOccupancyType(Request $request){
        try{
            $rules = [
                "occupancyName"=>"required|unique:".$this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable().",occupancy_name",
                "multFactor"=>"required|digit",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_OccupancyTypeMaster->store($request);
            return responseMsg(true,"New Occupancy Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropOccupancyType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable().",id",
                "occupancyName"=>"required|unique:".$this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable().",occupancy_name," . $request->id,
                "multFactor"=>"required|numeric",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_OccupancyTypeMaster->edit($request);
            return responseMsg(true,"Occupancy Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropOccupancyType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_OccupancyTypeMaster->getConnectionName().".".$this->_OccupancyTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_OccupancyTypeMaster->edit($request);
            return responseMsg(true,"Occupancy Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    //property type
    public function propPropertyType(Request $request)
    {
        try{
            $list = $this->_PropertyTypeMaster->select("*")->orderBy("id","ASC");
            $data = paginator($list,$request);
            return responseMsg(true,"Property Type List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function propPropertyTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_PropertyTypeMaster->find($request->id);            
            return responseMsg(true,"Property Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropPropertyType(Request $request){
        try{
            $rules = [
                "propertyType"=>"required|unique:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",property_type",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_PropertyTypeMaster->store($request);
            return responseMsg(true,"New Property Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropPropertyType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
                "propertyType"=>"required|unique:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",property_type," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_PropertyTypeMaster->edit($request);
            return responseMsg(true,"Property Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropPropertyType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_PropertyTypeMaster->edit($request);
            return responseMsg(true,"Property Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    //road type
    public function getRoadTypeMaster(Request $request){
        try{
            $list = $this->_RoadTypeMaster->select("*")->where("lock_status",false);
            if($request->all){
                $data = $list->get();
            }else{
                $data = paginator($list,$request);
            }
            return responseMsg(true,"Road Type List",camelCase(remove_null($data)));


        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }
    public function propRoadType(Request $request)
    {
        try{
            $list = $this->_RoadType->select("*")->orderBy("effective_from","ASC")->orderBy("from_width","ASC");
            $data = paginator($list,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $roadType = explode("(",$this->_RoadTypeMaster->find($val->road_type_id)->road_type??"");
                $val->roadType = trim($roadType[1]??$roadType[0],"()");
                return $val;
            });
            return responseMsg(true,"Road Type List",camelCase(remove_null($data)));


        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function propRoadTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_RoadTypeMaster->find($request->id);            
            return responseMsg(true,"Road Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropRoadType(Request $request){
        try{
            $rules = [
                "roadType"=>"required|unique:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",road_type",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_RoadTypeMaster->store($request);
            return responseMsg(true,"New Road Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropRoadType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",id",
                "roadType"=>"required|unique:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",road_type," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_RoadTypeMaster->edit($request);
            return responseMsg(true,"Road Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropRoadType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_RoadTypeMaster->edit($request);
            return responseMsg(true,"Road Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }
    
    //Floor type
    public function propFloorType(Request $request){
        try{
            $list = $this->_FloorMaster->select("*")->orderBy("id","ASC");
            $data = paginator($list,$request);
            return responseMsg(true,"Floor Type List",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function propFloorTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_FloorMaster->getConnectionName().".".$this->_FloorMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_FloorMaster->find($request->id);            
            return responseMsg(true,"Floor Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropFloorType(Request $request){
        try{
            $rules = [
                "floorName"=>"required|unique:".$this->_FloorMaster->getConnectionName().".".$this->_FloorMaster->getTable().",floor_name",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_FloorMaster->store($request);
            return responseMsg(true,"New Floor Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropFloorType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_FloorMaster->getConnectionName().".".$this->_FloorMaster->getTable().",id",
                "floorName"=>"required|unique:".$this->_FloorMaster->getConnectionName().".".$this->_FloorMaster->getTable().",floor_name," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_FloorMaster->edit($request);
            return responseMsg(true,"Floor Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropFloorType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_FloorMaster->getConnectionName().".".$this->_FloorMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_FloorMaster->edit($request);
            return responseMsg(true,"Floor Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    //Ownership type
    public function propOwnershipType(Request $request){
        try{
            $list = $this->_OwnershipTypeMaster->select("*")->orderBy("id","ASC");
            $data = paginator($list,$request);            
            return responseMsg(true,"Ownership Type List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    
    public function propOwnershipTypeDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_OwnershipTypeMaster->find($request->id);            
            return responseMsg(true,"Ownership Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropOwnershipType(Request $request){
        try{
            $rules = [
                "ownershipType"=>"required|unique:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",ownership_type",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_OwnershipTypeMaster->store($request);
            return responseMsg(true,"New Ownership Type Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropOwnershipType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",id",
                "ownershipType"=>"required|unique:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",ownership_type," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_OwnershipTypeMaster->edit($request);
            return responseMsg(true,"Ownership Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropOwnershipType(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_OwnershipTypeMaster->getConnectionName().".".$this->_OwnershipTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_OwnershipTypeMaster->edit($request);
            return responseMsg(true,"Ownership Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    //Apartment
    public function propApartmentList(Request $request){
        try{
            
            $user = Auth::user();
            $list = $this->_ApartmentDetail
                ->select("apartment_details.*","ulb_ward_masters.ward_no","ulb_masters.ulb_name","ulb_masters.logo_img")
                ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","apartment_details.ward_mstr_id")
                ->leftJoin("ulb_masters","ulb_masters.id","apartment_details.ulb_id")
                ->where("apartment_details.ulb_id",$user->ulb_id)
                ->orderBy("apartment_details.ward_mstr_id","ASC")
                ->orderBy("apartment_details.id","ASC");
            $data = paginator($list,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $val->apartment_image = $val->apartment_image ? url("/documents")."/".$val->apartment_image :"";
                $val->water_harvesting_image = $val->water_harvesting_image ? url("/documents")."/".$val->water_harvesting_image :"";
                $val->logo_img = $val->logo_img ? url("/")."/".$val->logo_img :"";
                return $val;
            });
            
            return responseMsg(true,"Apartment List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function propApartmentDtl(Request $request){
        try{            
            $rules = [
                "id"=>"required|integer|exists:".$this->_ApartmentDetail->getConnectionName().".".$this->_ApartmentDetail->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_ApartmentDetail->find($request->id);
            $data->ward_no   = $this->_UlbWardMaster->find($data->ward_mstr_id)->ward_no??"";
            $data->ulb_name   = $this->_UlbMaster->find($data->ulb_id)->ulb_name??"";
            $data->apartment_image = $data->apartment_image ? url("/documents")."/".$data->apartment_image : null;
            $data->water_harvesting_image = $data->water_harvesting_image ? url("/documents")."/".$data->water_harvesting_image : null;           
            return responseMsg(true,"Apartment Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function addPropApartment(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $user->ulb_id;
            $request->merge([
                "ulbId"=>$ulbId,
                "userId"=>$user->id,
                'hasBlocks' => filter_var($request->hasBlocks, FILTER_VALIDATE_BOOLEAN),
                'isWaterHarvesting' => filter_var($request->isWaterHarvesting, FILTER_VALIDATE_BOOLEAN),
            ]);
            $rules = [
                "wardMstrId"=>"required|integer|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id,ulb_id,$ulbId",
                // "roadWidth"=>"required|numeric|min:1",
                "roadTypeMstrId"=>"required|integer|exists:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",id",
                "aptCode" => "required|string|unique:" .$this->_ApartmentDetail->getConnectionName() . "." .$this->_ApartmentDetail->getTable() .",apt_code,NULL,id,ulb_id,$ulbId",
                "apartmentName"=>"required|string",
                "apartmentAddress"=>"required|string",
                "hasBlocks"=>"required|boolean",
                "noOfBlock"=>"nullable|required_if:hasBlocks,true|integer",
                "isWaterHarvesting"=>"required|boolean",
                "waterHarvestingDate"=>"nullable|required_if:isWaterHarvesting,true|date|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "waterHarvestingImageDoc"=>[
                    "required_if:isWaterHarvesting,true",
                    "mimes:bmp,jpeg,jpg,png",
                    function ($attribute, $value, $fail) {
                        if($value instanceof UploadedFile){
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },
                ],
                "apartmentImageDoc"=>[
                    "required",
                    "mimes:bmp,jpeg,jpg,png",
                    function ($attribute, $value, $fail) {
                        if($value instanceof UploadedFile){
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },

                ]
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $imageName = "apartment_".app('requestToken')."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->apartmentImageDoc->getClientOriginalExtension(); 
            $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["APARTMENT_DOC"];
            // $request->apartmentImageDoc->move($relativePath, $imageName);
            $path = $request->apartmentImageDoc->storeAs($relativePath,$imageName, $this->disk);
            $request->merge([
                "apartmentImage"=>$path,
            ]);

            if($request->waterHarvestingImageDoc){
                $imageName = "waterHarvesting_".app('requestToken')."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->waterHarvestingImageDoc->getClientOriginalExtension(); 
                $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["APARTMENT_DOC"];
                // $request->waterHarvestingImageDoc->move($relativePath, $imageName);
                $path = $request->waterHarvestingImageDoc->storeAs($relativePath,$imageName, $this->disk);
                $request->merge([
                    "waterHarvestingImage"=>$path,
                ]); 
            }
            
            $this->_ApartmentDetail->store($request);
            return responseMsg(true,"New Apartment Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!","");
        }
    }

    public function editPropApartment(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $user->ulb_id;
            $request->merge([
                "ulbId"=>$ulbId,
                "userId"=>$user->id,                
                'hasBlocks' => filter_var($request->hasBlocks, FILTER_VALIDATE_BOOLEAN),
                'isWaterHarvesting' => filter_var($request->isWaterHarvesting, FILTER_VALIDATE_BOOLEAN),
            ]);
            $rules = [
                "id"=>"required|integer|exists:".$this->_ApartmentDetail->getConnectionName().".".$this->_ApartmentDetail->getTable().",id",
                "wardMstrId"=>"required|integer|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id,ulb_id,$ulbId",
                "roadTypeMstrId"=>"required|integer|exists:".$this->_RoadTypeMaster->getConnectionName().".".$this->_RoadTypeMaster->getTable().",id",
                "aptCode"=>"required|unique:".$this->_ApartmentDetail->getConnectionName().".".$this->_ApartmentDetail->getTable().",apt_code,".$request->id.",id,ulb_id,$ulbId",
                "apartmentName"=>"required|string",
                "apartmentAddress"=>"required|string",
                "hasBlocks"=>"required|boolean",
                "noOfBlock"=>"nullable|required_if:hasBlocks,true|integer",
                "isWaterHarvesting"=>"required|boolean",
                "waterHarvestingDate"=>"nullable|required_if:isWaterHarvesting,true|date|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "waterHarvestingImageDoc" => [
                    function ($attribute, $value, $fail) use ($request) {
                        // Apply only if isWaterHarvesting is true
                        if ($request->isWaterHarvesting) {
                            // Check if water harvesting image exists in DB
                            $existing = $this->_ApartmentDetail
                                ->where('id', $request->id)
                                ->whereNotNull('water_harvesting_image') // adjust this column name
                                ->exists();

                            // If not exists and no file uploaded
                            if (!$existing && !$value instanceof UploadedFile) {
                                $fail("The $attribute is required.");
                            }
                        }
                    },
                    "mimes:bmp,jpeg,jpg,png",
                    function ($attribute, $value, $fail) {
                        if ($value instanceof UploadedFile) {
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024;
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },
                ],

                "apartmentImageDoc" => [
                    function ($attribute, $value, $fail) use ($request) {
                        // Check if image exists in DB for the given apartment ID
                        $existing = $this->_ApartmentDetail
                            ->where('id', $request->id)
                            ->whereNotNull('apartment_image') // adjust column name as per DB
                            ->exists();

                        // If not exists and no file uploaded
                        if (!$existing && !$value instanceof UploadedFile) {
                            $fail("The $attribute is required.");
                        }
                    },
                    "mimes:bmp,jpeg,jpg,png",
                    function ($attribute, $value, $fail) {
                        if ($value instanceof UploadedFile) {
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },
                ],

            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }  
            $apartment = $this->_ApartmentDetail->find($request->id);
            if($request->apartmentImageDoc){
                $imageName = "apartment_".app('requestToken')."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->apartmentImageDoc->getClientOriginalExtension(); 
                $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["APARTMENT_DOC"];
                // $request->apartmentImageDoc->move($relativePath, $imageName);
                $path = $request->apartmentImageDoc->storeAs($relativePath,$imageName, $this->disk);
                $request->merge([
                    "apartmentImage"=>$path,
                ]);
            }else{
                $request->merge([
                    "apartmentImage"=>$apartment->apartment_image,
                ]);
            }

            if($request->waterHarvestingImageDoc){
                $imageName = "waterHarvesting_".app('requestToken')."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->waterHarvestingImageDoc->getClientOriginalExtension(); 
                $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["APARTMENT_DOC"];
                // $request->waterHarvestingImageDoc->move($relativePath, $imageName);
                $path = $request->apartmentImageDoc->storeAs($relativePath,$imageName, $this->disk);
                $request->merge([
                    "waterHarvestingImage"=>$path,
                ]); 
            }else{
                $request->merge([
                    "waterHarvestingImage"=>$apartment->water_harvesting_image,
                ]);
            }
            $this->_ApartmentDetail->edit($request);
            return responseMsg(true,"Apartment Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivatePropApartment(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ApartmentDetail->getConnectionName().".".$this->_ApartmentDetail->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_ApartmentDetail->edit($request);
            return responseMsg(true,"Apartment Type Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

}
