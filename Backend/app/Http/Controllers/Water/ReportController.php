<?php

namespace App\Http\Controllers\Water;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\User;
use App\Models\Water\Consumer;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterRejectedApplication;
use App\Models\Water\WaterTransaction;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    //

    private $_SystemConstant;
    private $_MODULE_ID;
    private $_WorkflowMaster;
    private $_RoleTypeMstr;
    private $_User;
    private $_WaterActiveApplication;
    private $_WaterRejectedApplication;
    private $_WaterApplication;
    private $_Consumer;
    private $_UlbMaster;
    private $_UlbWardMaster;
    private $_WaterTransaction;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["WATER"];

        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_UlbMaster  = new UlbMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_User = new User();
        $this->_WaterActiveApplication = new WaterActiveApplication();
        $this->_WaterRejectedApplication = new WaterRejectedApplication();
        $this->_WaterApplication = new WaterApplication();
        $this->_Consumer = new Consumer();
        $this->_WaterTransaction = new WaterTransaction();
        
    }

    public function getPaymentMode(Request $request){
        try{
            $data=$this->_WaterTransaction->select(DB::raw("DISTINCT(upper(payment_mode)) AS payment_mode"))->get();
            return responseMsg(true,"Payment List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function waterWfRoleList(Request $request){
        try{
            $user = Auth::user();
            $wf=$this->_WorkflowMaster->where("module_id",$this->_MODULE_ID)->first();
            $roleIds=$wf->getWorkFlowRoles()
                    ->where("ulb_id",$user->ulb_id)
                    ->where("lock_status",false);
            if($request->onlyAction){
                $roleIds->whereNotNull("serial_no");
            }
            $roleIds=$roleIds
                    ->orderBy("serial_no","ASC")
                    ->get();
            $data = $this->_RoleTypeMstr->whereIn("id",$roleIds->pluck("role_id")->unique())->get();
            return responseMsg(true,"Role List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function collectionReport(Request $request){
        try{
            $user = Auth::user();
            if(!$request->ulbId){
                $request->merge(["ulbId"=>$user->ulb_id]);
            }
            $commonSelect = [
                "water_transactions.*",
                "cheque_details.cheque_no",
                "cheque_details.cheque_date",
                "cheque_details.bank_name",
                "cheque_details.branch_name",
                "ulb_ward_masters.ward_no",
                "users.name as user_name",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
            ];

            $activeAppTran = $this->_WaterTransaction->select(array_merge($commonSelect, [DB::raw("null as consumer_no"), "water_active_applications.application_no"]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","water_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","water_transactions.user_id")
                        ->where("water_transactions.user_type","<>","ONLINE");
                    })
                    ->join("water_active_applications","water_active_applications.id","water_transactions.application_id")
                    ->leftJoin(DB::raw("(
                                        select application_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from water_active_application_owners
                                        where lock_status =false
                                        group by application_id
                                    ) as w"),"w.application_id","water_transactions.application_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","water_transactions.ward_mstr_id")
                    ->where("water_transactions.lock_status",false)
                    ->whereIn("water_transactions.payment_status",[1,2]);
            $appTran = $this->_WaterTransaction->select(array_merge($commonSelect, [DB::raw("null as consumer_no"), "water_applications.application_no"]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","water_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","water_transactions.user_id")
                        ->where("water_transactions.user_type","<>","ONLINE");
                    })
                    ->join("water_applications","water_applications.id","water_transactions.application_id")
                    ->leftJoin(DB::raw("(
                                        select application_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from water_application_owners
                                        where lock_status =false
                                        group by application_id
                                    ) as w"),"w.application_id","water_transactions.application_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","water_transactions.ward_mstr_id")
                    ->where("water_transactions.lock_status",false)
                    ->whereIn("water_transactions.payment_status",[1,2]);

            $rejectedAppTran = $this->_WaterTransaction->select(array_merge($commonSelect, [DB::raw("null as consumer_no"), "water_rejected_applications.application_no"]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","water_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","water_transactions.user_id")
                        ->where("water_transactions.user_type","<>","ONLINE");
                    })
                    ->join("water_rejected_applications","water_rejected_applications.id","water_transactions.application_id")
                    ->leftJoin(DB::raw("(
                                        select application_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from water_rejected_application_owners
                                        where lock_status =false
                                        group by application_id
                                    ) as w"),"w.application_id","water_transactions.application_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","water_transactions.ward_mstr_id")
                    ->where("water_transactions.lock_status",false)
                    ->whereIn("water_transactions.payment_status",[1,2]);

            $consumerTran = $this->_WaterTransaction->select(array_merge($commonSelect, [DB::raw("consumers.consumer_no as consumer_no"), DB::raw("null as application_no")]))                    
                    ->leftJoin("cheque_details","cheque_details.transaction_id","water_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","water_transactions.user_id")
                        ->where("water_transactions.user_type","<>","ONLINE");
                    })
                    ->join("consumers","consumers.id","water_transactions.consumer_id")
                    ->leftJoin(DB::raw("(
                                        select consumer_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from consumer_owners
                                        where lock_status =false
                                        group by consumer_id
                                    ) as w"),"w.consumer_id","water_transactions.consumer_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","water_transactions.ward_mstr_id")
                    ->where("water_transactions.lock_status",false)
                    ->whereIn("water_transactions.payment_status",[1,2]);
            if($request->appType){
                if(strtoupper($request->appType)=="CONSUMER"){
                    $activeAppTran->whereNotNull("water_transactions.consumer_id");
                    $appTran->whereNotNull("water_transactions.consumer_id");
                    $rejectedAppTran->whereNotNull("water_transactions.consumer_id");
                    $consumerTran->whereNotNull("water_transactions.consumer_id");
                }elseif(strtoupper($request->appType)=="APP"){
                    $activeAppTran->whereNotNull("water_transactions.application_id");
                    $appTran->whereNotNull("water_transactions.application_id");
                    $rejectedAppTran->whereNotNull("water_transactions.application_id");
                    $consumerTran->whereNotNull("water_transactions.application_id");
                }
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $activeAppTran->whereBetween("water_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                    $appTran->whereBetween("water_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                    $rejectedAppTran->whereBetween("water_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                    $consumerTran->whereBetween("water_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                }
                elseif($request->fromDate){
                    $activeAppTran->where("water_transactions.tran_date",">=",$request->fromDate);
                    $appTran->where("water_transactions.tran_date",">=",$request->fromDate);
                    $rejectedAppTran->where("water_transactions.tran_date",">=",$request->fromDate);
                    $consumerTran->where("water_transactions.tran_date",">=",$request->fromDate);
                }elseif($request->uptoDate){
                    $activeAppTran->where("water_transactions.tran_date","<=",$request->uptoDate);
                    $appTran->where("water_transactions.tran_date","<=",$request->uptoDate);
                    $rejectedAppTran->where("water_transactions.tran_date","<=",$request->uptoDate);
                    $consumerTran->where("water_transactions.tran_date","<=",$request->uptoDate);
                }
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $activeAppTran->whereIn("water_transactions.ward_mstr_id",$request->wardId);
                $appTran->whereIn("water_transactions.ward_mstr_id",$request->wardId);
                $rejectedAppTran->whereIn("water_transactions.ward_mstr_id",$request->wardId);
                $consumerTran->whereIn("water_transactions.ward_mstr_id",$request->wardId);
            }
            if($request->paymentMode){
                if(!is_array($request->paymentMode)){
                    $request->merge(["paymentMode"=>[$request->paymentMode]]);
                }
                $activeAppTran->whereIn("water_transactions.payment_mode",$request->paymentMode);
                $appTran->whereIn("water_transactions.payment_mode",$request->paymentMode);
                $rejectedAppTran->whereIn("water_transactions.payment_mode",$request->paymentMode);
                $consumerTran->whereIn("water_transactions.payment_mode",$request->paymentMode);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$activeAppTran, $appTran, $rejectedAppTran, $consumerTran] as $q) {
                    $q->where("water_transactions.user_type", "<>", "ONLINE");
                    $q->whereIn("water_transactions.user_id", $userIds);
                }
            }
            $data = $activeAppTran
                ->union($appTran)
                ->union($rejectedAppTran)
                ->union($consumerTran);

            if($request->all){
                $data = $data->get();
            }else{
                $data = paginator($data,$request);
            }
            return responseMsg(true,"Transaction List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function collectionSummary(Request $request)
    {
        try {
            $user = Auth::user();

            // Default ulbId from logged-in user if not provided
            if (!$request->ulbId) {
                $request->merge(['ulbId' => $user->ulb_id]);
            }

            $data = $this->_WaterTransaction->select('*')
                ->where('lock_status', false)
                ->whereIn('payment_status', [1, 2, 3]);

            // Filter by app type
            if ($request->appType) {
                $appType = strtoupper($request->appType);
                if ($appType == 'CONSUMER') {
                    $data->whereNotNull('consumer_id');
                } elseif ($appType == 'APP') {
                    $data->whereNotNull('application_id');
                }
            }

            // Filter by date range
            if ($request->fromDate && $request->uptoDate) {
                $data->whereBetween('tran_date', [$request->fromDate, $request->uptoDate]);
            } elseif ($request->fromDate) {
                $data->where('tran_date', '>=', $request->fromDate);
            } elseif ($request->uptoDate) {
                $data->where('tran_date', '<=', $request->uptoDate);
            }

            // Filter by ward ID(s)
            if ($request->wardId) {
                $wardIds = is_array($request->wardId) ? $request->wardId : [$request->wardId];
                $data->whereIn('ward_mstr_id', $wardIds);
            }

            // Filter by payment mode(s)
            if ($request->paymentMode) {
                $modes = is_array($request->paymentMode) ? $request->paymentMode : [$request->paymentMode];
                $data->whereIn('payment_mode', $modes);
            }

            // Filter by user ID(s)
            if ($request->userId) {
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                $data->where('user_type', '<>', 'ONLINE')
                    ->whereIn('user_id', $userIds);
            }

            // Get distinct payment modes
            $paymentModes = $this->_WaterTransaction->select(DB::raw("DISTINCT(UPPER(payment_mode)) AS payment_mode"))
                ->orderBy('payment_mode', 'ASC')
                ->get()
                ->pluck('payment_mode');

            $allTran = $data->get();

            // Split data into active and deactivated
            $activeTran = $allTran->whereIn('payment_status', [1, 2]);
            $deactivateTran = $allTran->whereIn('payment_status', [3]);
            if($request->active_tran){
                return responseMsg(true,"Transaction List Fetched",camelCase(remove_null($activeTran)));
            }
            // Door-to-door = not JSK or ONLINE
            $doreToDore = $activeTran->filter(function ($item) {
                return !in_array(strtoupper($item->user_type), ['JSK', 'ONLINE']);
            });

            // Normalize payment mode comparisons
            $normalizeMode = function ($item) {
                return strtoupper($item->payment_mode ?? '');
            };

            // Summary mappings
            $totalTran = $paymentModes->map(function ($mode) use ($allTran, $normalizeMode) {
                $tran = $allTran->filter(fn($t) => $normalizeMode($t) === $mode);
                return [
                    'payment_mode' => $mode,
                    'count' => $tran->count(),
                    'amount' => roundFigure($tran->sum('payable_amt')),
                ];
            });
            $totalTranSummary = ["payment_mode"=>"Total","count"=>$totalTran->sum("count"),"amount"=>$totalTran->sum("amount")];
            $totalTran->push($totalTranSummary);

            $totalRefund = $paymentModes->map(function ($mode) use ($deactivateTran, $normalizeMode) {
                $tran = $deactivateTran->filter(fn($t) => $normalizeMode($t) === $mode);
                return [
                    'payment_mode' => $mode,
                    'count' => $tran->count(),
                    'amount' => roundFigure($tran->sum('payable_amt')),
                ];
            });
            $totalRefundSummary = ["payment_mode"=>"Total","count"=>$totalRefund->sum("count"),"amount"=>$totalRefund->sum("amount")];
            $totalRefund->push($totalRefundSummary);

            $totalDoreToDore = $paymentModes->map(function ($mode) use ($doreToDore, $normalizeMode) {
                $tran = $doreToDore->filter(fn($t) => $normalizeMode($t) === $mode);
                return [
                    'payment_mode' => $mode,
                    'count' => $tran->count(),
                    'amount' => roundFigure($tran->sum('payable_amt')),
                ];
            });
            $totalDoreToDore->push(["payment_mode"=>"Total","count"=>$totalDoreToDore->sum("count"),"amount"=>$totalDoreToDore->sum("amount")]);
            $summary=[
                "totalTran"=>$totalTran,
                "totalRefund"=>$totalRefund,
                "netCollection"=>[
                    "payment_mode"=>"Net Collection",
                    "count"=> $totalTranSummary["count"] - $totalRefundSummary["count"],
                    "amount"=> roundFigure($totalTranSummary["amount"] - $totalRefundSummary["amount"]),
                ],
                "doorToDoor"=>$totalDoreToDore
            ];
            return responseMsg(true,"Transaction Summary Fetched",camelCase(remove_null($summary)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function levelWisePendingApp(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $request->ulbId ?? $user->ulb_id;

            $data = $this->_WaterActiveApplication->select("water_active_applications.id","water_active_applications.application_no",
                            "water_active_applications.ward_mstr_id",
                            "water_active_applications.current_role_id","water_active_applications.is_btc",
                            "water_active_applications.apply_date",
                            "w.owner_name","w.mobile_no","w.guardian_name",
                            "wm.ward_no",
                            )
                    ->leftJoin(DB::raw("(select application_id,
                            string_agg(owner_name,',') as owner_name,
                            string_agg(cast(mobile_no as varchar),',') as mobile_no,
                            string_agg(guardian_name,',') as guardian_name
                            from water_active_application_owners
                            where lock_status=false
                            group by application_id
                    ) as w"),"w.application_id","water_active_applications.id")
                    ->join("ulb_ward_masters as wm","wm.id","water_active_applications.ward_mstr_id")
                    ->where("water_active_applications.payment_status","<>",0)
                    ->where("water_active_applications.is_btc",false)
                    ->where("water_active_applications.ulb_id",$ulbId);
            if($request->wardId){
                $wardIds = is_array($request->wardId) ? $request->wardId : [$request->wardId];
                $data->whereIn('water_active_applications.ward_mstr_id', $wardIds);
            }
            if($request->roleId){
                $roleId = is_array($request->roleId) ? $request->roleId : [$request->roleId];
                $data->whereIn('water_active_applications.current_role_id', $roleId);
            }
            if($request->fromDate && $request->uptoDate){
                $data->whereBetween('water_active_applications.apply_date', [$request->fromDate,$request->uptoDate]);
            }
            
            if($request->all){
                $data = $data->get();
                return responseMsg(true,"All Pending Application",camelCase(remove_null($data)));
            }
            $list = paginator($data,$request);
            return responseMsg(true,"Pending Application",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), '');
        }catch(Exception $e){
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function userWisePendingApp(Request $request){
        try{
            $userId = $request->userId;
            $user = User::find($userId);
            $wardPermissionList = $user->getUserWards()->get();
            $wardPermissionList = $wardPermissionList->sort(function ($a, $b) {
                            return compareWardNo($a->ward_no, $b->ward_no);
                        })->values();
            $waredId = $wardPermissionList->unique("id")->pluck("id");
            $role = $user->getRoleDetailsByUserId()->first();
            if(!$request->wardId){
                $request->merge(["wardId"=>$waredId->toArray()]);
            }
            if(!$request->roleId){
                $request->merge(["roleId"=>$role->id]);
            }
            if($request->wardGroup){
                $request->merge(["all"=>true]);
            }
            $response = $this->levelWisePendingApp($request);
            if(!$response->original["status"]){
                return $response;
            }
            $data = $response->original["data"];
            $responseData = $data;
            if($request->wardGroup){
                $responseData = $wardPermissionList->map(function($item)use($data){
                    $item->total_app = collect($data)->where("wardMstrId",$item->id)->count();
                    return $item;
                });
            }
            return responseMsg(true,$user->name." Pending Application",camelCase(remove_null($responseData)));
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), '');
        }catch(Exception $e){
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }


    public function roleUserWisePendingApp(Request $request){
        try{
            $roleIds = is_array($request->roleId) ? $request->roleId : [$request->roleId];
            $roles = $this->_RoleTypeMstr->whereIn("id",$roleIds)->orderBy("id","ASC")->get();
            $users = collect();
            $prefix = "";
            foreach ($roles as $role) {
                $prefix .= " & " . $role->role_name;
                $user = $role->getUsers()->orderBy("id","ASC")->get()->map(function($item)use($role){
                    $item->role_id = $role->id;
                    return $item;
                }); // Assuming getUsers() returns a relationship
                $users = $users->merge($user); // merge flattens nested collections
            }
            $finalData = $users->map(function($user)use($request){
                $request->merge(["wardGroup"=>true,"userId"=>$user->id]);
                $response = $this->userWisePendingApp($request);
                if(!$response->original["status"]){
                    throw new CustomException($response->original["message"]);
                }
                $data = $response->original["data"];
                $user->total_app = collect($data)->sum("totalApp");
                $user->total_ward = collect($data)->count("id");
                return $user;

            });
            return responseMsg(true,trim($prefix, " & ")." Pending Application",camelCase(remove_null($finalData)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }


    public function roleWisePendingApp(Request $request){
        try{
            $request->merge(["onlyAction"=>true]);
            $roleResponse = $this->waterWfRoleList($request);
            $data = $roleResponse->original["status"]?$roleResponse->original["data"]:collect();
            $roles = $this->_RoleTypeMstr->whereIn("id",$data->pluck("id")->unique())->get();
            if($request->roleId){
                $roles = $roles->where("id",$request->roleId)->values();
            }
            $finalData = $roles->map(function($role) use($request){                
                $request->merge(["all"=>true,"roleId"=>$role->id]);
                $response = $this->levelWisePendingApp($request);
                if(!$response->original["status"]){
                    throw new CustomException($response->original["message"]);
                }
                $data = $response->original["data"];
                $role->total_app = collect($data)->count("id");
                $role->total_user = $role->getUsers()->orderBy("id","ASC")->count();
                return $role;
            });           
            return responseMsg(true,"Role Pending Saf",camelCase(remove_null($finalData)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function wardWiseConsumer(Request $request){
        try{
            $user = Auth::user();
            // Default ulbId from logged-in user if not provided
            if (!$request->ulbId) {
                $request->merge(['ulbId' => $user->ulb_id]);
            }
            $wardList = $this->_UlbWardMaster->where("ulb_id",$request->ulbId)
                                            ->where("lock_status",false)
                                            ->get();
            $wardList = $wardList->sort(function ($a, $b) {
                            return compareWardNo($a->ward_no, $b->ward_no);
                        })->values();
            $data = $wardList->map(function($item){
                $item->total_consumer = $this->_Consumer->where("ward_mstr_id",$item->id)
                                        ->where("ulb_id",$item->ulb_id)
                                        ->where("lock_status",false)
                                        ->count();
                return $item;
            });
            return responseMsg(true,"Ward Wise Consumer",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function consumerWiseDcb(Request $request){
        try{
            $fyear = $request->fyear??getFY();
            list($fromYear,$uptoYear) = explode("-",$fyear);
            $startDate = "{$fromYear}-04-01";
            $endDate   = "{$uptoYear}-03-31";

            $orm = $this->_Consumer
                ->from("consumers as c")
                ->select(DB::raw("
                    c.id,c.consumer_no,c.address,c.ward_mstr_id,c.property_type_id,
                    c.saf_detail_id,saf.saf_no as saf_no,
                    c.property_detail_id,
                    meter_status.meter_type_id,
                    COALESCE(prop.holding_no,prop.new_holding_no) as holding_no,
                    pt.property_type,wm.ward_no,w.owner_name,w.guardian_name, w.mobile_no ,
                    (COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) as arrear_tax,
                    COALESCE(demands.current_tax,0) as current_tax, 
                    ((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) + COALESCE(demands.current_tax,0)) as total_tax,
                    
                    COALESCE(collection.arrear_collection,0) as arrear_collection,
                    COALESCE(collection.current_collection,0) as current_collection,
                    COALESCE(collection.total_collection,0) as total_collection,

                    ((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) - COALESCE(collection.arrear_collection,0)) as arrear_outstanding,
                    (COALESCE(demands.current_tax,0) - COALESCE(collection.current_collection,0)) as current_outstanding,
                    (((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) - COALESCE(collection.arrear_collection,0)) + (COALESCE(demands.current_tax,0) - COALESCE(collection.current_collection,0))) as total_outstanding,
                    
                    (COALESCE(advance_priv.total_priv_advance,0) - COALESCE(adjust_priv.total_priv_adjust,0)) as advance_for_this,
                    COALESCE(current_advance.total_current_advance,0) as total_current_advance,
                    COALESCE(current_adjust.total_current_adjust,0) as total_current_adjust,
                    ((COALESCE(advance_priv.total_priv_advance,0) - COALESCE(adjust_priv.total_priv_adjust,0)) + COALESCE(current_advance.total_current_advance,0) - COALESCE(current_adjust.total_current_adjust,0) ) as total_outstanding_advance,                    

                    COALESCE(penalty_rebate.rebate,0) as rebate,
                    COALESCE(penalty_rebate.penalty,0) as penalty
                "))
                ->join("ulb_ward_masters as wm","wm.id","c.ward_mstr_id")
                ->join("property_type_masters as pt","pt.id","c.property_type_id")
                ->leftJoin("meter_status","meter_status.id","c.meter_status_id")
                ->leftJoin(DB::raw("(
                    select id,saf_no
                    from active_saf_details
                    union all(
                        select id,saf_no
                        from saf_details
                    )
                ) as saf"),"saf.id","c.saf_detail_id")
                 ->leftJoin(DB::raw("(
                    select id,holding_no,new_holding_no
                    from property_details
                ) as prop"),"prop.id","c.property_detail_id")
                ->leftJoin(DB::raw("(
                        select consumer_id,string_agg(owner_name,',') as owner_name , string_agg(guardian_name,',') as guardian_name, string_agg(cast(mobile_no as text),',') as mobile_no,
                        string_agg(email,',') as email
                        from consumer_owners
                        where lock_status=false
                        group by consumer_id
                    ) as w
                "),"w.consumer_id", "c.id")
                ->leftJoin(DB::raw("
                    (
                        select consumer_id, sum(amount) as total_tax, 
                            sum(case when demand_upto between '{$startDate}' and '{$endDate}' then amount else 0 end) as current_tax,
                            sum(case when demand_upto < '{$startDate}' then amount else 0 end) as arrear_tax
                        from consumer_demands
                        where lock_status=false and demand_upto <= '{$endDate}'
                        group by consumer_id                        
                    ) as demands
                "),"demands.consumer_id", "c.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            c.consumer_id, sum(c.amount) as total_collection, 
                            sum(case when c.demand_upto between '{$startDate}' and '{$endDate}' then c.amount else 0 end) as current_collection,
                            sum(case when c.demand_upto < '{$startDate}' then c.amount else 0 end) as arrear_collection
                        from consumer_demands_collections as c
                        join water_transactions as t on t.id = c.transaction_id
                        where c.lock_status=false and t.lock_status=false and t.payment_status in(1,2)
                            and t.tran_date between '{$startDate}' and '{$endDate}'
                        group by c.consumer_id
                    ) as collection
                "),"collection.consumer_id","c.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            c.consumer_id, sum(c.amount) as total_priv_collection
                        from consumer_demands_collections as c
                        join water_transactions as t on t.id = c.transaction_id
                        where c.lock_status=false and t.lock_status=false and t.payment_status in(1,2)
                            and t.tran_date < '{$startDate}' 
                        group by c.consumer_id
                    ) as priv_collection
                "),"priv_collection.consumer_id","c.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.consumer_id, sum(ad.amount) as total_priv_advance
                        from advance_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) < '{$startDate}'
                        group by ad.consumer_id
                    ) as advance_priv
                "),"advance_priv.consumer_id","c.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.consumer_id, sum(ad.amount) as total_priv_adjust
                        from adjustment_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) < '{$startDate}'
                        group by ad.consumer_id
                    ) as adjust_priv
                "),"adjust_priv.consumer_id","c.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.consumer_id, sum(ad.amount) as total_current_advance
                        from advance_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) between '{$startDate}' and '{$endDate}'
                        group by ad.consumer_id
                    ) as current_advance
                "),"current_advance.consumer_id","c.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.consumer_id, sum(ad.amount) as total_current_adjust
                        from adjustment_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) between '{$startDate}' and '{$endDate}'
                        group by ad.consumer_id
                    ) as current_adjust
                "),"current_adjust.consumer_id","c.id")
                ->leftJoin(DB::raw("
                    (
                        select t.consumer_id,
                            sum(case when rb.is_rebate=true then rb.amount else 0 end) as rebate,
                            sum(case when rb.is_rebate!=true then rb.amount else 0 end) as penalty 
                        from transaction_fine_rebate_details as rb
                        join water_transactions as t on t.id = rb.transaction_id 
                        where rb.lock_status=false and t.lock_status=false and t.payment_status in(1,2)
                            and t.tran_date between '{$startDate}' and '{$endDate}'
                        group by t.consumer_id
                    ) as penalty_rebate
                "),"penalty_rebate.consumer_id","c.id");

            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $orm->whereIn("c.ward_mstr_id",$request->wardId);
            }
            if($request->meterTypeId){
                if(!is_array($request->meterTypeId)){
                    $request->merge(["meterTypeId",[$request->meterTypeId]]);
                }
                $orm->whereIn("meter_status.meter_type_id",$request->meterTypeId);
            }
            if($request->propertyTypeId){
                if(!is_array($request->propertyTypeId)){
                    $request->merge(["propertyTypeId"=>[$request->propertyTypeId]]);
                }
                $orm->whereIn("c.property_type_id",$request->propertyTypeId);
            }
            $summaryQuery = clone $orm;
            $orm->orderBy("c.ward_mstr_id");
            if(!$request->all){
                $data = paginator($orm,$request);
                $summary = $summaryQuery->select(DB::raw("
                    COUNT(c.id) as total_consumer,
                    SUM((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0))) as total_arrear_tax,
                    SUM(COALESCE(demands.current_tax,0)) as total_current_tax,
                    SUM(((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) + COALESCE(demands.current_tax,0))) as total_tax,
    
                    SUM(COALESCE(collection.arrear_collection,0)) as total_arrear_collection,
                    SUM(COALESCE(collection.current_collection,0)) as total_current_collection,
                    SUM(COALESCE(collection.total_collection,0)) as total_collection,
    
                    SUM(((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) - COALESCE(collection.arrear_collection,0))) as total_arrear_outstanding,
                    SUM((COALESCE(demands.current_tax,0) - COALESCE(collection.current_collection,0))) as total_current_outstanding,
                    SUM((((COALESCE(demands.arrear_tax,0) - COALESCE(priv_collection.total_priv_collection,0)) - COALESCE(collection.arrear_collection,0)) + (COALESCE(demands.current_tax,0) - COALESCE(collection.current_collection,0)))) as grand_total_outstanding,
    
                    SUM((COALESCE(advance_priv.total_priv_advance,0) - COALESCE(adjust_priv.total_priv_adjust,0))) as total_advance_for_this,
                    SUM(COALESCE(current_advance.total_current_advance,0)) as grand_total_current_advance,
                    SUM(COALESCE(current_adjust.total_current_adjust,0)) as grand_total_current_adjust,
                    SUM(((COALESCE(advance_priv.total_priv_advance,0) - COALESCE(adjust_priv.total_priv_adjust,0)) + COALESCE(current_advance.total_current_advance,0) - COALESCE(current_adjust.total_current_adjust,0) )) as total_grand_outstanding_advance,
                    
                    SUM(COALESCE(penalty_rebate.rebate,0)) as grand_total_rebate,
                    SUM(COALESCE(penalty_rebate.penalty,0)) as grand_total_penalty
                "))->first();
                $data["summary"]=$summary;
            }else{
                $data = $orm->get();
            }
            return responseMsg(true,"Consumer Wise DCB",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function wardWiseDcb(Request $request){
        try{
            $user = Auth::user();
            $request->merge(["all"=>true]);
            $holdingWiseDcbResponse = $this->consumerWiseDcb($request);
            if(!$holdingWiseDcbResponse->original["status"]){
                throw new CustomException($holdingWiseDcbResponse->original["message"]);
            }
            $holdingWiseDcb = $holdingWiseDcbResponse->original["data"];
            $ulbWard = $this->_UlbWardMaster->select("*")
                ->where("ulb_id",$user->ulb_id);
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $ulbWard->whereIn("id",$request->wardId);
            }
            $ulbWard->orderBy("id","ASC");
            $ward = $ulbWard->get()->sortBy(function ($item) {
                        // Extract number part (leading digits only)
                        preg_match('/^(\d+)/', $item->ward_no, $numMatch);
                        $numPart = isset($numMatch[1]) ? (int)$numMatch[1] : PHP_INT_MAX; // keep non-numeric at last

                        // Extract alphabet part (letters after digits)
                        preg_match('/[A-Za-z]+$/', $item->ward_no, $alphaMatch);
                        $alphaPart = isset($alphaMatch[0]) ? $alphaMatch[0] : '';

                        return [$numPart, $alphaPart];
                    })
                    ->values()
                    ->map(function($item) use($holdingWiseDcb){
                        $holding = $holdingWiseDcb->where("wardMstrId",$item->id);
                        $item->totalConsumer = $holding->count("id");
                        $item->arrearTax = roundFigure($holding->sum("arrearTax"));
                        $item->currentTax = roundFigure($holding->sum("currentTax"));
                        $item->totalTax = roundFigure($holding->sum("totalTax"));
                        $item->arrearCollection = roundFigure($holding->sum("arrearCollection"));
                        $item->currentCollection = roundFigure($holding->sum("currentCollection"));
                        $item->totalCollection = roundFigure($holding->sum("totalCollection"));
                        $item->totalCollectionProperty = $holding->where("totalCollection",">",0)->count("id");
                        $item->arrearOutstanding = roundFigure($holding->sum("arrearOutstanding"));
                        $item->currentOutstanding = roundFigure($holding->sum("currentOutstanding"));
                        $item->totalOutstanding = roundFigure($holding->sum("totalOutstanding"));
                        $item->totalOutstandingProperty = $holding->where("totalOutstanding",">",0)->count("id");
                        $item->advanceForThis = roundFigure($holding->sum("advanceForThis"));
                        $item->totalCurrentAdvance = roundFigure($holding->sum("totalCurrentAdvance"));
                        $item->totalCurrentAdjust = roundFigure($holding->sum("totalCurrentAdjust"));
                        $item->totalOutstandingAdvance = roundFigure($holding->sum("totalOutstandingAdvance"));
                        $item->totalOutstandingAdvanceProperty = $holding->where("totalOutstandingAdvance",">",0)->count("id");
                        $item->totalPenalty = roundFigure($holding->sum("penalty"));
                        $item->totalRebate = roundFigure($holding->sum("rebate"));
                        return $item;
                    });
            $summary =[
                "total"=>$ward->count(),
                "totalConsumer"=>($ward->sum("totalConsumer")),                
                "arrearTax"=>roundFigure($ward->sum("arrearTax")),
                "currentTax"=>roundFigure($ward->sum("currentTax")),
                "totalTax"=>roundFigure($ward->sum("totalTax")), 
                "arrearCollection"=>roundFigure($ward->sum("arrearCollection")),
                "currentCollection"=>roundFigure($ward->sum("currentCollection")),
                "totalCollection"=>roundFigure($ward->sum("totalCollection")),
                "totalCollectionProperty"=>($ward->sum("totalCollectionProperty")),  
                "arrearOutstanding"=>roundFigure($ward->sum("arrearOutstanding")),
                "currentOutstanding"=>roundFigure($ward->sum("currentOutstanding")),
                "totalOutstanding"=>roundFigure($ward->sum("totalOutstanding")),
                "totalOutstandingProperty"=>($ward->sum("totalOutstandingProperty")),  
                "advanceForThis"=>roundFigure($ward->sum("advanceForThis")),
                "totalCurrentAdvance"=>roundFigure($ward->sum("totalCurrentAdvance")),
                "totalCurrentAdjust"=>roundFigure($ward->sum("totalCurrentAdjust")),
                "totalOutstandingAdvance"=>roundFigure($ward->sum("totalOutstandingAdvance")),
                "totalOutstandingAdvanceProperty"=>($ward->sum("totalOutstandingAdvanceProperty")), 
                "totalPenalty"=>roundFigure($ward->sum("totalPenalty")), 
                "totalRebate"=>roundFigure($ward->sum("totalRebate")), 
            ]; 
            $data = arrayPaginator($ward,$request);
            $data["summary"]=$summary;
            return responseMsg(true,"Ward Wise DCB",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

}
