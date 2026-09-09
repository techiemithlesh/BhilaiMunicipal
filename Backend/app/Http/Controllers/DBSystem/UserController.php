<?php

namespace App\Http\Controllers\DBSystem;

use App\Http\Controllers\Controller;
use App\Exceptions\CustomException;
use App\Http\Requests\Common\AddUserRequest;
use App\Http\Requests\Common\LoginUserUpdateRequest;
use App\Http\Requests\Common\UpdateUserRequest;
use App\Models\DBSystem\RoleHierarchy;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbOfficer;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\UserRoleMap;
use App\Models\DBSystem\UserWardPermission;
use App\Models\User;
use App\Pipelines\User\SearchByEmail;
use App\Pipelines\User\SearchByUserName;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     *       created by: Sandeep Bara
     *       Date       : 2024-07-12
             status     : close
            📖         : read data (read connection use)
            ✍️          : write data (write connection use)
     */

    public $_currentDateTime;
    public $_redis;
    private $_modelUser;
    private $_modelUserRoleMap;
    private $_modelRoleTypeMstr;
    private $_modelUlbWardMaster;
    private $_modelUserWardPermission;
    private $_modelRoleHierarchy;
    private $_modelUlbOfficer;

    private $_menuController;    
    private $_mobileRoleArray;
    public function __construct()
    {
        $this->_currentDateTime = Carbon::now();
        $this->_modelUser = new User();
        $this->_modelUserRoleMap = new UserRoleMap();
        $this->_modelRoleTypeMstr = new RoleTypeMstr();
        $this->_modelUlbWardMaster = new UlbWardMaster();
        $this->_modelUserWardPermission = new UserWardPermission();
        $this->_modelRoleHierarchy = new RoleHierarchy();
        $this->_modelUlbOfficer = new UlbOfficer();
        
        $this->_menuController = new MenuController();
        $this->_mobileRoleArray = Config::get("SystemConstant.MOBILE-ROLE");

    }
    /**=============📖get All user List📖================
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        try{
            $user = Auth()->user();
            $ulbId = $request->ulbId??$user->ulb_id;            
            $data = $this->_modelUser->select("users.*",DB::raw("user_role.role_name,user_role.role_id"))
                    ->leftJoin(DB::raw("(
                        select user_role_maps.user_id,role_type_mstrs.role_name,user_role_maps.role_id
                        from user_role_maps
                        join role_type_mstrs on role_type_mstrs.id = user_role_maps.role_id
                        where user_role_maps.lock_status = false
                    )as user_role"),"user_role.user_id","users.id");
            if($request->userFor){
                $data = $data->where("users.user_for",Str::upper($request->userFor));
            }
            if($request->onlyMobileRole){
                $data->whereIn("user_role.role_id",$this->_mobileRoleArray);
            }
            if($request->key){
                $data = $data->where(function($where) use($request){
                    $where->orWhere("users.name","ILIKE","%".$request->key."%")
                    ->orWhere("users.email","ILIKE","%".$request->key."%")
                    ->orWhere("users.user_name","ILIKE","%".$request->key."%")
                    ->orWhere("users.employee_code","ILIKE","%".$request->key."%");
                });
            }
            if($ulbId){
                $data->where("users.ulb_id",$ulbId);
            }
            if($request->all){
                $data = $data->where("users.lock_status",false)->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("users.lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $val->user_img = $val->user_img ? url("/")."/".$val->user_img : null;
                $val->signature_img = $val->signature_img ? url("/")."/".$val->signature_img : null;                
                return $val;
            });
            return responseMsg(true,"User Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**=============✍️ create new user ✍️================
     * Store a newly created resource in storage.
     */
    public function store(AddUserRequest $request)
    {
        //
        try{
            $user = Auth()->user();
            // if(!$user->can_switch_multi_ulb){
            //     $request->merge(["ulb_id",$user->ulb_id]);
            // }
            DB::beginTransaction();
            $userId = $this->_modelUser->store($request);
            $request->merge(["userId"=>$userId,"id"=>$userId]);
            $this->_modelUserRoleMap->store($request);
            foreach($request->wardIds as $val){
                $newRequest = new Request(["wardMstrId"=>$val,"userId"=>$userId,"createdByUserId"=>$user->id]);
                $this->_modelUserWardPermission->store($newRequest);
            }
            $this->uploadDoc($request);  
            DB::commit();
            return responseMsg(true,"New User Created",["id"=>$userId]);
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }
    /**=============📖✍️ update the user ✍️📖================
     * Update the specified resource in storage.
     */
    public function update(AddUserRequest $request){
        //
        try{
            $user = Auth()->user();
            // if(!$user->can_switch_multi_ulb){
            //     $request->merge(["ulb_id",$user->ulb_id]);
            // }
            DB::beginTransaction();
            $userId = $request->id;
            $this->_modelUser->edit($request);
            $request->merge(["userId"=>$userId,"id"=>$userId]);
            $lastRole = $this->_modelUserRoleMap->where("user_id",$userId)->where("lock_status",false)->first();
            if($lastRole){
                $request->merge(["id"=>$lastRole->id]);
                $this->_modelUserRoleMap->edit($request);
            }else{
                $this->_modelUserRoleMap->store($request);
            }
            $this->_modelUserWardPermission->where("user_id",$userId)->update(["lock_status"=>true]);
            foreach($request->wardIds as $val){
                $newRequest = new Request(["wardMstrId"=>$val,"userId"=>$userId,"createdByUserId"=>$user->id]);
                $this->_modelUserWardPermission->store($newRequest);
            }
            $request->merge(["id"=>$userId]);
            $this->uploadDoc($request); 
            DB::commit();
            return responseMsg(true,"User Updated",["id"=>$userId]);
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function loginUsers(Request $request){
        try{
            // 1. Determine which user we are looking at (Auth user or specified ID)
            $userId = $request->id ?? auth()->user()->id;
            $muser = $this->_modelUser->find($userId);

            if (!$muser) {
                return responseMsg(false, "User not found", "");
            }

            // 2. Get active tokens/sessions
            // Assuming you are using Laravel Sanctum or Passport
            $activeTokens = $muser->tokens->map(function ($token) {                
                return [
                    'id' => $token->id,
                    "last_used_at"=>$token->last_used_at,
                    "login_type"=>$token->login_type,
                    "latitude"=>$token->latitude,
                    "longitude"=>$token->longitude,
                    'machine' => $token->machine,
                    'name' => $token->browser_name, // Usually the device name (e.g., "iPhone", "Chrome")
                    'lastLogin' => $token->created_at->diffForHumans(),
                    'ip_address' => $token->ip, // Optional: if you store IP in abilities or metadata
                    'is_current' => auth()->user()->currentAccessToken()->id === $token->id
                ];
            })->values();

            // 3. Return the data formatted for your React Component
            return responseMsg(
                true, 
                "Logged in users/sessions retrieved successfully", 
                $activeTokens
            );
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function updateLoginUserProfile($id,LoginUserUpdateRequest $request){
        try{
            $request->merge(["id"=>$id]);
            $this->_modelUser->edit($request);
            $this->uploadDoc($request); 
            return responseMsg(true,"Update the Profile","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function uploadDoc(Request $request){
        try{
            $userId = $request->id;
            $user = $this->_modelUser->find($request->id);
            if($request->userImgDoc){
                $relativePath = "user/img";
                $imageName = $userId.".".$request->userImgDoc->getClientOriginalExtension();
                $filePath = public_path( $user->user_img);
                if (file_exists($filePath)) {
                    // Delete the file
                    @unlink($filePath);
                }
                $request->userImgDoc->move($relativePath, $imageName);
                $request->merge(["userImg"=>$relativePath."/".$imageName]);
            }
            if($request->signatureImgDoc){
                $relativePath = "user/signature";
                $imageName = $userId.".".$request->signatureImgDoc->getClientOriginalExtension();
                $filePath = public_path( $user->signature_img);
                if (file_exists($filePath)) {
                    // Delete the file
                    @unlink($filePath);
                }
                $request->signatureImgDoc->move($relativePath, $imageName);
                $request->merge(["signatureImg"=>$relativePath."/".$imageName]);
            }
            $user->user_img = $request->userImg ? $request->userImg : $user->user_img;
            $user->signature_img = $request->signatureImg ? $request->signatureImg : $user->signature_img;            
            $user->update();
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /**=============📖 get the user by id 📖================
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try{
            $data = $this->_modelUser->find($id);
            if(!$data){
                throw new CustomException("Invalid Id");
            }
            $role = $data->getRoleDetailsByUserId()->first();
            $data->role_id = $role? $role->id:null;
            $data->user_img = $data->user_img ? url("/")."/".$data->user_img : null;
            $data->signature_img = $data->signature_img ? url("/")."/".$data->signature_img : null;
            return responseMsg(true,"Use Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }

    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**=============📖✍️ update the user lock_status ✍️📖================
     * 
     */
    public function userLockUnlock($id,Request $request){
        try{
            $user= $this->_modelUser->find($id);
            DB::beginTransaction();
            $user->lock_status = $request->lockStatus?true:false;
            if($user->lock_status){
                foreach($user->tokens->sortBy("id")->values() as  $key =>$token){  
                    $token->expires_at = Carbon::now();
                    $token->update();
                    $token->forceDelete();
                }
            }
            $user->update();
            DB::commit();
            return responseMsg(true,"User Update","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /**=============📖✍️ update the user ✍️📖================
     * Update the specified resource in storage.
     */
    public function updateOld(UpdateUserRequest $request)
    {
       
        try{
            DB::beginTransaction();
            if(!$this->_modelUser->edit($request)){
                throw new CustomException("Data Not Updated");
            }
            $this->uploadDoc($request);  
            DB::commit();
            return responseMsg(true,"User Updated Successfully","");

        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /**=============📖✍️ update the user ✍️📖================
     * lock_status=true
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        try{
            $request = new Request(["id"=>$id,"lockStatus"=>true]);
            $user = $this->_modelUser->find($request->id);
            if(!$user){
                throw new CustomException("Invalid UserId Pass");
            }
            $user->lock_status = $request->lockStatus;
            DB::beginTransaction();
            $user->update();
            DB::commit();
            return responseMsg(true,"User Suspended Successfully","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /**=============📖✍️ update the user ✍️📖================
     * hash the user password
     * | For Hashing Password
     */
    public function hashPassword()
    {
        try{
            $datas =  $this->_modelUser::select('id', 'password', "old_pass")
                ->whereNull('password')
                ->whereNotNull('old_pass')
                ->orderby('id')
                ->get();
            DB::beginTransaction();
            foreach ($datas as $data) {
                $user = User::find($data->id);     
                $user->password = Hash::make($data->old_pass);
                $user->update();
                
            }
            DB::commit();
            return responseMsg(true,"All user Passwords Hash","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function resetPassword($id,Request $request){
        try{
            $user = $this->_modelUser->find($id);
            $user->password = Hash::make("123456");
            $user->update();
            foreach($user->tokens->sortBy("id")->values() as  $key =>$token){
                $token->expires_at = Carbon::now();
                $token->update();
                $token->forceDelete();
            }
            return responseMsg(true,"Reset The Password","");
        }catch(CustomException $e){
            return responseMsg(true,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /**=============📖✍️ Login the user ✍️📖================
     * | login the user using email, user_name and password
     */
    public function loginAuth(Request $request){
        try{
            $rules = [
                'email' => 'required_without:userName'.($request->email?"|email":""),
                'userName' => 'required_without:email',
                'type' => "nullable|in:mobile",
            ];

            $validated = Validator::make(
                $request->all(),$rules
            );
            if ($validated->fails()){
                return validationError($validated);
            }
            $request->merge(["strict"=>true]);
            $user = $this->_modelUser->orderBy('id', 'DESC');
                
            $user = app(Pipeline::class)
                ->send(
                    $user
                )
                ->through([
                    SearchByEmail::class,
                    SearchByUserName::class,
                ])
                ->thenReturn()
                ->first();
            if (!$user && $request->email){
                throw new CustomException("Oops! Given email does not exist");
            }
            if (!$user && $request->userName){
                throw new CustomException("Oops! Given user name does not exist");
            }
            if ($user->lock_status == true){
                throw new CustomException("You are not authorized to log in!");
            }
            if(!(Hash::check($request->password, $user->password))){
                throw new CustomException("Password Not Matched");
            }
            $muser = $this->_modelUser->find($user->id);

            $maAllow = $muser->max_login_allow;
            $remain = ($muser->tokens->count("id")??0) - $maAllow;
            $c = 0;
            foreach($muser->tokens->sortBy("id")->values() as  $key =>$token){                  
                if($remain<$key)
                {
                    break;
                }
                $c+=1;
                $userType = $muser->getTable();
                $redisKey  = "ulb_id:" . $userType . ":" . $muser->id . ":" . $token->id;
                Redis::del($redisKey );
                $token->expires_at = Carbon::now();
                $token->update();
                $token->forceDelete();
            }

            $tockenDtl = $user->createToken('my-app-token');
            $ipAddress = getClientIpAddress(); #$req->userAgent()
            $bousuerInfo = [
                "login_type"=>$request->type,
                "latitude" => $request->browserInfo["latitude"] ?? $request->latitude ??"",
                "longitude" => $request->browserInfo["longitude"] ?? $request->longitude ?? "",
                "machine" => $request->browserInfo["machine"] ?? $request->machine ?? "",
                "browser_name" => $request->browserInfo["browserName"]?? $request->browserName ?? $request->userAgent(),
                "ip" => $ipAddress ?? "",
            ];
            DB::table('personal_access_tokens')
                ->where('id', $tockenDtl->accessToken->id)
                ->update($bousuerInfo);

            $token = $tockenDtl->plainTextToken;
            $menuRoleDetails = $user->getRoleDetailsByUserId()->get();
            
            $role = collect($menuRoleDetails)->map(function ($value, $key) {
                $values = $value['role_name'];
                return $values;
            });
            // dd($user);
            $user->user_img = $user->user_img ? url("/")."/".$user->user_img : null;
            $user->signature_img = $user->signature_img ? url("/")."/".$user->signature_img : null;
            $menus = $request->type=="mobile" ? ($this->_menuController->getMobileUserMenu($user->id))->original["data"] :  ($this->_menuController->getWebUserMenu($user->id))->original["data"];
            $data['token'] = $token;
            $data['userDetails'] = $user;
            $data['userDetails']["loginType"] = $request->type??"WEB"; 
            $data['userDetails']['role'] = $role;
            $data["userDetails"]["roleDtls"]=$menuRoleDetails;
            $data['userDetails']['permittedMenu'] = $menus["permittedMenu"]??[];
            $data['userDetails']['menuTree'] = $menus["menuTree"]??[];

            $key = 'last_activity_' . $user->id."_".$tockenDtl->accessToken->id;
            Redis::set($key, $this->_currentDateTime);            // Caching 
            
            return responseMsg(true, "You have Logged In Successfully", camelCase($data));
            

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /**=============📖✍️ logout the user ✍️📖================
     * | logout
     */
    public function logout(Request $req)
    {
        try {
            $user = $req->user();
            $userType = $user->getTable();
            $key = "ulb_id:" . $userType . ":" . $user->id . ":" . $req->bearerToken();
            Redis::del($key);
            $token = $user->currentAccessToken();
            $userType = $user->getTable();
            $key = "ulb_id:" . $userType . ":" . $user->id . ":" . $token->id;
            Redis::del($key);
            $req->user()->currentAccessToken()->delete();                               // Delete the Current Accessable Token
            return responseMsgs(true, "You have Logged Out", []);
        } catch (Exception $e) {
            return response()->json($e, 400);
        }
    }

    public function profile(){
        try{
            $user = Auth()->user();
            // $user = $this->_modelUser->find($user->id);
            $user->user_img = $user->user_img ? url("/")."/".$user->user_img : null;
            $user->signature_img = $user->signature_img ? url("/")."/".$user->signature_img : null;
            $user->roles = $user->getRoleDetailsByUserId()->get();
            $user->wardPermission = $user->getUserWards()->get();
            return responseMsg(true,"User Profile",camelCase(remove_null($user)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch (Exception $e) {
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function changePass(Request $request){
        try{
            $rules = [
                "oldPassword"=>"required",
                'newPassword' => [
                    'required',
                    'min:6',
                    'max:255',
                    'regex:/[a-z]/',      // must contain at least one lowercase letter
                    'regex:/[A-Z]/',      // must contain at least one uppercase letter
                    'regex:/[0-9]/',      // must contain at least one digit
                    'regex:/[@$!%*#?&]/'  // must contain a special character
                ],
                "conformPassword"=>"required|same:newPassword",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $loginUser = Auth()->user();
            $muser = $this->_modelUser->find($loginUser->id);
            if(!(Hash::check($request->oldPassword, $muser->password))){
                throw new CustomException("Old Password Not Matched");
            }
            if($muser->getTable()!="users"){
                throw new CustomException("You can not change password");
            }
            $muser->password = Hash::make($request->newPassword);
            $muser->update();
            foreach($muser->tokens->sortBy("id")->values() as  $key =>$token){
                $userType = $muser->getTable();
                $redisKey  = "ulb_id:" . $userType . ":" . $muser->id . ":" . $token->id;
                Redis::del($redisKey );
                $token->expires_at = Carbon::now();
                $token->update();
                $token->forceDelete();
            }
            return responseMsg(true,"User Password Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch (Exception $e) {
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getUserWardMap(Request $request){
        try{
            $user = Auth()->user();
            $rules = [
                "userId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUser->getConnectionName().".".$this->_modelUser->getTable().",id",
                
            ];
            $validated = Validator::make($request->all(),$rules);
            if($validated->fails()){
                return validationError($validated);
            }
            $userData = $this->_modelUser->find($request->userId);
            $wardMaps = $userData->getUserWards()->get();
            return responseMsg(true,"Ward User Map",camelCase($wardMaps));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userWardMap(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $user->ulb_id;
            $rules = [
                "userId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUser->getConnectionName().".".$this->_modelUser->getTable().",id",
                "wardIds"=>"required|array",
                "wardIds.*.id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUlbWardMaster->getConnectionName().".".$this->_modelUlbWardMaster->getTable().",id,ulb_id,$ulbId",
                "wardIds.*.lockStatus"=>"required|bool",
            ];
            $validated = Validator::make($request->all(),$rules);
            if($validated->fails()){
                return validationError($validated);
            }
            DB::beginTransaction();
            $wardMaps = collect($request->wardIds)->unique()->filter(function($val) use($request){
                    $oldMap = $this->_modelUserWardPermission
                            ->where("ward_mstr_id",$val["id"])
                            ->where("user_id",$request->userId)
                            ->first();
                    if($oldMap){
                        $oldMap->lock_status = $val["lockStatus"];
                        $oldMap->update();
                    }elseif(!$val["lockStatus"]){
                        return false;
                    }else{
                        return $val["id"];
                    }
            });
            $wardMaps = collect($wardMaps)->map(function($val) use($request,$user){
                return["wardMstrId"=>$val['id'],"userId"=>$request->userId,"createdByUserId"=>$user->id];
            });
            $this->_modelUserWardPermission->insert(snakeCase($wardMaps)->toArray());
            DB::commit();
            return responseMsg(true,"Ward Mapped Successfully","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getUserRoleMap(Request $request){
        try{
            $rules = [
                "userId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUser->getConnectionName().".".$this->_modelUser->getTable().",id",
                
            ];
            $validated = Validator::make($request->all(),$rules);
            if($validated->fails()){
                return validationError($validated);
            }
            $userData = $this->_modelUser->find($request->userId);
            $role = $userData->getRoleDetailsByUserId()->get();
            return responseMsg(true,"Role User Map",camelCase($role));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function userRoleMap(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $user->ulb_id;
            $rules = [
                "userId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelUser->getConnectionName().".".$this->_modelUser->getTable().",id",
                "roleId"=>"required|array",
                "roleId.*.id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_modelRoleTypeMstr->getConnectionName().".".$this->_modelRoleTypeMstr->getTable().",id",
            ];
            $validated = Validator::make($request->all(),$rules);
            if($validated->fails()){
                return validationError($validated);
            }
            DB::beginTransaction();
            $roleMaps = collect($request->roleId)->unique()->filter(function($val) use($request){
                    $oldMap = $this->_modelUserRoleMap
                            ->where("role_id",$val["id"])
                            ->where("user_id",$request->userId)
                            ->first();
                    if($oldMap){
                        $oldMap->lock_status = $val["lockStatus"];
                        $oldMap->update();
                    }elseif(!($val["lockStatus"]??true)){
                        return false;
                    }else{
                        return $val["id"];
                    }
            });
            if(collect($roleMaps)->count()>1){
                throw new CustomException("You Cont Assign Multiple Role For A User");
            }elseif(collect($roleMaps)->count()==1){
                $this->_modelUserRoleMap->where("user_id",$request->userId)->update(["lock_status"=>true]);
            }
            $roleMaps = collect($roleMaps)->map(function($val) use($request,$user){
                return["roleId"=>$val['id'],"userId"=>$request->userId];
            });
            $this->_modelUserRoleMap->insert(snakeCase($roleMaps)->toArray());
            if($this->_modelUserRoleMap->where("user_id",$request->userId)->where("lock_status",false)->count("id")>1){
                throw new CustomException("This User Have Multiple Role Assign Please Remove First");
            }
            DB::commit();
            return responseMsg(true,"Role Mapped Successfully","");
        }catch(CustomException $e){
            DB::rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            DB::rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function reportingList(Request $request){
        try{
            $ulbId = $request->ulbId?? Auth()->user()->ulb_id;
            $hierarchy = $this->_modelRoleHierarchy
                    ->select("under_role_id")
                    ->where('role_hierarchies.lock_status',false)
                    ->where('role_hierarchies.role_id',$request->roleId)
                    ->get();
            $userList = $this->_modelUser
                        ->select("users.*")
                        ->join("user_role_maps","user_role_maps.user_id","users.id")
                        ->where("user_role_maps.lock_status",false)
                        ->where("users.lock_status",false)
                        ->where("users.ulb_id",$ulbId)
                        ->whereIn("user_role_maps.role_id",$hierarchy->pluck("under_role_id"))
                        ->orderBy("users.name","ASC") 
                        ->get();            
            return responseMsg(true,"RoleHierarchy Successfully",$userList);
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function clearAllRedisData(){
        try{
            Redis::flushAll();
            return responseMsg(true,"All Caches Are Clear","");
        }catch(Exception $e){
            return responseMsg(false, $e->getMessage(), ""); 
        }
    }

    public function addOfficer(Request $request){
        try{
            $rules=[
                "officerName"=>"required",
                "img"=>"required|file|mimes:bmp,jpeg,jpg,png,pdf|max:5240",
                "designation"=>"required",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $request->merge(["ulbId"=>$user->ulb_id,"user_id"=>$user->id]);
            $relativePath = "Uploads/UlbOfficers";
            if ($request->hasFile('img')) {
                $imageName = $user->ulb_id . "_" . Str::uuid() . "." . $request->img->getClientOriginalExtension();
                $request->file('img')->move(public_path($relativePath), $imageName);
                $request->merge([
                    "imgPath" => $relativePath . "/" . $imageName,
                ]);
            }
            $id = $this->_modelUlbOfficer->store($request);
            return responseMsg(true,"New Officer Add","");
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), ""); 
        }catch(Exception $e){
            return responseMsg(false, "Server Error", ""); 
        }
    }

    public function editOfficer(Request $request){
        try{
            $rules=[
                "id"=>"required|exists:".$this->_modelUlbOfficer->getConnectionName().".".$this->_modelUlbOfficer->getTable().",id",
                "officerName"=>"required",
                "img"=>"nullable|file|mimes:bmp,jpeg,jpg,png,pdf|max:5240",
                "designation"=>"required",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $officer = $this->_modelUlbOfficer->find($request->id);
            $request->merge(["ulbId"=>$user->ulb_id,"user_id"=>$user->id,"imgPath"=>$officer->img_path]);
            $relativePath = "Uploads/UlbOfficers";
            if ($request->hasFile('img')) {
                $filePath = public_path( $officer->img_path);
                if (file_exists($filePath)) {
                    // Delete the file
                    @unlink($filePath);
                }
                $imageName = $user->ulb_id . "_" . Str::uuid() . "." . $request->img->getClientOriginalExtension();
                $request->file('img')->move(public_path($relativePath), $imageName);
                $request->merge([
                    "imgPath" => $relativePath . "/" . $imageName,
                ]);
            }
            $id = $this->_modelUlbOfficer->edit($request);
            return responseMsg(true,"Officer Edit","");
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), ""); 
        }catch(Exception $e){
            return responseMsg(false, "Server Error", ""); 
        }
    }

    public function lockUnlockUlbNotice(Request $request){
        try{
            $rules = [
                "id"=>"required|exists:".$this->_modelUlbOfficer->getConnectionName().".".$this->_modelUlbOfficer->getTable().",id",
                "lockStatus"=>"required|bool",               
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $user = Auth()->user();
            $id = $this->_modelUlbOfficer->edit($request);
            return responseMsg(true,"Officer Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function getOfficerList(Request $request){
        try{ 
            $user = Auth()->user();
            if($user?->ulb_id && !$request?->ulbId){
                $request->merge(["ulbId"=>$user->ulb_id]);
            }
            $data = $this->_modelUlbOfficer
                    ->readConnection()
                    ->select("ulb_officers.*","ulb_masters.ulb_name")
                    ->join("ulb_masters","ulb_masters.id","ulb_officers.ulb_id");
            if($request->ulbId){
                $data->where("ulb_officers.ulb_id",$request->ulbId);
            }
            if($request->key){
                $data->where(function($where)use($request){
                    $where->orWhere("ulb_officers.officer_name","ILIKE","%".$request->key."%")
                    ->orWhere("ulb_officers.designation","ILIKE","%".$request->key."%")
                    ->orWhere("ulb_officers.contact_no","ILIKE","%".$request->key."%")
                    ->orWhere("ulb_officers.email","ILIKE","%".$request->key."%");
                });
            }

            if($request->all){
                $data = $data
                    ->where("ulb_officers.lock_status",false)
                    ->orderBy("ulb_officers.sl_no","ASC")
                    ->get()
                    ->map(function($val){
                        $val->img_path = $val->img_path ? url("/")."/".$val->img_path : null;              
                        return $val;
                    });
                return responseMsg(true,"All Officer List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("ulb_officers.lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All Officer List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $val->img_path = $val->img_path ? url("/")."/".$val->img_path : null;              
                return $val;
            });
            return responseMsg(true,"Officer Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        } 
    }

    public function dtlUlbOfficer(Request $request){
        try{ 
            $rules = [
                "id"=>"required|exists:".$this->_modelUlbOfficer->getConnectionName().".".$this->_modelUlbOfficer->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            
            $data = $this->_modelUlbOfficer->find($request->id);
            $data->img_path = $data->img_path ? url("/")."/".$data->img_path : null; 
           
            return responseMsg(true,"Officer Dtl",camelCase(remove_null($data)));
            
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        } 
    }
}
