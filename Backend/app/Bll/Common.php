<?php

namespace App\Bll;

use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbRolePermission;
use App\Models\DBSystem\WorkflowUlbRoleMap;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class Common {
    protected $_WorkflowUlbRoleMap;
    protected $_UlbRolePermission;
    private $_WorkflowUlbRoleMapCashKey = "WorkflowUlbRoleMap";
    private $_UlbRolePermissionCashKey = "UlbRolePermission";
    function __construct()
    {
        $this->_WorkflowUlbRoleMap = new WorkflowUlbRoleMap();
        $this->_UlbRolePermission = new UlbRolePermission();
    }
    public function destroyCashing(int $ulbId, int $wfMaterId){
        $this->_WorkflowUlbRoleMapCashKey = $this->_WorkflowUlbRoleMapCashKey."_". $ulbId."_".$wfMaterId;
        $this->_UlbRolePermissionCashKey = $this->_UlbRolePermissionCashKey."_". $ulbId;
        Redis::del([$this->_WorkflowUlbRoleMapCashKey,$this->_UlbRolePermissionCashKey]);
    }
    public function getWorkFlowRoles(int $ulbId, int $wfMaterId)
    {
        $this->_WorkflowUlbRoleMapCashKey = $this->_WorkflowUlbRoleMapCashKey."_". $ulbId."_".$wfMaterId;        
        $workflow_rolse = json_decode(Redis::get($this->_WorkflowUlbRoleMapCashKey),true)??null;
        if (!$workflow_rolse) {
            $workflow_rolse = $this->_WorkflowUlbRoleMap->select(
                    DB::raw(
                        "workflow_ulb_role_maps.*,
                        role_type_mstrs.role_name,
                        backward_role.role_name as backward_role_name,
                        forward_role.role_name as forward_role_name"
                    )
                )
                ->join("role_type_mstrs", "role_type_mstrs.id","workflow_ulb_role_maps.role_id")
                ->leftJoin("role_type_mstrs as backward_role","backward_role.id","workflow_ulb_role_maps.backward_role_id")
                ->leftJoin("role_type_mstrs as forward_role", "forward_role.id", "workflow_ulb_role_maps.forward_role_id")
                ->where("workflow_ulb_role_maps.ulb_id", $ulbId)
                ->where("workflow_ulb_role_maps.workflow_id", $wfMaterId)
                ->where("workflow_ulb_role_maps.lock_status", false)
                ->where("role_type_mstrs.lock_status", false)
                ->orderBy("workflow_ulb_role_maps.serial_no","ASC")
                ->get();
                Redis::set($this->_WorkflowUlbRoleMapCashKey,$workflow_rolse);                     
                Redis::expire($this->_WorkflowUlbRoleMapCashKey, 18000); 
            $workflow_rolse = objToArray($workflow_rolse);
        }
        return $workflow_rolse;
    }

    public function getForwordBackwordRoll(int $ulb_id, int $wfMaterId, int $role_id)
    {
        $retuns = [];

        $workflow_rolse = $this->getWorkFlowRoles($ulb_id, $wfMaterId);
        $backwordForword = array_filter($workflow_rolse, function ($val) use ($role_id) {
            return $val['role_id'] == $role_id;
        });
        $backwordForword = array_values($backwordForword)[0] ?? [];
        if ($backwordForword) {
            $data = array_map(function ($val) use ($backwordForword) {
                if ($val['role_id'] == $backwordForword['forward_role_id']) {
                    return ['forward' => ['role_id' => $val['role_id'], 'role_name' => $val['role_name']]];
                }
                if ($val['role_id'] == $backwordForword['backward_role_id']) {
                    return ['backward' => ['role_id' => $val['role_id'], 'role_name' => $val['role_name']]];
                }
            }, $workflow_rolse);
            $data = array_filter($data, function ($val) {
                return is_array($val);
            });
            $data = array_values($data);

            $forward = array_map(function ($val) {
                return $val['forward'] ?? false;
            }, $data);

            $forward = array_filter($forward, function ($val) {
                return is_array($val);
            });
            $forward = array_values($forward)[0] ?? [];

            $backward = array_map(function ($val) {
                return $val['backward'] ?? false;
            }, $data);

            $backward = array_filter($backward, function ($val) {
                return is_array($val);
            });
            $backward = array_values($backward)[0] ?? [];
            $retuns["backward"] = $backward;
            $retuns["forward"] = $forward;
        }
        return $retuns;
    }

    public function getAllRoles(int $ulb_id, int $wfMaterId, int $role_id, $all = false)
    {
        $data = $this->getWorkFlowRoles($ulb_id, $wfMaterId);
        $curentUser = array_filter($data, function ($val) use ($role_id) {
            return $val['role_id'] == $role_id;
        });
        $curentUser = array_values($curentUser)[0] ?? [];
        if ($curentUser) {
            $data = array_filter($data, function ($val) use ($curentUser, $all) {
                if ($all) {
                    return (!in_array($val['role_id'], [$curentUser['forward_role_id'], $curentUser['backward_role_id']]) && $val['role_id'] != $curentUser['role_id'] && ($val['forward_id'] || $val['backward_id']));
                }
                return (!in_array($val['role_id'], [$curentUser['forward_role_id'], $curentUser['backward_role_id']]) && $val['role_id'] != $curentUser['role_id']);
            });
        }
        return (array_values($data));
        
    }

    
    public function getWorkFlowAllRoles(int $ulb_id, int $work_flow_id, $all = false)
    {
        $data = $this->getWorkFlowRoles($ulb_id, $work_flow_id);
        if ($all) {
            $data = array_filter($data, function ($val) {
                if (($val['forward_role_id']) || $val['backward_role_id']) {
                    return true;
                }
            });
            $data = array_values($data);
        }
        return ($data);
        
    }

    public function initiatorFinisher($ulb_id, $refWorkflowId) //array
    {
        $getWorkFlowRoles = $this->getWorkFlowRoles($ulb_id, $refWorkflowId);
        $initiator = array_filter($getWorkFlowRoles, function ($val) {
            return $val['is_initiator'] == true;
        });
        $initiator = (array_values($initiator)[0]) ?? array(null);
        $finisher = array_filter($getWorkFlowRoles, function ($val) {
            return $val['is_finisher'] == true;
        });
        $finisher = (array_values($finisher)[0]) ?? array(null);
        return ["initiator" => $initiator, "finisher" => $finisher];
        
    }

    public function getUserRoll(int $user_id)
    {
        $data = RoleTypeMstr::select(DB::raw("role_type_mstrs.*,user_role_maps.user_id"))
            ->join("user_role_maps","user_role_maps.role_id","=","role_type_mstrs.id")
            ->join("users", "users.id", "=", "user_role_maps.user_id")
            ->where("user_role_maps.lock_status", false)
            ->where("role_type_mstrs.lock_status", false)
            ->where("users.id", $user_id)
            ->first();
        return $data;        
    }    

    public function checkUsersWithtocken($tbl = "users")
    {
        $refUser   = Auth()->user();
        $tableName = $refUser ? $refUser->gettable() : "";
        if ($tableName != $tbl) {
            return false;
        }
        return true;
    }

    #=====================role Permission====================

    public function getUlbRolePermissions(int $ulbId) 
    {
        $this->_UlbRolePermissionCashKey = $this->_UlbRolePermissionCashKey."_". $ulbId;        
        $permissions = null;json_decode(Redis::get($this->_WorkflowUlbRoleMapCashKey),true)??null;
        if (!$permissions) {
            
            $permissions = $this->_UlbRolePermission->select(
                    DB::raw(
                        "ulb_role_permissions.*,
                        role_type_mstrs.role_name,
                        module_masters.module_name 
                        "
                    )
                )
                ->join("role_type_mstrs", "role_type_mstrs.id","ulb_role_permissions.role_id")
                ->join("module_masters", "module_masters.id", "ulb_role_permissions.module_id")
                ->where("ulb_role_permissions.ulb_id", $ulbId)
                ->where("ulb_role_permissions.lock_status", false)
                ->where("role_type_mstrs.lock_status", false)
                ->orderBy("ulb_role_permissions.id","ASC")
                ->get();
                Redis::set($this->_WorkflowUlbRoleMapCashKey,$permissions);                     
                Redis::expire($this->_WorkflowUlbRoleMapCashKey, 18000); 
            $permissions = objToArray($permissions);
        }
        return $permissions;
    }

    public function getRolePermissions(int $ulbId,int $roleId){
        $allPermission = $this->getUlbRolePermissions($ulbId);
        return collect($allPermission)->where("role_id",$roleId)->toArray();
    }

    public function getModuleWiseRolePermissions(int $ulbId,int $roleId,int $moduleId){
        $rollPermission = $this->getRolePermissions($ulbId,$roleId);
        return collect($rollPermission)->where("module_id",$moduleId)->toArray();
    }

}