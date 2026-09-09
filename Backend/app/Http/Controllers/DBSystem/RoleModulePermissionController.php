<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\ModuleMaster;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbRolePermission;
use App\Models\DBSystem\UserRoleMap;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RoleModulePermissionController extends Controller
{
    //
    public $_currentDateTime;
    public $_redis;
    private $_modelUser;
    private $_modelUserRoleMap;
    private $_modelRoleTypeMstr;
    private $_modelUlbRolePermission;
    private $_modelModuleMaster;
    public function __construct()
    {
        $this->_currentDateTime = Carbon::now();
        $this->_modelUser = new User();
        $this->_modelUserRoleMap = new UserRoleMap();
        $this->_modelRoleTypeMstr = new RoleTypeMstr();
        $this->_modelUlbRolePermission = new UlbRolePermission();
        $this->_modelModuleMaster = new ModuleMaster();
    }

    public function index(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $request->ulbId??$user->ulb_id;
            $data = $this->_modelUlbRolePermission->readConnection()->select("ulb_role_permissions.*",DB::raw("role_type_mstrs.role_name,module_masters.module_name"))
                    ->join("module_masters","module_masters.id","ulb_role_permissions.module_id")
                    ->join("role_type_mstrs","role_type_mstrs.id","ulb_role_permissions.role_id");
            
            if($request->key){
                $data = $data->where(function($where) use($request){
                    $where->orWhere("role_type_mstrs.role_name","ILIKE","%".$request->key."%")
                    ->orWhere("module_masters.module_name","ILIKE","%".$request->key."%");
                });
            }
            if($ulbId){
                $data->where("ulb_role_permissions.ulb_id",$ulbId);
            }
            if($request->all){
                $data = $data->where("ulb_role_permissions.lock_status",false)->get();
                return responseMsg(true,"All Data List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("ulb_role_permissions.lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All Data List",camelCase(remove_null($data)));
            }
            $data->orderBy("ulb_role_permissions.role_id","ASC");
            $data = paginator($data,$request);
            return responseMsg(true,"Role Permission Fetched",camelCase(remove_null($data))); 
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function permissionDtl(Request $request){
        try{
            $rule=[
                "id"=>"required|integer|exists:".$this->_modelUlbRolePermission->getConnectionName().".".$this->_modelUlbRolePermission->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $data = $this->_modelUlbRolePermission->find($request->id);
            $role = $data->getRole()->first();
            $module = $data->getModule()->first();
            $ulb = $data->getUlb()->first();
            $data->role_name = $role?->role_name;
            $data->module_name = $module?->module_name;
            $data->short_name = $ulb?->short_name;
            $data->logo_img = $ulb?->logo_img ? url("/")."/".$ulb?->logo_img : null;
            return responseMsg(true,"Role Permission Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function store(Request $request)
    {
        try{
            $rule=[
                "moduleId"=>"required|integer|exists:".$this->_modelModuleMaster->getTable().",id",
                "roleId"=>"required|integer|exists:".$this->_modelRoleTypeMstr->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $ulbId = $user->ulb_id;
            $request->merge(["ulbId"=>$ulbId]);
            DB::beginTransaction();
            $permissionId = $this->_modelUlbRolePermission->store($request);  
            DB::commit();
            return responseMsg(true,"New Role Permission Map",["id"=>$permissionId]);
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function edit(Request $request)
    {
        try{
            $rule=[
                "id"=>"required|integer|exists:".$this->_modelUlbRolePermission->getTable().",id",
                "moduleId"=>"required|integer|exists:".$this->_modelModuleMaster->getTable().",id",
                "roleId"=>"required|integer|exists:".$this->_modelRoleTypeMstr->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $ulbId = $user->ulb_id;
            $request->merge(["ulbId"=>$ulbId]);
            $test = $this->_modelUlbRolePermission->where("id","<>",$request->id)->where("ulb_id",$request->ulbId)->where("role_id",$request->roleId)->where("module_id",$request->moduleId)->exists();
            if($test){
                throw new CustomException("This Role Permission Already Exist If Not Required Deactivate It.");
            }
            DB::beginTransaction();
            $permissionId = $this->_modelUlbRolePermission->edit($request);  
            DB::commit();
            return responseMsg(true,"Role Permission Map Update","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function lockUnlockPermission(Request $request){
        try{
            $rule=[
                "id"=>"required|integer|exists:".$this->_modelUlbRolePermission->getTable().",id",
                "lockStatus"=>"required|bool",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            DB::beginTransaction();
            $permissionId = $this->_modelUlbRolePermission->edit($request);  
            DB::commit();
            return responseMsg(true,"Role Permission Map Update","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getModuleList(Request $request){
        try{
            $data = $this->_modelModuleMaster->readConnection();
            
            if($request->key){
                $data = $data->where(function($where) use($request){
                    $where->orWhere("module_masters.module_name","ILIKE","%".$request->key."%");
                });
            }
            if($request->all){
                $data = $data->where("lock_status",false)->get();
                return responseMsg(true,"All Data List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All Data List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            return responseMsg(true,"Module Fetched",camelCase(remove_null($data))); 
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }
}
