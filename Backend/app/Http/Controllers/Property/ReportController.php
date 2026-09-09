<?php

namespace App\Http\Controllers\Property;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyDemand;
use App\Models\Property\PropTransaction;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafDetail;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    //
    /**
     * create Date : 2025-07-14
     * status      : open
     */

    private $_SystemConstant;
    private $_MODULE_ID;
    private $_WorkflowMaster;
    private $_RoleTypeMstr;
    private $_User;
    private $_ActiveSafDetail;
    private $_RejectedSafDetail;
    private $_SafDetail;
    private $_PropertyDetail;
    private $_UlbMaster;
    private $_UlbWardMaster;
    private $_PropTransaction;
    private $_PropertyDemand;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["PROPERTY"];

        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_UlbMaster  = new UlbMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_User = new User();
        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_RejectedSafDetail = new RejectedSafDetail();
        $this->_SafDetail = new SafDetail();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_PropTransaction = new PropTransaction();
        $this->_PropertyDemand = new PropertyDemand();
        
    }

    public function getPaymentMode(Request $request){
        try{
            $data=$this->_PropTransaction->select(DB::raw("DISTINCT(upper(payment_mode)) AS payment_mode"))->get();
            return responseMsg(true,"Payment List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function propertyWfRoleList(Request $request){
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
                "prop_transactions.*",
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
            $summarySelect=[
                DB::raw(
                    "SUM (prop_transactions.payable_amt) as total_amount, COUNT(prop_transactions.id) as total_count"
                ),
            ];

            $activeSafTran = $this->_PropTransaction->select(array_merge($commonSelect, [DB::raw("null as holding_no"), "active_saf_details.saf_no",DB::raw("TRUE AS saf_tran")]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","prop_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","prop_transactions.user_id")
                        ->where("prop_transactions.user_type","<>","ONLINE");
                    })
                    ->join("active_saf_details","active_saf_details.id","prop_transactions.saf_detail_id")
                    ->leftJoin(DB::raw("(
                                        select saf_detail_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from active_saf_owner_details
                                        where lock_status =false
                                        group by saf_detail_id
                                    ) as w"),"w.saf_detail_id","prop_transactions.saf_detail_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","prop_transactions.ward_mstr_id")
                    ->where("prop_transactions.lock_status",false)
                    ->whereIn("prop_transactions.payment_status",[1,2]);
            $safTran = $this->_PropTransaction->select(array_merge($commonSelect, [DB::raw("null as holding_no"), "saf_details.saf_no",DB::raw("TRUE AS saf_tran")]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","prop_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","prop_transactions.user_id")
                        ->where("prop_transactions.user_type","<>","ONLINE");
                    })
                    ->join("saf_details","saf_details.id","prop_transactions.saf_detail_id")
                    ->leftJoin(DB::raw("(
                                        select saf_detail_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from saf_owner_details
                                        where lock_status =false
                                        group by saf_detail_id
                                    ) as w"),"w.saf_detail_id","prop_transactions.saf_detail_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","prop_transactions.ward_mstr_id")
                    ->where("prop_transactions.lock_status",false)
                    ->whereIn("prop_transactions.payment_status",[1,2]);

            $rejectedSafTran = $this->_PropTransaction->select(array_merge($commonSelect, [DB::raw("null as holding_no"), "rejected_saf_details.saf_no",DB::raw("TRUE AS saf_tran")]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","prop_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","prop_transactions.user_id")
                        ->where("prop_transactions.user_type","<>","ONLINE");
                    })
                    ->join("rejected_saf_details","rejected_saf_details.id","prop_transactions.saf_detail_id")
                    ->leftJoin(DB::raw("(
                                        select saf_detail_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from rejected_saf_owner_details
                                        where lock_status =false
                                        group by saf_detail_id
                                    ) as w"),"w.saf_detail_id","prop_transactions.saf_detail_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","prop_transactions.ward_mstr_id")
                    ->where("prop_transactions.lock_status",false)
                    ->whereIn("prop_transactions.payment_status",[1,2]);

            $propertyTran = $this->_PropTransaction->select(array_merge($commonSelect, [DB::raw("CASE WHEN property_details.new_holding_no IS NULL THEN property_details.holding_no ELSE property_details.new_holding_no END as holding_no"), DB::raw("null as saf_no"),DB::raw("CASE WHEN first_tran.min_id IS NOT NUll AND property_details.assessment_type='New Assessment' THEN TRUE ELSE FALSE END AS saf_tran")]))
                    ->leftJoin("cheque_details","cheque_details.transaction_id","prop_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","prop_transactions.user_id")
                        ->where("prop_transactions.user_type","<>","ONLINE");
                    })
                    ->leftJoin(DB::raw("(
                            SELECT MIN(id) AS min_id 
                            FROM prop_transactions 
                            WHERE lock_status = false 
                            GROUP BY property_detail_id 
                        ) AS first_tran"),"first_tran.min_id","prop_transactions.id")
                    ->join("property_details","property_details.id","prop_transactions.property_detail_id")
                    ->leftJoin(DB::raw("(
                                        select property_detail_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from property_owner_details
                                        where lock_status =false
                                        group by property_detail_id
                                    ) as w"),"w.property_detail_id","prop_transactions.property_detail_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","prop_transactions.ward_mstr_id")
                    ->where("prop_transactions.lock_status",false)
                    ->whereIn("prop_transactions.payment_status",[1,2]);
            if($request->appType){
                if(strtoupper($request->appType)=="PROPERTY"){
                    $activeSafTran->whereNotNull("prop_transactions.property_detail_id");
                    $safTran->whereNotNull("prop_transactions.property_detail_id");
                    $rejectedSafTran->whereNotNull("prop_transactions.property_detail_id");
                    $propertyTran->whereNotNull("prop_transactions.property_detail_id");
                }elseif(strtoupper($request->appType)=="SAF"){
                    $activeSafTran->whereNotNull("prop_transactions.saf_detail_id");
                    $safTran->whereNotNull("prop_transactions.saf_detail_id");
                    $rejectedSafTran->whereNotNull("prop_transactions.saf_detail_id");
                    $propertyTran->whereNotNull("prop_transactions.saf_detail_id");
                }
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $activeSafTran->whereBetween("prop_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                    $safTran->whereBetween("prop_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                    $rejectedSafTran->whereBetween("prop_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                    $propertyTran->whereBetween("prop_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                }
                elseif($request->fromDate){
                    $activeSafTran->where("prop_transactions.tran_date",">=",$request->fromDate);
                    $safTran->where("prop_transactions.tran_date",">=",$request->fromDate);
                    $rejectedSafTran->where("prop_transactions.tran_date",">=",$request->fromDate);
                    $propertyTran->where("prop_transactions.tran_date",">=",$request->fromDate);
                }elseif($request->uptoDate){
                    $activeSafTran->where("prop_transactions.tran_date","<=",$request->uptoDate);
                    $safTran->where("prop_transactions.tran_date","<=",$request->uptoDate);
                    $rejectedSafTran->where("prop_transactions.tran_date","<=",$request->uptoDate);
                    $propertyTran->where("prop_transactions.tran_date","<=",$request->uptoDate);
                }
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $activeSafTran->whereIn("prop_transactions.ward_mstr_id",$request->wardId);
                $safTran->whereIn("prop_transactions.ward_mstr_id",$request->wardId);
                $rejectedSafTran->whereIn("prop_transactions.ward_mstr_id",$request->wardId);
                $propertyTran->whereIn("prop_transactions.ward_mstr_id",$request->wardId);
            }
            if($request->paymentMode){
                if(!is_array($request->paymentMode)){
                    $request->merge(["paymentMode"=>[$request->paymentMode]]);
                }
                $activeSafTran->whereIn("prop_transactions.payment_mode",$request->paymentMode);
                $safTran->whereIn("prop_transactions.payment_mode",$request->paymentMode);
                $rejectedSafTran->whereIn("prop_transactions.payment_mode",$request->paymentMode);
                $propertyTran->whereIn("prop_transactions.payment_mode",$request->paymentMode);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$activeSafTran, $safTran, $rejectedSafTran, $propertyTran] as $q) {
                    $q->where("prop_transactions.user_type", "<>", "ONLINE");
                    $q->whereIn("prop_transactions.user_id", $userIds);
                }
            }
            
            $summaryQuery = (clone $activeSafTran)->select($summarySelect)
                            ->unionAll((clone $safTran)->select($summarySelect))
                            ->unionAll((clone $rejectedSafTran)->select($summarySelect))
                            ->unionAll((clone $propertyTran)->select($summarySelect));
            $data = $activeSafTran
                ->union($safTran)
                ->union($rejectedSafTran)
                ->union($propertyTran);
            if($request->all){
                $data = $data->get();
            }else{
                $data = paginator($data,$request);
                $summary = $this->_PropTransaction->getConnection()->table(DB::raw("({$summaryQuery->toSql()}) as sub"))
                            ->mergeBindings($summaryQuery->getQuery()) // Essential for where clause values
                            ->select(DB::raw("SUM(total_amount) as total_amount, SUM(total_count) as total_count"))
                            ->first();
                $data["summary"]=$summary;
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

            $data = $this->_PropTransaction->select('*')
                ->where('lock_status', false)
                ->whereIn('payment_status', [1, 2, 3]);

            // Filter by app type
            if ($request->appType) {
                $appType = strtoupper($request->appType);
                if ($appType === 'PROPERTY') {
                    $data->whereNotNull('property_detail_id');
                } elseif ($appType === 'SAF') {
                    $data->whereNotNull('saf_detail_id');
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
            $paymentModes = $this->_PropTransaction->select(DB::raw("DISTINCT(UPPER(payment_mode)) AS payment_mode"))
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

    public function wardWiseHolding(Request $request){
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
                $item->total_holding = $this->_PropertyDetail->where("ward_mstr_id",$item->id)
                                        ->where("ulb_id",$item->ulb_id)
                                        ->where("lock_status",false)
                                        ->count();
                return $item;
            });
            return responseMsg(true,"Ward Wise Holding",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function levelWisePendingSaf(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $request->ulbId ?? $user->ulb_id;

            $data = $this->_ActiveSafDetail->select("active_saf_details.id","active_saf_details.saf_no",
                            "active_saf_details.assessment_type","active_saf_details.zone_mstr_id",
                            "active_saf_details.ward_mstr_id",
                            "active_saf_details.current_role_id","active_saf_details.is_btc",
                            "active_saf_details.apply_date",
                            "w.owner_name","w.mobile_no","w.guardian_name",
                            "wm.ward_no",
                            )
                    ->leftJoin(DB::raw("(select saf_detail_id,
                            string_agg(owner_name,',') as owner_name,
                            string_agg(cast(mobile_no as varchar),',') as mobile_no,
                            string_agg(guardian_name,',') as guardian_name
                            from active_saf_owner_details
                            where lock_status=false
                            group by saf_detail_id
                    ) as w"),"w.saf_detail_id","active_saf_details.id")
                    ->join("ulb_ward_masters as wm","wm.id","active_saf_details.ward_mstr_id")
                    ->where("active_saf_details.payment_status","<>",0)
                    ->where("active_saf_details.is_btc",false)
                    ->where("active_saf_details.ulb_id",$ulbId);
            if($request->wardId){
                $wardIds = is_array($request->wardId) ? $request->wardId : [$request->wardId];
                $data->whereIn('active_saf_details.ward_mstr_id', $wardIds);
            }
            if($request->roleId){
                $roleId = is_array($request->roleId) ? $request->roleId : [$request->roleId];
                $data->whereIn('active_saf_details.current_role_id', $roleId);
            }
            if($request->fromDate && $request->uptoDate){
                $data->whereBetween('active_saf_details.apply_date', [$request->fromDate,$request->uptoDate]);
            }
            
            if($request->all){
                $data = $data->get();
                return responseMsg(true,"All Pending Saf",camelCase(remove_null($data)));
            }
            $list = paginator($data,$request);
            return responseMsg(true,"Pending Saf",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), '');
        }catch(Exception $e){
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function userWisePendingSaf(Request $request){
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
            $response = $this->levelWisePendingSaf($request);
            if(!$response->original["status"]){
                return $response;
            }
            $data = $response->original["data"];
            $responseData = $data;
            if($request->wardGroup){
                $responseData = $wardPermissionList->map(function($item)use($data){
                    $item->total_saf = collect($data)->where("wardMstrId",$item->id)->count();
                    return $item;
                });
            }
            return responseMsg(true,$user->name." Pending Saf",camelCase(remove_null($responseData)));
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), '');
        }catch(Exception $e){
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function roleUserWisePendingSaf(Request $request){
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
                $response = $this->userWisePendingSaf($request);
                if(!$response->original["status"]){
                    throw new CustomException($response->original["message"]);
                }
                $data = $response->original["data"];
                $user->total_saf = collect($data)->sum("totalSaf");
                $user->total_ward = collect($data)->count("id");
                return $user;

            });
            return responseMsg(true,trim($prefix, " & ")." Pending Saf",camelCase(remove_null($finalData)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function roleWisePendingSaf(Request $request){
        try{
            $request->merge(["onlyAction"=>true]);
            $roleResponse = $this->propertyWfRoleList($request);
            $data = $roleResponse->original["status"]?$roleResponse->original["data"]:collect();
            $roles = $this->_RoleTypeMstr->whereIn("id",$data->pluck("id")->unique())->get();
            if($request->roleId){
                $roles = $roles->where("id",$request->roleId)->values();
            }
            if($request->roleId){
                $roles = $roles->where("id",$request->roleId)->values();
            }
            $finalData = $roles->map(function($role) use($request){                
                $request->merge(["all"=>true,"roleId"=>$role->id]);
                $response = $this->levelWisePendingSaf($request);
                if(!$response->original["status"]){
                    throw new CustomException($response->original["message"]);
                }
                $data = $response->original["data"];
                $role->total_saf = collect($data)->count("id");
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

    public function holdingWiseDcb(Request $request){
        try{
            $fyear = $request->fyear??getFY();
            list($fromYear,$uptoYear) = explode("-",$fyear);
            $startDate = "{$fromYear}-04-01";
            $endDate   = "{$uptoYear}-03-31";

            $orm = $this->_PropertyDetail
                ->from("property_details as p")
                ->select(DB::raw("
                    p.id,p.holding_no,p.new_holding_no,p.prop_address,p.ward_mstr_id,p.prop_type_mstr_id,pt.property_type,wm.ward_no,w.owner_name,w.guardian_name, w.mobile_no ,
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
                ->join("ulb_ward_masters as wm","wm.id","p.ward_mstr_id")
                ->join("property_type_masters as pt","pt.id","p.prop_type_mstr_id")
                ->leftJoin(DB::raw("(
                        select property_detail_id,string_agg(owner_name,',') as owner_name , string_agg(guardian_name,',') as guardian_name, string_agg(cast(mobile_no as text),',') as mobile_no,
                        string_agg(email,',') as email
                        from property_owner_details
                        where lock_status=false
                        group by property_detail_id
                    ) as w
                "),"w.property_detail_id", "p.id")
                ->leftJoin(DB::raw("
                    (
                        select property_detail_id, sum(total_tax-adjust_amt) as total_tax, 
                            sum(case when fyear='{$fyear}' then total_tax-adjust_amt else 0 end) as current_tax,
                            sum(case when fyear<'{$fyear}' then total_tax-adjust_amt else 0 end) as arrear_tax
                        from property_demands
                        where lock_status=false and fyear<='{$fyear}'
                        group by property_detail_id                        
                    ) as demands
                "),"demands.property_detail_id", "p.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            c.property_detail_id, sum(c.total_tax) as total_collection, 
                            sum(case when c.fyear='{$fyear}' then c.total_tax else 0 end) as current_collection,
                            sum(case when c.fyear<'{$fyear}' then c.total_tax else 0 end) as arrear_collection
                        from property_collections as c
                        join prop_transactions as t on t.id = c.transaction_id
                        where c.lock_status=false and t.lock_status=false and t.payment_status in(1,2)
                            and t.tran_date between '{$startDate}' and '{$endDate}'
                        group by c.property_detail_id
                    ) as collection
                "),"collection.property_detail_id","p.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            c.property_detail_id, sum(c.total_tax) as total_priv_collection
                        from property_collections as c
                        join prop_transactions as t on t.id = c.transaction_id
                        where c.lock_status=false and t.lock_status=false and t.payment_status in(1,2)
                            and t.tran_date < '{$startDate}' 
                        group by c.property_detail_id
                    ) as priv_collection
                "),"priv_collection.property_detail_id","p.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.property_detail_id, sum(ad.amount) as total_priv_advance
                        from advance_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) < '{$startDate}'
                        group by ad.property_detail_id
                    ) as advance_priv
                "),"advance_priv.property_detail_id","p.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.property_detail_id, sum(ad.amount) as total_priv_adjust
                        from adjustment_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) < '{$startDate}'
                        group by ad.property_detail_id
                    ) as adjust_priv
                "),"adjust_priv.property_detail_id","p.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.property_detail_id, sum(ad.amount) as total_current_advance
                        from advance_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) between '{$startDate}' and '{$endDate}'
                        group by ad.property_detail_id
                    ) as current_advance
                "),"current_advance.property_detail_id","p.id")
                ->leftJoin(DB::raw("
                    (
                        select
                            ad.property_detail_id, sum(ad.amount) as total_current_adjust
                        from adjustment_details as ad
                        where ad.lock_status=false and cast(ad.created_at as date) between '{$startDate}' and '{$endDate}'
                        group by ad.property_detail_id
                    ) as current_adjust
                "),"current_adjust.property_detail_id","p.id")
                ->leftJoin(DB::raw("
                    (
                        select t.property_detail_id,
                            sum(case when rb.is_rebate=true then rb.amount else 0 end) as rebate,
                            sum(case when rb.is_rebate!=true then rb.amount else 0 end) as penalty 
                        from transaction_fine_rebate_details as rb
                        join prop_transactions as t on t.id = rb.transaction_id 
                        where rb.lock_status=false and t.lock_status=false and t.payment_status in(1,2)
                            and t.tran_date between '{$startDate}' and '{$endDate}'
                        group by t.property_detail_id
                    ) as penalty_rebate
                "),"penalty_rebate.property_detail_id","p.id");

            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $orm->whereIn("p.ward_mstr_id",$request->wardId);
            }
            if($request->propertyTypeId){
                if(!is_array($request->propertyTypeId)){
                    $request->merge(["propertyTypeId"=>[$request->propertyTypeId]]);
                }
                $orm->whereIn("p.prop_type_mstr_id",$request->propertyTypeId);
            }
            $summaryQuery = clone $orm;
            $orm->orderBy("p.ward_mstr_id");
            if(!$request->all){
                $data = paginator($orm,$request);
                $summary = $summaryQuery->select(DB::raw("
                    COUNT(p.id) as total_property,
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
            return responseMsg(true,"Holding Wise DCB",camelCase(remove_null($data)));
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
            $holdingWiseDcbResponse = $this->holdingWiseDcb($request);
            if(!$holdingWiseDcbResponse->original["status"]){
                throw new CustomException($holdingWiseDcbResponse->original["message"]);
            }
            $holdingWiseDcb = $holdingWiseDcbResponse->original["data"];
            $ulbWard = $this->_UlbWardMaster->select("*")
                ->where("ulb_id",$user->ulb_id);
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
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
                        $item->totalProperty = $holding->count("id");
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
                "totalProperty"=>($ward->sum("totalProperty")),                
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

    public function appliedSafList(Request $request){
        try{
            $fromDate = $uptoDate = Carbon::now()->format("Y-m-d");
            if($request->fromDate){
                $fromDate =$request->fromDate;
            }
            if($request->uptoDate){
                $uptoDate =$request->uptoDate;
            }
            $select=["id","assessment_type","holding_type","zone_mstr_id","ward_mstr_id","new_ward_mstr_id","apply_date"];
            $saf = $this->_SafDetail->select($select)->addSelect(DB::raw("'approve' as app_type"));
            $active = $this->_ActiveSafDetail->select($select)->addSelect(DB::raw("'pending' as app_type"));
            $rejected = $this->_RejectedSafDetail->select($select)->addSelect(DB::raw("'rejected' as app_type"));

            $saf->where("lock_status",false);
            $active->where("lock_status",false);
            $rejected->where("lock_status",false);

            $saf->whereBetween("apply_date",[$fromDate,$uptoDate]);
            $active->whereBetween("apply_date",[$fromDate,$uptoDate]);
            $rejected->whereBetween("apply_date",[$fromDate,$uptoDate]);
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $saf->whereIn("ward_mstr_id",$request->wardId);
                $active->whereIn("ward_mstr_id",$request->wardId);
                $rejected->whereIn("ward_mstr_id",$request->wardId);
            }
            if($request->propertyTypeId){
                if(!is_array($request->propertyTypeId)){
                    $request->merge(["propertyTypeId"=>[$request->propertyTypeId]]);
                }
                $saf->whereIn("prop_type_mstr_id",$request->propertyTypeId);
                $active->whereIn("prop_type_mstr_id",$request->propertyTypeId);
                $rejected->whereIn("prop_type_mstr_id",$request->propertyTypeId);
            }
            $orm = $saf->union($active)->union($rejected)->orderBy("ward_mstr_id");
            if(!$request->all){
                $data = paginator($orm,$request);
            }else{
                $data = $orm->get();
            }
            return responseMsg(true,"Apply Saf",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function wardWiseAppliedList(Request $request){
        try{
            $user = Auth::user();
            $request->merge(["all"=>true]);
            $holdingWiseDcbResponse = $this->appliedSafList($request);
            if(!$holdingWiseDcbResponse->original["status"]){
                throw new CustomException($holdingWiseDcbResponse->original["message"]);
            }
            $holdingWiseDcb = $holdingWiseDcbResponse->original["data"];
            $ulbWard = $this->_UlbWardMaster->select("*")
                ->where("ulb_id",$user->ulb_id);
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
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
                        $new = $holding->where("assessmentType","New Assessment");
                        $re = $holding->where("assessmentType","Reassessment");
                        $mu = $holding->where("assessmentType","Mutation");
                        $item->totalProperty = $holding->count("id");
                        $item->newAssessmentProperty = $new->count("id");
                        $item->reAssessmentProperty = $re->count("id");
                        $item->mutationProperty = $mu->count("id");
                        return $item;
                    });
            $summary =[
                "total"=>$ward->count(),
                "newAssessmentProperty"=>($ward->sum("newAssessmentProperty")),
                "reAssessmentProperty"=>($ward->sum("reAssessmentProperty")),
                "mutationProperty"=>($ward->sum("mutationProperty")),
                "totalProperty"=>($ward->sum("totalProperty")),
            ]; 
            $data = arrayPaginator($ward,$request);
            $data["summary"]=$summary;
            return responseMsg(true,"Ward Wise Applied Saf",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function dateWiseAppliedSaf(Request $request){
        try{
            $rules=[
                "fromDate"=>"required|date|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "uptoDate"=>"required|date|before_or_equal:".Carbon::now()->format("Y-m-d"),
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            
            $request->merge(["all"=>true]);
            $holdingWiseDcbResponse = $this->appliedSafList($request);
            if(!$holdingWiseDcbResponse->original["status"]){
                throw new CustomException($holdingWiseDcbResponse->original["message"]);
            }
            $holdingWiseDcbResponse = $holdingWiseDcbResponse->original["status"]?$holdingWiseDcbResponse->original["data"]:collect();

            $fromDate = Carbon::parse($request->fromDate);
            $uptoDate = Carbon::parse( $request->uptoDate);
            $response = collect();


            while($fromDate->lte($uptoDate)){
                $date = $fromDate->clone()->format("Y-m-d");
                $prop = $holdingWiseDcbResponse->where("applyDate",$date);
                $response->push([
                    "date"=> $fromDate->clone()->format("Y-m-d"),
                    "totalProperty"=>$prop->count("id"),
                ]);
                $fromDate = $fromDate->addDay();
            }

            $data = [
                "data"=>$response,
                "summary"=>[
                    'fromDate'=>$response->min("date"),
                    'uptoDate'=>$response->max("date"),
                    "total"=>$response->count(),
                    "totalProperty"=>$response->sum("totalProperty"),
                ],                
            ];
            return responseMsg(true,"Date Wise Applied",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }  
    }

    public function dateWisePropertyCreated(Request $request)
    {
        try {
            // 1. Initialize Dates safely
            $fromDateStr = $request->fromDate ?? Carbon::now()->format("Y-m-d");
            $uptoDateStr = $request->uptoDate ?? Carbon::now()->format("Y-m-d");

            // 2. Fetch Property Details
            $createdProperty = $this->_PropertyDetail
                ->select(DB::raw(" 
                    property_details.created_at::DATE as created_date,
                    COUNT(property_details.id) as total_property, 
                    COUNT(CASE WHEN entry_type = 'Existing' THEN property_details.id END) AS total_existing_property,
                    COUNT(CASE WHEN assessment_type = 'New Assessment' THEN property_details.id END) AS total_new_assess_property
                "))
                ->where("property_details.lock_status", false)
                ->whereBetween(DB::raw("property_details.created_at::date"), [$fromDateStr, $uptoDateStr])
                ->groupBy(DB::raw("property_details.created_at::date"))
                ->get();

            // 3. Fetch Demands
            $demandAndBalance = $this->_PropertyDemand
                ->join("property_details","property_details.id","property_demands.property_detail_id")
                ->select(DB::raw(" 
                    property_demands.created_at::DATE as created_date,
                    COUNT(DISTINCT(property_demands.property_detail_id)) as total_property,
                    COUNT(DISTINCT(CASE WHEN balance_tax > 0 THEN property_demands.property_detail_id END)) AS due_property, 
                    SUM(property_demands.total_tax) AS total_tax,
                    SUM(property_demands.balance_tax) AS balance_tax
                "))
                ->where("property_demands.lock_status", false)
                ->whereBetween(DB::raw("property_demands.created_at::date"), [$fromDateStr, $uptoDateStr])
                ->groupBy(DB::raw("property_demands.created_at::date"))
                ->get();

            // 4. Loop through date range to build response
            $start = Carbon::parse($fromDateStr);
            $end = Carbon::parse($uptoDateStr);
            $response = collect();

            while ($start->lte($end)) {
                $currentDate = $start->format("Y-m-d");

                // Use first() to get the actual object for that date
                $prop = $createdProperty->where("created_date", $currentDate)->first();
                $demandDue = $demandAndBalance->where("created_date", $currentDate)->first();

                $response->push([
                    "date"                   => $currentDate,
                    "totalProperty"          => $prop->total_property ?? 0,
                    "totalExistingProperty"  => $prop->total_existing_property ?? 0,
                    "totalNewAssessProperty" => $prop->total_new_assess_property ?? 0,
                    "demandTotalProperty"    => $demandDue->total_property ?? 0,
                    "dueProperty"            => $demandDue->due_property??0,
                    "totalTax"               => $demandDue->total_tax ?? 0,
                    "balanceTax"             => $demandDue->balance_tax ?? 0,
                ]);

                $start->addDay();
            }

            // 5. Final Data Structure
            $data = [
                "data" => $response,
                "summary" => [
                    'fromDate'               => $fromDateStr,
                    'uptoDate'               => $uptoDateStr,
                    "totalDays"              => $response->count(),
                    "totalProperty"          => $response->sum("totalProperty"),
                    "totalExistingProperty"  => $response->sum("totalExistingProperty"),
                    "totalNewAssessProperty" => $response->sum("totalNewAssessProperty"),
                    "demandTotalProperty"    => $response->sum("demandTotalProperty"),
                    "dueProperty"            => $response->sum("dueProperty"),
                    "totalTax"               => $response->sum("totalTax"),
                    "balanceTax"             => $response->sum("balanceTax"),
                ],
            ];

            return responseMsg(true, "Date Wise Created Property", camelCase(remove_null($data)));

        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), "");
        }
    }

    public function monthWiseCreatedProperty(Request $request)
    {
        try {
            $fromDate = Carbon::parse($request->fromDate)->startOfMonth()->format("Y-m-d");
            $uptoDate = Carbon::parse($request->uptoDate ?? $request->fromDate)->endOfMonth()->format("Y-m-d");

            // Merge back to request so the dateWise function uses these bounds
            $request->merge(["fromDate" => $fromDate, "uptoDate" => $uptoDate]);

            $dateWiseResponse = $this->dateWisePropertyCreated($request);
            $res = $dateWiseResponse->original;

            if (!$res["status"]) {
                throw new Exception($res["message"]);
            }

            // 2. Ensure we are working with a Collection
            // Note: Accessing ['data']['data'] because the response usually wraps it in a 'data' key
            $dailyData = collect($res["data"]["data"] ?? []);

            // 3. Group by Month and Year
            $monthWiseData = $dailyData->groupBy(function ($item) {
                return Carbon::parse($item['date'])->format('Y-m');
            })->map(function ($daysInMonth, $monthKey) {
                return [
                    "month"                  => Carbon::parse($monthKey)->format("F Y"),
                    "monthKey"               => $monthKey,
                    "totalProperty"          => $daysInMonth->sum("totalProperty"),
                    "totalExistingProperty"  => $daysInMonth->sum("totalExistingProperty"),
                    "totalNewAssessProperty" => $daysInMonth->sum("totalNewAssessProperty"),
                    "demandTotalProperty"    => $daysInMonth->sum("demandTotalProperty"),
                    "dueProperty"            => $daysInMonth->sum("dueProperty"),
                    "totalTax"               => $daysInMonth->sum("totalTax"),
                    "balanceTax"             => $daysInMonth->sum("balanceTax"),
                ];
            })->values();

            // 4. Final Data Structure
            $data = [
                "data" => $monthWiseData,
                "summary" => [
                    'fromDate'               => $monthWiseData->first()['monthKey'] ?? null,
                    'uptoDate'               => $monthWiseData->last()['monthKey'] ?? null,
                    "totalMonths"            => $monthWiseData->count(),
                    "totalProperty"          => $monthWiseData->sum("totalProperty"),
                    "totalExistingProperty"  => $monthWiseData->sum("totalExistingProperty"),
                    "totalNewAssessProperty" => $monthWiseData->sum("totalNewAssessProperty"),
                    "demandTotalProperty"    => $monthWiseData->sum("demandTotalProperty"),
                    "dueProperty"            => $monthWiseData->sum("dueProperty"),
                    "totalTax"               => $monthWiseData->sum("totalTax"),
                    "balanceTax"             => $monthWiseData->sum("balanceTax"),
                ],
            ];

            return responseMsg(true, "Month Wise Created Property", camelCase(remove_null($data)));

        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), "");
        }
    }


}
