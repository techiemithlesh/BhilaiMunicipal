<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\ModuleMaster;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\DBSystem\WorkflowUlbRoleMap;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WorkflowController extends Controller
{
    //
    private $_WorkflowMaster;
    private $_RoletypeMstr;
    private $_ModuleMaster;
    private $_WorkflowUlbRoleMap;

    function __construct()
    {
        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_RoletypeMstr = new RoleTypeMstr();
        $this->_ModuleMaster = new ModuleMaster();
        $this->_WorkflowUlbRoleMap = new WorkflowUlbRoleMap();
    }

    public function moduleList(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $user->ulb_id;
            $data = $this->_ModuleMaster;
            if($request->key){
                $data = $data->where(function($where) use($request){
                    $where->orWhere("module_name","ILIKE","%".$request->key."%");
                });
            }
            $data->orderBy("id","ASC");
            if($request->all){
                $data = $data->where("lock_status",false)->get();
                return responseMsg(true,"All Module List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All Module List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request); 
            return responseMsg(true,"Module Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function addModule(Request $request){
        try{
            $rules = [
                "moduleName"=>"required|unique:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",module_name",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }   
            $moduleId = $this->_ModuleMaster->store($request);
            $data = $this->_ModuleMaster->find($moduleId);            
            return responseMsg(true,"New Module Add",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function moduleDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_ModuleMaster->find($request->id);            
            return responseMsg(true,"Module Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function editModule(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",id",
                "moduleName"=>"required|unique:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",module_name," . $request->id,
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_ModuleMaster->edit($request);
            return responseMsg(true,"Module Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivateModule(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $this->_ModuleMaster->edit($request);
            return responseMsg(true,"Module Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    // Wf Master

    public function wfMasterList(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $user->ulb_id;
            $data = $this->_WorkflowMaster
                    ->select("workflow_masters.*","module_masters.module_name")
                    ->leftJoin("module_masters","module_masters.id","workflow_masters.module_id");
            if($request->key){
                $data = $data->where(function($where) use($request){
                    $where->orWhere("workflow_masters.workflow_name","ILIKE","%".$request->key."%")
                    ->orWhere("module_masters.module_name","ILIKE","%".$request->key."%");
                });
            }
            $data->orderBy("workflow_masters.module_id","ASC")
                ->orderBy("workflow_masters.id","ASC");
            if($request->all){
                $data = $data->where("workflow_masters.lock_status",false)->get();
                return responseMsg(true,"All WorkFlow List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("workflow_masters.lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All WorkFlow List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"] = collect($data["data"])->map(function($val)use($ulbId){ 
                $val->roles = $val->getWorkFlowRoles()->where("ulb_id",$ulbId)->orderBy("serial_no","ASC")->get()->map(function($val1){
                    $val1->role_name = $this->_RoletypeMstr->find($val1->role_id)->role_name??"";
                    $val1->forward_role_name = $this->_RoletypeMstr->find($val1->forward_role_id)->role_name??"";
                    $val1->backward_role_name = $this->_RoletypeMstr->find($val1->backward_role_id)->role_name??"";
                    return $val1;
                });
                return $val;
            }); 
            return responseMsg(true,"WorkFlows Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function addWfRoleMap(Request $request){
        try{
            $rules = [
                "moduleId"=>"required|integer|exists:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",id",
                "workflowName"=>"required|unique:".$this->_WorkflowMaster->getConnectionName().".".$this->_WorkflowMaster->getTable().",workflow_name",
                "roleMaps"=>"required|array",
                "roleMaps.*.roleId"=>"required|exists:".$this->_RoletypeMstr->getConnectionName().".".$this->_RoletypeMstr->getTable().",id",
                "roleMaps.*.forwardRoleId"=>"nullable|different:roleMaps.*.roleId|exists:".$this->_RoletypeMstr->getConnectionName().".".$this->_RoletypeMstr->getTable().",id",
                "roleMaps.*.backwardRoleId"=>"nullable|different:roleMaps.*.roleId,roleMaps.*.forwardRoleId|exists:".$this->_RoletypeMstr->getConnectionName().".".$this->_RoletypeMstr->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $roles = $request->roleMaps;
            DB::beginTransaction();
            $wfId = $this->_WorkflowMaster->store($request);
            foreach($roles as $val){
                $newRequest = new Request($val);
                $newRequest->merge(["ulbId"=>$user->ulb_id,"workflowId"=>$wfId]);
                $this->_WorkflowUlbRoleMap->store($newRequest);
            } 
            DB::commit();
            return responseMsg(true,"New Wf Role Map","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function editWfRoleMap(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_WorkflowMaster->getConnectionName().".".$this->_WorkflowMaster->getTable().",id",
                "moduleId"=>"required|integer|exists:".$this->_ModuleMaster->getConnectionName().".".$this->_ModuleMaster->getTable().",id",
                "workflowName"=>"required|unique:".$this->_WorkflowMaster->getConnectionName().".".$this->_WorkflowMaster->getTable().",workflow_name,".$request->id,
                "roleMaps"=>"required|array",
                "roleMaps.*.roleId"=>"required|exists:".$this->_RoletypeMstr->getConnectionName().".".$this->_RoletypeMstr->getTable().",id",
                "roleMaps.*.forwardRoleId"=>"nullable|different:roleMaps.*.roleId|exists:".$this->_RoletypeMstr->getConnectionName().".".$this->_RoletypeMstr->getTable().",id",
                "roleMaps.*.backwardRoleId"=>"nullable|different:roleMaps.*.roleId,roleMaps.*.forwardRoleId|exists:".$this->_RoletypeMstr->getConnectionName().".".$this->_RoletypeMstr->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $wfId = $request->id;
            $user = Auth()->user();
            $roles = $request->roleMaps;
            DB::beginTransaction();
            $this->_WorkflowUlbRoleMap->where("workflow_id",$wfId)->update(["lock_status"=>true]);
            $this->_WorkflowMaster->edit($request);
            foreach($roles as $val){
                $newRequest = new Request($val);
                $newRequest->merge(["ulbId"=>$user->ulb_id,"workflowId"=>$wfId]);
                if($test = $this->_WorkflowUlbRoleMap->where("workflow_id",$wfId)->where("role_id",$newRequest->roleId)->first()){
                    $newRequest->merge(["id"=>$test->id,"lockStatus"=>false]);
                    $this->_WorkflowUlbRoleMap->edit($newRequest);
                }else{
                    $this->_WorkflowUlbRoleMap->store($newRequest);
                }
            } 
            DB::commit();
            return responseMsg(true,"Wf Role Map Update","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function getWfMasterDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_WorkflowMaster->getConnectionName().".".$this->_WorkflowMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $ulbId = $user->ulb_id;
            $data =$this->_WorkflowMaster->find($request->id);
            $roles = $data->getWorkFlowRoles()->where("ulb_id",$ulbId);
            if($request->onlyInclude){
                $roles->where(function($where){
                    $where->where("can_forward",true)
                    ->orWhere("can_backward",true);
                });
            }
            $roles = $roles->orderBy("serial_no","ASC")->get();
            $roles = $roles->map(function($val){
                $val->role_name = $this->_RoletypeMstr->find($val->role_id)->role_name??"";
                return $val;
            });
            $data->roleMaps = $roles;
            return responseMsg(true,"Wf Role Map Dtl",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function activeDeactivateWorkflow(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_WorkflowMaster->getConnectionName().".".$this->_WorkflowMaster->getTable().",id",
                "lockStatus"=>"required|bool",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $this->_WorkflowMaster->edit($request);
            return responseMsg(true,"Wf Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }

    public function getWorkFlowInfo(Request $request){
        try{
            $user = Auth()->user();
            $rule = [
                "wfId"=>"required|exists:".$this->_WorkflowMaster->getConnectionName().".".$this->_WorkflowMaster->getTable().",id",
            ];
            $validation = Validator::make($request->all(),$rule);
            if($validation->fails()){                
                return validationError($validation);
            }
            $ulbId = $user->ulb_id ?? $request->ulbId;
            $workFlow = $this->_WorkflowMaster->find($request->wfId);
            $roles = $workFlow->getWorkFlowRoles()->where("ulb_id",$ulbId);
            if($request->onlyInclude){
                $roles->where(function($where){
                    $where->where("can_forward",true)
                    ->orWhere("can_backward",true);
                });
            }
            $roles = $roles->orderBy("serial_no","ASC")->get();
            $roles = $roles->map(function($val){
                $val->role_name = $this->_RoletypeMstr->find($val->role_id)->role_name??"";
                return $val;
            });
            return responseMsg(true,"wf Info Of ".$workFlow->workflow_name??"",camelCase(remove_null($roles)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getPermissionOnWorkFlow(Request $request){
        try{
            $response  = $this->getWorkFlowInfo($request);
            if(!$response->original["status"]){
                return $response;
            }
            $data = $response->original["data"];
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            $permission = $data->where("roleId",$role->id)->first();
            $roleName = $permission["roleName"]??"";
            $message = $response->original["message"]." For ".$roleName;
            return responseMsg(true,$message,camelCase(remove_null($permission)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }
}
