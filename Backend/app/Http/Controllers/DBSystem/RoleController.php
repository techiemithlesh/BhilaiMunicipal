<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\AddRoleRequest;
use App\Http\Requests\Common\UpdateRoleRequest;
use App\Models\DBSystem\RoleTypeMstr;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     *       created by: Sandeep Bara
     *       Date       : 2024-07-12
             status     : open
            📖         : read data (read connection use)
            ✍️          : write data (write connection use)
     */

    private $_modelRoleTypeMstr;
    private $_mobileRoleArray;

    public function __construct()
    {
        $this->_modelRoleTypeMstr = new RoleTypeMstr();
        $this->_mobileRoleArray = Config::get("SystemConstant.MOBILE-ROLE");
    }

    /**=============📖get All Ward List📖================
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $data = $this->_modelRoleTypeMstr
                ->orderBy("id", "ASC");
            if($request->onlyMobileRole){
                $data->whereIn("id",$this->_mobileRoleArray);
            }
            if($request->all){
                $data = $data->where("lock_status",false)->get();
                return responseMsg(true, "All Role List", camelCase(remove_null($data)));
            }
            $data = paginator($data, $request);
            return responseMsg(true, "Role Fetched", camelCase(remove_null($data)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**=============✍️ create new ward ✍️================
     * Store a newly created resource in storage.
     */
    public function store(AddRoleRequest $request)
    {
        //
        try {
            DB::beginTransaction();
            $roleId = $this->_modelRoleTypeMstr->store($request);
            DB::commit();
            return responseMsg(true, "New Role Created", ["id" => $roleId]);
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }
    /**=============📖 get the ward by id 📖================
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $data = $this->_modelRoleTypeMstr->find($id);
            if (!$data) {
                throw new CustomException("Invalid Id");
            }
            return responseMsg(true, "Role Details", camelCase(remove_null($data)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**=============📖✍️ update the ward ✍️📖================
     * Update the specified resource in storage.
     */
    public function update(UpdateRoleRequest $request,$id)
    {
        //
        try {
            DB::beginTransaction();
            if (!$this->_modelRoleTypeMstr->edit($request)) {
                throw new CustomException("Data Not Updated");
            }
            DB::commit();
            return responseMsg(true, "Role Updated Successfully", "");
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();dd($e);
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    /**=============📖✍️ update the ward ✍️📖================
     * lock_status=true
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        try {
            $request = new Request(["id" => $id, "lockStatus" => true]);
            $user = $this->_modelRoleTypeMstr->find($request->id);
            if (!$user) {
                throw new CustomException("Invalid RoleId Pass");
            }
            $user->lock_status = $request->lockStatus;
            DB::beginTransaction();
            $user->update();
            DB::commit();
            return responseMsg(true, "Role Suspended Successfully", "");
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function getUserListByRole(Request $request)
    {
        try {
            $roleIds = is_array($request->id) ? $request->id : [$request->id];

            $roles = $this->_modelRoleTypeMstr->whereIn("id", $roleIds)->get();

            $prefix = "";
            $userList = collect();

            foreach ($roles as $role) {
                $prefix .= " & " . $role->role_name;
                $users = $role->getUsers()->get(); // Assuming getUsers() returns a relationship
                $userList = $userList->merge($users); // merge flattens nested collections
            }

            return responseMsg(true, trim($prefix, " & ") . " List", camelCase(remove_null($userList->unique('id')->values())));
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

}
