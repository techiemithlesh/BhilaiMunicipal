<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\AddWardRequest;
use App\Http\Requests\Common\UpdateWardRequest;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class WardController extends Controller
{
    /**
     *       created by: Sandeep Bara
     *       Date       : 2024-07-12
             status     : open
            📖         : read data (read connection use)
            ✍️          : write data (write connection use)
     */

    private $_modelUlbWardMaster;
    private $_modelUlbMaster;

    public function __construct()
    {
        $this->_modelUlbWardMaster = new UlbWardMaster();
        $this->_modelUlbMaster = new UlbMaster();
    }

    /**=============📖get All Ward List📖================
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth()->user();
            $ulbId = $request->ulbId ?? $user->ulb_id;
            $data = $this->_modelUlbWardMaster
                ->where("ulb_id", $ulbId)
                ->orderBy("ulb_id", "ASC");
            if($request->has("offset") && $request->has("limit")){
                $data = $data->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true, "Ward List", camelCase(remove_null($data)));
            }
            if($request->all){
                $data = $data->get()->sortBy(function ($item) {
                        // Extract number part (leading digits only)
                        preg_match('/^(\d+)/', $item->ward_no, $numMatch);
                        $numPart = isset($numMatch[1]) ? (int)$numMatch[1] : PHP_INT_MAX; // keep non-numeric at last

                        // Extract alphabet part (letters after digits)
                        preg_match('/[A-Za-z]+$/', $item->ward_no, $alphaMatch);
                        $alphaPart = isset($alphaMatch[0]) ? $alphaMatch[0] : '';

                        return [$numPart, $alphaPart];
                    })
                    ->values();
                return responseMsg(true, "All Ward List", camelCase(remove_null($data)));
            }
            $data = paginator($data, $request);
            $data["data"] = collect($data["data"])->map(function ($val) {
                $val->ulb_name = ($val->getUlb()->first())->ulb_name ?? "";
                return $val;
            });
            return responseMsg(true, "Ward Fetched", camelCase(remove_null($data)));
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
    public function store(AddWardRequest $request)
    {
        //
        try {
            $user = Auth()->user();
            $ulbId = $user->ulb_id;
            if ($request->ulbId != $ulbId) {
                throw new CustomException("You Can't Create Ward For Another Ulb");
            }
            DB::beginTransaction();
            $wardId = $this->_modelUlbWardMaster->store($request);
            DB::commit();
            return responseMsg(true, "New Ward Created", ["id" => $wardId]);
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
            $data = $this->_modelUlbMaster->find($id);
            if (!$data) {
                throw new CustomException("Invalid Id");
            }
            $data->ulb_name = ($data->getUlb()->first())->ulb_name ?? "";
            return responseMsg(true, "Use Details", camelCase(remove_null($data)));
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
    public function update(UpdateWardRequest $request)
    {
        //
        try {
            DB::beginTransaction();
            if (!$this->_modelUlbWardMaster->edit($request)) {
                throw new CustomException("Data Not Updated");
            }
            DB::commit();
            return responseMsg(true, "User Updated Successfully", "");
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
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
            $user = $this->_modelUlbWardMaster->find($request->id);
            if (!$user) {
                throw new CustomException("Invalid WardId Pass");
            }
            $user->lock_status = $request->lockStatus;
            DB::beginTransaction();
            $user->update();
            DB::commit();
            return responseMsg(true, "User Suspended Successfully", "");
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function getUlbWard(Request $request)
    {
        try {
            $user = Auth()->user();
            $ulbId = $request->ulbId ?? $user->ulb_id;
            $data = $this->_modelUlbWardMaster->getWardList($ulbId);
            return responseMsg(true, "Ulb Ward List", camelCase(remove_null($data)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }
}
