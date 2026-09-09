<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\AddMenuRequest;
use App\Http\Requests\Common\AddUserMenuExcludeRequest;
use App\Http\Requests\Common\AddUserMenuRequest;
use App\Http\Requests\Common\UpdateMenuRequest;
use App\Http\Requests\Common\UpdateMobileMenuRequest;
use App\Http\Requests\Common\UpdateUserMenuExcludeRequest;
use App\Http\Requests\Common\UpdateUserMenuRequest;
use App\Http\Requests\Common\UpdateUserMobileMenuRequest;
use App\Models\DBSystem\MobileMenuMaster;
use App\Models\DBSystem\MobileRoleMenuMap;
use App\Models\DBSystem\MobileUserMenuExclude;
use App\Models\DBSystem\MobileUserMenuInclude;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\WebMenuMaster;
use App\Models\DBSystem\WebRoleMenuMap;
use App\Models\DBSystem\WebUserMenuExclude;
use App\Models\DBSystem\WebUserMenuInclude;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class MenuController extends Controller
{
    /**
     * ===============user for menu crud=================
     *          created by : Sandeep Bara
     *          Date       : 2024-07-21
                status     : open
                📖         : read data (read connection use)
                ✍️         : write data (write connection use)
     */

    private $_menuTreeIds=[];
    private $_modelUser;
    private $_modelRoleTypeMstr;
    private $_modelWebMenuMaster;
    private $_modelWebRoleMenuMap;
    private $_modelWebUserMenuInclude;
    private $_modelWebUserMenuExclude;

    private $_modelMobileMenuMaster;
    private $_modelMobileRoleMenuMap;
    private $_modelMobileUserMenuInclude;
    private $_modelMobileUserMenuExclude;

    public function __construct()
    {
        $this->_modelUser = new User();
        $this->_modelRoleTypeMstr = new RoleTypeMstr();
        $this->_modelWebMenuMaster = new WebMenuMaster();
        $this->_modelWebRoleMenuMap = new WebRoleMenuMap();
        $this->_modelWebUserMenuInclude = new WebUserMenuInclude();
        $this->_modelWebUserMenuExclude = new WebUserMenuExclude();

        $this->_modelMobileMenuMaster = new MobileMenuMaster();
        $this->_modelMobileRoleMenuMap = new MobileRoleMenuMap();
        $this->_modelMobileUserMenuInclude = new MobileUserMenuInclude();
        $this->_modelMobileUserMenuExclude = new MobileUserMenuExclude();
    }

    public function store(AddMenuRequest $request){
        try{
            $data["menuType"] = 2;
            if($request->url==""){
                $data["url"]="#";
            }
            if ($request->parentId==-1) {
                $data["menuType"] = 0;
            } else if ($request->parentId=="0") {
                $data["menuType"] = 0;
            } else if ($request->parentId!=0 && $request->subMenuId==0 && $request->url=="") {
                $data["menuType"] = 1;
            }
            if ($request->subMenuId!=0) {
                $data["parentId"] = $request->subMenuId;
            } else if ($request->subMenuId!=0) {
                $data["parentId"] = $request->parentId;
            }
            $request->merge($data);
            DB::beginTransaction();
            $menuId = $this->_modelWebMenuMaster->store($request);
            if(!$menuId){
                throw new CustomException("Some Error Occur On Menu Role Map");
            }
            $request->merge(["menuId"=>$menuId]);
            if($request->role){
                foreach($request->role as $val){
                    if(!($val["roleId"]??0)){
                        continue;
                    }
                    $val["menuId"]=$menuId;
                    $newRequest = new Request($val);
                    $this->_modelWebRoleMenuMap->store($newRequest);                    
                }
            }
            DB::commit();
            return responseMsg(true,"New Menu Added",["id"=>$menuId]);
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getMenuList(Request $request){
        try{
            $data = $this->_modelWebMenuMaster
                ->orderBy("id","ASC")
                ->orderBy("parent_id","ASC")
                ->orderBy("serial_no","ASC");
            if($request->mainMenuOnly){
                $data->where(function($where){
                    $where->whereIn("parent_id",[0,-1])
                    ->orWhere("url","#");
                });
            }
            if($request->all=="all"){
                $data= $data->get();
                return responseMsgs(true,"All Menu List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"] = collect($data["data"])->map(function($val){ 
                $menuTab = "";
                $parenId = $val->parent_id;
                while(true){
                    $parent = $this->_modelWebMenuMaster->find($parenId);
                    if(!$parent){
                        break;
                    }
                    $parenId = $parent->parent_id;
                    $menuTab.=("->").$parent->menu_name??"";
                }
                $menuTab = implode("->",array_reverse(explode("->",$menuTab)));
                $val->parent_menu= trim($menuTab,"->");     
                $val->role = collect($val->getRoleMenu()->where("web_role_menu_maps.lock_status",false)->get())->implode("role_name",",");
                return $val;
            });
            return responseMsg(true,"Menu List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getSubMenuList(Request $request){
        try{
            $result  = $this->_modelWebMenuMaster->subMenuOrm()->where("parent_id",$request->id)->get();            
            return responseMsgs(true,"subMenuList",camelCase(remove_null($result)));
        }catch(Exception $e){
            return responseMsgs(false,$e->getMessage(),"");
        }
    }

    public function showMenu(Request $request){
        try{
            $menu = $this->_modelWebMenuMaster->find($request->id);
            if(!$menu){
                throw new CustomException("Invalid Menu Id Pass");
            }
            $parentMenu = $this->_modelWebMenuMaster->where("id",$menu->parent_id)->first();
            while($parentMenu && !in_array($parentMenu->parent_id,[0,-1,1])){
                $parentMenu = $this->_modelWebMenuMaster->where("id",$parentMenu->parent_id)->first();
            }
            $menu->sub_menu_id = $parentMenu ? $menu->parent_id : 0;
            $menu->parent_id = $parentMenu ? $parentMenu->id : $menu->parent_id ;
            if($menu->sub_menu_id==$menu->parent_id){
                $menu->sub_menu_id=0;
            }
            $roleMapped = $menu->getRoleMenuWithPermission()->where("web_role_menu_maps.lock_status",false)->get();          
            $menu->role =$roleMapped;
            return responseMsg(true,"Menu Details",camelCase(remove_null($menu)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function editMenu(UpdateMenuRequest $request){
        try{
            $data["menuType"] = 2;
            if($request->url==""){
                $data["url"]="#";
            }
            if ($request->parentId==-1) {
                $data["menuType"] = 0;
            } else if ($request->parentId=="0") {
                $data["menuType"] = 0;
            } else if ($request->parentId!=0 && $request->subMenuId==0 && ($request->url==""||$request->url=="#")) {
                $data["menuType"] = 1;
            }
            if ($request->subMenuId!=0) {
                $data["parentId"] = $request->subMenuId;
            } else if ($request->subMenuId!=0) {
                $data["parentId"] = $request->parentId;
            }
            $request->merge($data);
            DB::beginTransaction();

            $test = $this->_modelWebMenuMaster->where(DB::raw("upper(url)"),Str::upper($request->url))
                    ->where(DB::raw("menu_name"),($request->menuName))
                    ->where(DB::raw("query_string"),($request->queryString))
                    ->where("parent_id",$request->parentId)
                    ->where("menu_type",$request->menuType)
                    ->where("id","<>",$request->id)
                    ->first();
            if($test){
                throw new CustomException("This Menu Already Exists");
            }
            $this->_modelWebMenuMaster->edit($request);
            $this->_modelWebRoleMenuMap->where("menu_id",$request->id)->update(["lock_status"=>true]);
            if($request->role){
                foreach($request->role as $val){
                    if(!($val["roleId"]??0)){
                        continue;
                    }
                    $val["menuId"]=$request->id;
                    $newRequest = new Request($val);
                    $this->_modelWebRoleMenuMap->store($newRequest);                    
                }
            }
            DB::commit();
            return responseMsg(true,"Menu Updated","");

        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function lockUnlockMenu(Request $request){
        try{
            $message = "Menu Lock Successfully";
            if(!$request->lockStatus){
                $message="Menu Un-Lock Successfully";
            }
            $menu = $this->_modelWebMenuMaster->edit($request);
            return responseMsg(true,$message,"");
        }catch(CustomException $e){
            return responseMsgs(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsgs(false,"Internal Server Error!!","");
        }
    }

    public function getUserIncludeExcludeList(Request $request){
        try{
            $rules = [
                "userId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUser->getConnectionName().".".$this->_modelUser->getTable().",id",
                "actionType"=>"required|in:EXCLUDE,INCLUDE"
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }

            $allMenu = collect($this->_modelWebMenuMaster->getMenuList());
            $user = $this->_modelUser->find($request->userId);
            $role = $user->getRoleDetailsByUserId()->get();
            $roleMenu = $permitted = collect();
            collect($role)->map(function($val)use($roleMenu){
                $menu = $val->getWedMenu()
                    ->where($this->_modelWebRoleMenuMap
                    ->getTable()."."."lock_status",false)
                    ->get();
                collect($menu)->map(function($m)use($roleMenu,$val){
                    $m->menu_id = $m->id;
                    $m->role = $val->role_name;
                    $roleMenu->push($m);
                });

            });
            $includeMenu = $user->getIncludeMenu()
                            ->where($this->_modelWebUserMenuInclude->getTable()."."."lock_status",false)
                            ->select(
                                $this->_modelWebMenuMaster->getTable()."."."*",
                                $this->_modelWebUserMenuInclude->getTable()."."."*"
                                )
                            ->get();
            
            $excludeMenu = $user->getExcludeMenu()
                            ->where($this->_modelWebUserMenuExclude->getTable()."."."lock_status",false)
                            ->select(
                                $this->_modelWebMenuMaster->getTable()."."."*",
                                $this->_modelWebUserMenuExclude->getTable()."."."*"
                                )
                            ->get();
            $permitted = collect($roleMenu)->map(function($val)use($includeMenu){
                if($test = $includeMenu->where("menu_id",$val->menu_id)->first()){
                    $val->description = $test->description;
                    $val->read = $test->read;
                    $val->write = $test->write;
                    $val->delete = $test->delete;
                    $val->update = $test->update;
                }
                return $val;
            });
            $extraMenu = $includeMenu->whereNotIn("menu_id",$permitted->pluck("menu_id"))->where("lock_status",false);
            collect($extraMenu)->map(function($val)use($permitted){
                $val->role = "";
                $permitted->push($val);
            });
            $permitted = $permitted->whereNotIn("menu_id",$excludeMenu->pluck("menu_id"))->where("lock_status",false);
            $data = collect();
            if($request->actionType=="INCLUDE"){
                $otherMenu = (collect($allMenu)->whereNotIn("id",$permitted->pluck("menu_id")));
                $data = $otherMenu->map(function($val){
                    $val->menu_id = $val->id;
                    return $val;
                })->values();
            }
            else{
                $data = $permitted->values();
            }
            return responseMsg(true,"Menu For ".Str::title($request->actionType),camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }


    public function userMenuInclude(AddUserMenuRequest $request){
        try{
            $userMenuId="";
            foreach($request->menus as $val){
                $newRequest = new Request($val);
                $newRequest->merge(["userId"=>$request->userId]);
                $userMenuId = $this->_modelWebUserMenuInclude->store($newRequest);
            }
            return responseMsg(true,"New Menu Include",["id"=>$userMenuId]);
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMenuIncludeEdit(UpdateUserMenuRequest $request){
        try{
            $test = $this->_modelWebUserMenuInclude
                    ->where("id","<>",$request->id)
                    ->where("menu_id",$request->menuId)
                    ->where("user_id",$request->userId)
                    ->first();
            if($test){
                $newRequest = new Request($request->all());
                $newRequest->merge(["id"=>$test->id,"lockStatus"=>false]);
                $this->_modelWebUserMenuInclude->edit($newRequest);                
                $request->merge(["lockStatus"=>true]);
            }
            $this->_modelWebUserMenuInclude->edit($request);
            return responseMsg(true,"Update Menu Include","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMenuExclude(AddUserMenuExcludeRequest $request){
        try{
            $userMenuId="";
            foreach($request->menus as $val){
                $newRequest = new Request($val);
                $newRequest->merge(["userId"=>$request->userId]);
                $userMenuId = $this->_modelWebUserMenuExclude->store($newRequest);
            }
            return responseMsg(true,"New Menu Excluded",["id"=>$userMenuId]);
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMenuExcludeEdit(UpdateUserMenuExcludeRequest $request){
        try{
            $test = $this->_modelWebUserMenuExclude
                    ->where("id","<>",$request->id)
                    ->where("menu_id",$request->menuId)
                    ->where("user_id",$request->userId)
                    ->first();
            if($test){
                $newRequest = new Request($request->all());
                $newRequest->merge(["id"=>$test->id,"lockStatus"=>false]);
                $this->_modelWebUserMenuExclude->edit($newRequest);                
                $request->merge(["lockStatus"=>true]);
            }
            $this->_modelWebUserMenuExclude->edit($request);
            return responseMsg(true,"Update Menu Excluded","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }


    #====== mobile menu======================

    public function storeMobile(AddMenuRequest $request){
        try{
            $data["menuType"] = 2;
            if($request->url==""){
                $data["url"]="#";
            }
            if ($request->parentId==-1) {
                $data["menuType"] = 0;
            } else if ($request->parentId=="0") {
                $data["menuType"] = 0;
            } else if ($request->parentId!=0 && $request->subMenuId==0 && $request->url=="") {
                $data["menuType"] = 1;
            }
            if ($request->subMenuId!=0) {
                $data["parentId"] = $request->subMenuId;
            } else if ($request->subMenuId!=0) {
                $data["parentId"] = $request->parentId;
            }
            $request->merge($data);
            DB::beginTransaction();
            $menuId = $this->_modelMobileMenuMaster->store($request);
            if(!$menuId){
                throw new CustomException("Some Error Occur On Menu Role Map");
            }
            $request->merge(["menuId"=>$menuId]);
            if($request->role){
                foreach($request->role as $val){
                    if(!($val["roleId"]??0)){
                        continue;
                    }
                    $val["menuId"]=$menuId;
                    $newRequest = new Request($val);
                    $this->_modelMobileRoleMenuMap->store($newRequest);                    
                }
            }
            DB::commit();
            return responseMsg(true,"New Mobile Menu Added",["id"=>$menuId]);
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getMobileMenuList(Request $request){
        try{
            $data = $this->_modelMobileMenuMaster
                ->orderBy("id","ASC")
                ->orderBy("parent_id","ASC")
                ->orderBy("serial_no","ASC");
            if($request->mainMenuOnly){
                $data->where(function($where){
                    $where->whereIn("parent_id",[0,-1])
                    ->orWhere("url","#");
                });
            }
            if($request->all=="all"){
                $data= $data->get();
                return responseMsgs(true,"All Mobile Menu List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"] = collect($data["data"])->map(function($val){ 
                $menuTab = "";
                $parenId = $val->parent_id;
                while(true){
                    $parent = $this->_modelMobileMenuMaster->find($parenId);
                    if(!$parent){
                        break;
                    }
                    $parenId = $parent->parent_id;
                    $menuTab.=("->").$parent->menu_name??"";
                }
                $menuTab = implode("->",array_reverse(explode("->",$menuTab)));
                $val->parent_menu= trim($menuTab,"->");     
                $val->role = collect($val->getRoleMenu()->where("mobile_role_menu_maps.lock_status",false)->get())->implode("role_name",",");
                return $val;
            });
            return responseMsg(true,"Mobile Menu List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getMobileSubMenuList(Request $request){
        try{
            $result  = $this->_modelMobileMenuMaster->subMenuOrm()->where("parent_id",$request->id)->get();            
            return responseMsgs(true,"subMenuList",camelCase(remove_null($result)));
        }catch(Exception $e){
            return responseMsgs(false,$e->getMessage(),"");
        }
    }

    public function showMobileMenu(Request $request){
        try{
            $menu = $this->_modelMobileMenuMaster->find($request->id);
            if(!$menu){
                throw new CustomException("Invalid Menu Id Pass");
            }
            $parentMenu = $this->_modelMobileMenuMaster->where("id",$menu->parent_id)->first();
            while($parentMenu && !in_array($parentMenu->parent_id,[0,-1,1])){
                $parentMenu = $this->_modelMobileMenuMaster->where("id",$parentMenu->parent_id)->first();
            }
            $menu->sub_menu_id = $parentMenu ? $menu->parent_id : 0;
            $menu->parent_id = $parentMenu ? $parentMenu->id : $menu->parent_id ;
            if($menu->sub_menu_id==$menu->parent_id){
                $menu->sub_menu_id=0;
            }
            $roleMapped = $menu->getRoleMenuWithPermission()->where("mobile_role_menu_maps.lock_status",false)->get();          
            $menu->role =$roleMapped;
            return responseMsg(true,"Mobile Menu Details",camelCase(remove_null($menu)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function editMobileMenu(UpdateMobileMenuRequest $request){
        try{
            $data["menuType"] = 2;
            if($request->url==""){
                $data["url"]="#";
            }
            if ($request->parentId==-1) {
                $data["menuType"] = 0;
            } else if ($request->parentId=="0") {
                $data["menuType"] = 0;
            } else if ($request->parentId!=0 && $request->subMenuId==0 && ($request->url==""||$request->url=="#")) {
                $data["menuType"] = 1;
            }
            if ($request->subMenuId!=0) {
                $data["parentId"] = $request->subMenuId;
            } else if ($request->subMenuId!=0) {
                $data["parentId"] = $request->parentId;
            }
            $request->merge($data);
            DB::beginTransaction();

            $test = $this->_modelMobileMenuMaster->where(DB::raw("upper(url)"),Str::upper($request->url))
                    ->where(DB::raw("menu_name"),($request->menuName))
                    ->where(DB::raw("query_string"),($request->queryString))
                    ->where("id","<>",$request->id)
                    ->first();
            if($test){
                throw new CustomException("This Mobile Menu Already Exists");
            }
            $this->_modelMobileMenuMaster->edit($request);
            $this->_modelMobileRoleMenuMap->where("menu_id",$request->id)->update(["lock_status"=>true]);
            if($request->role){
                foreach($request->role as $val){
                    if(!($val["roleId"]??0)){
                        continue;
                    }
                    $val["menuId"]=$request->id;
                    $newRequest = new Request($val);
                    $this->_modelMobileRoleMenuMap->store($newRequest);                    
                }
            }
            DB::commit();
            return responseMsg(true,"Mobile Menu Updated","");

        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function lockUnlockMobileMenu(Request $request){
        try{
            $message = "Mobile Menu Lock Successfully";
            if(!$request->lockStatus){
                $message="Mobile Menu Un-Lock Successfully";
            }
            $menu = $this->_modelMobileMenuMaster->edit($request);
            return responseMsg(true,$message,"");
        }catch(CustomException $e){
            return responseMsgs(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsgs(false,"Internal Server Error!!","");
        }
    }

    public function getMobileUserIncludeExcludeList(Request $request){
        try{
            $rules = [
                "userId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUser->getConnectionName().".".$this->_modelUser->getTable().",id",
                "actionType"=>"required|in:EXCLUDE,INCLUDE"
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }

            $allMenu = collect($this->_modelMobileMenuMaster->getMenuList());
            $user = $this->_modelUser->find($request->userId);
            $role = $user->getRoleDetailsByUserId()->get();
            $roleMenu = $permitted = collect();
            collect($role)->map(function($val)use($roleMenu){
                $menu = $val->getMobileMenu()
                    ->where($this->_modelMobileRoleMenuMap
                    ->getTable()."."."lock_status",false)
                    ->get();
                collect($menu)->map(function($m)use($roleMenu,$val){
                    $m->menu_id = $m->id;
                    $m->role = $val->role_name;
                    $roleMenu->push($m);
                });

            });
            $includeMenu = $user->getMobileIncludeMenu()
                            ->where($this->_modelMobileUserMenuInclude->getTable()."."."lock_status",false)
                            ->select(
                                $this->_modelMobileMenuMaster->getTable()."."."*",
                                $this->_modelMobileUserMenuInclude->getTable()."."."*"
                                )
                            ->get();
            
            $excludeMenu = $user->getMobileExcludeMenu()
                            ->where($this->_modelMobileUserMenuExclude->getTable()."."."lock_status",false)
                            ->select(
                                $this->_modelMobileMenuMaster->getTable()."."."*",
                                $this->_modelMobileUserMenuExclude->getTable()."."."*"
                                )
                            ->get();
            $permitted = collect($roleMenu)->map(function($val)use($includeMenu){
                if($test = $includeMenu->where("menu_id",$val->menu_id)->first()){
                    $val->description = $test->description;
                    $val->read = $test->read;
                    $val->write = $test->write;
                    $val->delete = $test->delete;
                    $val->update = $test->update;
                }
                return $val;
            });
            $extraMenu = $includeMenu->whereNotIn("menu_id",$permitted->pluck("menu_id"))->where("lock_status",false);
            collect($extraMenu)->map(function($val)use($permitted){
                $val->role = "";
                $permitted->push($val);
            });
            $permitted = $permitted->whereNotIn("menu_id",$excludeMenu->pluck("menu_id"))->where("lock_status",false);
            $data = collect();
            if($request->actionType=="INCLUDE"){
                $otherMenu = (collect($allMenu)->whereNotIn("id",$permitted->pluck("menu_id")));
                $data = $otherMenu->map(function($val){
                    $val->menu_id = $val->id;
                    return $val;
                })->values();
            }
            else{
                $data = $permitted->values();
            }
            return responseMsg(true,"Mobile Menu For ".Str::title($request->actionType),camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMobileMenuInclude(AddUserMenuRequest $request){
        try{
            $userMenuId="";
            foreach($request->menus as $val){
                $newRequest = new Request($val);
                $newRequest->merge(["userId"=>$request->userId]);
                $userMenuId = $this->_modelMobileUserMenuInclude->store($newRequest);
            }
            return responseMsg(true,"New Mobile Menu Include",["id"=>$userMenuId]);
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMobileMenuIncludeEdit(UpdateUserMobileMenuRequest $request){
        try{
            $test = $this->_modelMobileUserMenuInclude
                    ->where("id","<>",$request->id)
                    ->where("menu_id",$request->menuId)
                    ->where("user_id",$request->userId)
                    ->first();
            if($test){
                $newRequest = new Request($request->all());
                $newRequest->merge(["id"=>$test->id,"lockStatus"=>false]);
                $this->_modelMobileUserMenuInclude->edit($newRequest);                
                $request->merge(["lockStatus"=>true]);
            }
            $this->_modelMobileUserMenuInclude->edit($request);
            return responseMsg(true,"Update Mobile Menu Include","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMobileMenuExclude(AddUserMenuExcludeRequest $request){
        try{
            $userMenuId="";
            foreach($request->menus as $val){
                $newRequest = new Request($val);
                $newRequest->merge(["userId"=>$request->userId]);
                $userMenuId = $this->_modelMobileUserMenuExclude->store($newRequest);
            }
            return responseMsg(true,"New Mobile Menu Excluded",["id"=>$userMenuId]);
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userMobileMenuExcludeEdit(UpdateUserMenuExcludeRequest $request){
        try{
            $test = $this->_modelMobileUserMenuExclude
                    ->where("id","<>",$request->id)
                    ->where("menu_id",$request->menuId)
                    ->where("user_id",$request->userId)
                    ->first();
            if($test){
                $newRequest = new Request($request->all());
                $newRequest->merge(["id"=>$test->id,"lockStatus"=>false]);
                $this->_modelMobileUserMenuExclude->edit($newRequest);                
                $request->merge(["lockStatus"=>true]);
            }
            $this->_modelMobileUserMenuExclude->edit($request);
            return responseMsg(true,"Update Mobile Menu Excluded","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    #=====end mobile menu

    public function getWebUserMenu($userId){
        try{
            $menu = $this->getUserIncludeExcludeList(new Request(["userId"=>$userId,"actionType"=>"EXCLUDE"]));
            if(!$menu->original["status"]){
                throw new CustomException("Something went wrong");
            }
            $menu = $menu->original["data"];
            $menuTree = $this->generateMenuTree($menu);
            $permittedMenu = snakeCase($menu)->whereNotNull("parent_id")
                            ->sortBy(["parent_id","serial_no"])->values();
            $data=[
                "menuTree"=>$menuTree,
                "permittedMenu"=>$permittedMenu,
            ];
            return responseMsg(true,"Web Menu Tree",camelCase($data));
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getMobileUserMenu($userId){
       try{
            $menu = $this->getMobileUserIncludeExcludeList(new Request(["userId"=>$userId,"actionType"=>"EXCLUDE"]));
            if(!$menu->original["status"]){
                throw new CustomException("Something went wrong");
            }
            $menu = $menu->original["data"];
            $menuTree = $this->generateMenuTree($menu);
            $permittedMenu = snakeCase($menu)->whereNotNull("parent_id")
                            ->sortBy(["parent_id","serial_no"])->values();
            $data=[
                "menuTree"=>$menuTree,
                "permittedMenu"=>$permittedMenu,
            ];
            return responseMsg(true,"Mobile Menu Tree",camelCase($data));
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        } 
    }

    private function generateMenuTree($data,$parenId=0){
        $data = snakeCase($data); 
        // $useMenuIds = array_filter($this->_menuTreeIds,function($val) use($parenId){
        //     return $val!=$parenId;
        // }) ;            
        $parent = $data->where("parent_id",$parenId)
                ->whereNotNull("parent_id")
                // ->WhereNotIn("menu_id",$useMenuIds)
                ->sortBy(["parent_id","serial_no"]); 
              
        $tree =  $parent->map(function($val,$index)use($data){
            $this->_menuTreeIds[]=$val["menu_id"];
            if($val["menu_id"])
            return [
                "name"=>$val["menu_name"]??"",
                "url"=>$val["url"]??"",
                "query_string"=>$val["query_string"]??"",
                "icon"=>$val["icon"]??"",
                "description"=>$val["description"]??"",
                "menu_id"=>$val["menu_id"],
                "parent_id"=>$val["parent_id"],                
                "serial_no"=>$val["serial_no"],
                "children"=>$this->generateMenuTree($data,$val["menu_id"]),
            ];

        })->values(); 
        if($parenId==0){
            $extraMenu =($data->whereNotIn("menu_id",$this->_menuTreeIds));
            $extMenu = $extraMenu->map(function($val)use($extraMenu){
                $this->_menuTreeIds[]=$val["menu_id"];
                return[
                    "name"=>$val["menu_name"]??"",
                    "url"=>$val["url"]??"",
                    "query_string"=>$val["query_string"]??"",
                    "icon"=>$val["icon"]??"",
                    "description"=>$val["description"]??"",
                    "menu_id"=>$val["menu_id"],
                    "parent_id"=>$val["parent_id"],                
                    "serial_no"=>$val["serial_no"],
                    "children"=>$this->generateMenuTree($extraMenu,$val["menu_id"]),
                ];
            })->values();
            $tree=$tree->merge($extMenu);

            $itemsByReference = array();

            foreach ($tree as $key => &$item) {
                $itemsByReference[$item['menu_id']] = &$item;
            }
            foreach ($tree as $key => &$item) {
                if ($item['menu_id'] && isset($itemsByReference[$item['parent_id']])){
                    $itemsByReference[$item['parent_id']][] = &$item;
                }
    
                # to remove the external loop of the child node ie. not allowing the child node to create its own treee
                if ($item['parent_id'] && isset($itemsByReference[$item['parent_id']]))
                    unset($tree[$key]);
            }
        } 
        return $tree->values();
    }
}
