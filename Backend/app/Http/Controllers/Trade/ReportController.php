<?php

namespace App\Http\Controllers\Trade;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\RejectedTradeLicense;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseLog;
use App\Models\Trade\TradeTransaction;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    //
    /**
     * create Date : 2025-08-11
     * status      : open
     */

    private $_SystemConstant;
    private $_MODULE_ID;
    private $_WorkflowMaster;
    private $_RoleTypeMstr;
    private $_User;
    private $_ActiveTradeLicense;
    private $_RejectedTradeLicense;
    private $_TradeLicense;
    private $_TradeLicenseLog;
    private $_UlbMaster;
    private $_UlbWardMaster;
    private $_TradeTransaction;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["TRADE"];

        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_UlbMaster  = new UlbMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_User = new User();
        $this->_ActiveTradeLicense = new ActiveTradeLicense();
        $this->_RejectedTradeLicense = new RejectedTradeLicense();
        $this->_TradeLicense = new TradeLicense();
        $this->_TradeLicenseLog = new TradeLicenseLog();
        $this->_TradeTransaction = new TradeTransaction();
        
    }

    public function getPaymentMode(Request $request){
        try{
            $data=$this->_TradeTransaction->select(DB::raw("DISTINCT(upper(payment_mode)) AS payment_mode"))->get();
            return responseMsg(true,"Payment List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function tradeWfRoleList(Request $request){
        try{
            $user = Auth::user();
            $wf=$this->_WorkflowMaster->where("module_id",$this->_MODULE_ID)->first();
            $roleIds=$wf->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->get();
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
                "tran.*",
                "chd.cheque_no",
                "chd.cheque_date",
                "chd.bank_name",
                "chd.branch_name",
                "wm.ward_no",
                "u.name as user_name",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "t.application_no",
                "a.application_type"
            ];
            $summarySelect=[
                DB::raw(
                    "SUM (tran.payable_amt) as total_amount, COUNT(tran.id) as total_count"
                ),
            ];

            $activeTradeTran = $this->_TradeTransaction->select($commonSelect)
                    ->from('trade_transactions as tran')
                    ->leftJoin("cheque_details as chd","chd.transaction_id","tran.id")
                    ->leftJoin("users as u",function($join){
                        $join->on("u.id","tran.user_id")
                        ->where("tran.user_type","<>","ONLINE");
                    })
                    ->join("active_trade_licenses as t","t.id","tran.trade_license_id")
                    ->join("application_type_masters  as a","a.id","t.application_type_id")
                    ->leftJoin(DB::raw("(
                                        select trade_license_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from active_trade_license_owner_details
                                        where lock_status =false
                                        group by trade_license_id
                                    ) as w"),"w.trade_license_id","tran.trade_license_id")
                    ->leftJoin("ulb_ward_masters as wm","wm.id","tran.ward_mstr_id")
                    ->where("tran.lock_status",false)
                    ->whereIn("tran.payment_status",[1,2]);
            $tradeTran = $this->_TradeTransaction->select($commonSelect)
                    ->from('trade_transactions as tran')
                    ->leftJoin("cheque_details as chd","chd.transaction_id","tran.id")
                    ->leftJoin("users as u",function($join){
                        $join->on("u.id","tran.user_id")
                        ->where("tran.user_type","<>","ONLINE");
                    })
                    ->join("trade_licenses as t","t.id","tran.trade_license_id")
                    ->join("application_type_masters  as a","a.id","t.application_type_id")
                    ->leftJoin(DB::raw("(
                                        select trade_license_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from trade_license_owner_details
                                        where lock_status =false
                                        group by trade_license_id
                                    ) as w"),"w.trade_license_id","tran.trade_license_id")
                    ->leftJoin("ulb_ward_masters as wm","wm.id","tran.ward_mstr_id")
                    ->where("tran.lock_status",false)
                    ->whereIn("tran.payment_status",[1,2]);

            $rejectedTradeTran = $this->_TradeTransaction->select($commonSelect)
                    ->from('trade_transactions as tran')
                    ->leftJoin("cheque_details as chd","chd.transaction_id","tran.id")
                    ->leftJoin("users as u",function($join){
                        $join->on("u.id","tran.user_id")
                        ->where("tran.user_type","<>","ONLINE");
                    })
                    ->join("rejected_trade_licenses as t","t.id","tran.trade_license_id")
                    ->join("application_type_masters  as a","a.id","t.application_type_id")
                    ->leftJoin(DB::raw("(
                                        select trade_license_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from rejected_trade_license_owner_details
                                        where lock_status =false
                                        group by trade_license_id
                                    ) as w"),"w.trade_license_id","tran.trade_license_id")
                    ->leftJoin("ulb_ward_masters as wm","wm.id","tran.ward_mstr_id")
                    ->where("tran.lock_status",false)
                    ->whereIn("tran.payment_status",[1,2]);

            $tradeLogTran = $this->_TradeTransaction->select($commonSelect) 
                    ->from('trade_transactions as tran')
                    ->leftJoin("cheque_details as chd","chd.transaction_id","tran.id")
                    ->leftJoin("users as u",function($join){
                        $join->on("u.id","tran.user_id")
                        ->where("tran.user_type","<>","ONLINE");
                    })
                    ->join("trade_license_logs as t","t.id","tran.trade_license_id")
                    ->join("application_type_masters  as a","a.id","t.application_type_id")
                    ->leftJoin(DB::raw("(
                                        select trade_license_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from trade_license_owner_details_logs
                                        where lock_status =false
                                        group by trade_license_id
                                    ) as w"),"w.trade_license_id","tran.trade_license_id")
                    ->leftJoin("ulb_ward_masters as wm","wm.id","tran.ward_mstr_id")
                    ->where("tran.lock_status",false)
                    ->whereIn("tran.payment_status",[1,2]);
            
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $activeTradeTran->whereBetween("tran.tran_date",[$request->fromDate,$request->uptoDate]);
                    $tradeTran->whereBetween("tran.tran_date",[$request->fromDate,$request->uptoDate]);
                    $rejectedTradeTran->whereBetween("tran.tran_date",[$request->fromDate,$request->uptoDate]);
                    $tradeLogTran->whereBetween("tran.tran_date",[$request->fromDate,$request->uptoDate]);
                }
                elseif($request->fromDate){
                    $activeTradeTran->where("tran.tran_date",">=",$request->fromDate);
                    $tradeTran->where("tran.tran_date",">=",$request->fromDate);
                    $rejectedTradeTran->where("tran.tran_date",">=",$request->fromDate);
                    $tradeLogTran->where("tran.tran_date",">=",$request->fromDate);
                }elseif($request->uptoDate){
                    $activeTradeTran->where("tran.tran_date","<=",$request->uptoDate);
                    $tradeTran->where("tran.tran_date","<=",$request->uptoDate);
                    $rejectedTradeTran->where("tran.tran_date","<=",$request->uptoDate);
                    $tradeLogTran->where("tran.tran_date","<=",$request->uptoDate);
                }
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $activeTradeTran->whereIn("tran.ward_mstr_id",$request->wardId);
                $tradeTran->whereIn("tran.ward_mstr_id",$request->wardId);
                $rejectedTradeTran->whereIn("tran.ward_mstr_id",$request->wardId);
                $tradeLogTran->whereIn("tran.ward_mstr_id",$request->wardId);
            }
            if($request->paymentMode){
                if(!is_array($request->paymentMode)){
                    $request->merge(["paymentMode",[$request->paymentMode]]);
                }
                $activeTradeTran->whereIn("tran.payment_mode",$request->paymentMode);
                $tradeTran->whereIn("tran.payment_mode",$request->paymentMode);
                $rejectedTradeTran->whereIn("tran.payment_mode",$request->paymentMode);
                $tradeLogTran->whereIn("tran.payment_mode",$request->paymentMode);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$activeTradeTran, $tradeTran, $rejectedTradeTran, $tradeLogTran] as $q) {
                    $q->where("tran.user_type", "<>", "ONLINE");
                    $q->whereIn("tran.user_id", $userIds);
                }
            }
            $summaryQuery = (clone $activeTradeTran)->select($summarySelect)
                            ->unionAll((clone $tradeTran)->select($summarySelect))
                            ->unionAll((clone $rejectedTradeTran)->select($summarySelect))
                            ->unionAll((clone $tradeLogTran)->select($summarySelect));
            $data = $activeTradeTran
                ->union($tradeTran)
                ->union($rejectedTradeTran)
                ->union($tradeLogTran);
                
            if($request->all){
                $data = $data->get();
            }else{
                $data = paginator($data,$request);
                $summary = $this->_TradeTransaction->getConnection()->table(DB::raw("({$summaryQuery->toSql()}) as sub"))
                            ->mergeBindings($summaryQuery->getQuery()) // Essential for where clause values
                            ->select(DB::raw("SUM(total_amount) as total_amount, SUM(total_count) as total_count"))
                            ->first();
                $data["summary"]=$summary;
            }
            return responseMsg(true,"Transaction List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
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

            $data = $this->_TradeTransaction->select('*')
                ->where('lock_status', false)
                ->whereIn('payment_status', [1, 2, 3]);

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
            $paymentModes = $this->_TradeTransaction->select(DB::raw("DISTINCT(UPPER(payment_mode)) AS payment_mode"))
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

    public function wardWiseTrade(Request $request){
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
                $item->total_trade = $this->_TradeLicense->where("ward_mstr_id",$item->id)
                                        ->where("ulb_id",$item->ulb_id)
                                        ->where("lock_status",false)
                                        ->count();
                return $item;
            });
            return responseMsg(true,"Ward Wise Trade",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function levelWisePendingTrade(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $request->ulbId ?? $user->ulb_id;

            $data = $this->_ActiveTradeLicense->select("active_trade_licenses.id","active_trade_licenses.application_no",
                            "active_trade_licenses.application_type_id","application_type_masters.application_type",
                            "active_trade_licenses.ward_mstr_id",
                            "active_trade_licenses.current_role_id","active_trade_licenses.is_btc",
                            "active_trade_licenses.apply_date",
                            "w.owner_name","w.mobile_no","w.guardian_name",
                            "wm.ward_no",
                            )
                    ->leftJoin(DB::raw("(select trade_license_id,
                            string_agg(owner_name,',') as owner_name,
                            string_agg(cast(mobile_no as varchar),',') as mobile_no,
                            string_agg(guardian_name,',') as guardian_name
                            from active_trade_license_owner_details
                            where lock_status=false
                            group by trade_license_id
                    ) as w"),"w.trade_license_id","active_trade_licenses.id")
                    ->join("ulb_ward_masters as wm","wm.id","active_trade_licenses.ward_mstr_id")
                    ->leftJoin("application_type_masters","application_type_masters.id","active_trade_licenses.application_type_id")
                    ->where("active_trade_licenses.payment_status","<>",0)
                    ->where("active_trade_licenses.is_btc",false)
                    ->where("active_trade_licenses.ulb_id",$ulbId);
            if($request->wardId){
                $wardIds = is_array($request->wardId) ? $request->wardId : [$request->wardId];
                $data->whereIn('active_trade_licenses.ward_mstr_id', $wardIds);
            }
            if($request->roleId){
                $roleId = is_array($request->roleId) ? $request->roleId : [$request->roleId];
                $data->whereIn('active_trade_licenses.current_role_id', $roleId);
            }
            if($request->fromDate && $request->uptoDate){
                $data->whereBetween('active_trade_licenses.apply_date', [$request->fromDate,$request->uptoDate]);
            }
            
            if($request->all){
                $data = $data->get();
                return responseMsg(true,"All Pending Trade",camelCase(remove_null($data)));
            }
            $list = paginator($data,$request);
            return responseMsg(true,"Pending Trade",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), '');
        }catch(Exception $e){
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function userWisePendingTrade(Request $request){
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
            $response = $this->levelWisePendingTrade($request);
            if(!$response->original["status"]){
                return $response;
            }
            $data = $response->original["data"];
            $responseData = $data;
            if($request->wardGroup){
                $responseData = $wardPermissionList->map(function($item)use($data){
                    $item->total_trade = collect($data)->where("wardMstrId",$item->id)->count();
                    return $item;
                });
            }
            return responseMsg(true,$user->name." Pending Trade",camelCase(remove_null($responseData)));
        }catch(CustomException $e){
            return responseMsg(false, $e->getMessage(), '');
        }catch(Exception $e){
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function roleUserWisePendingTrade(Request $request){
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
                $response = $this->userWisePendingTrade($request);
                if(!$response->original["status"]){
                    throw new CustomException($response->original["message"]);
                }
                $data = $response->original["data"];
                $user->total_trade = collect($data)->sum("totalTrade");
                $user->total_ward = collect($data)->count("id");
                return $user;

            });
            return responseMsg(true,trim($prefix, " & ")." Pending trade",camelCase(remove_null($finalData)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function roleWisePendingTrade(Request $request){
        try{
            $roles = $this->_RoleTypeMstr->whereIn("id",[5,6,7,9,10,11])->get();
            if($request->roleId){
                $roles = $roles->where("id",$request->roleId)->values();
            }
            $finalData = $roles->map(function($role) use($request){                
                $request->merge(["all"=>true,"roleId"=>$role->id]);
                $response = $this->levelWisePendingTrade($request);
                if(!$response->original["status"]){
                    throw new CustomException($response->original["message"]);
                }
                $data = $response->original["data"];
                $role->total_trade = collect($data)->count("id");
                $role->total_user = $role->getUsers()->orderBy("id","ASC")->count();
                return $role;
            });           
            return responseMsg(true,"Role Pending Trade",camelCase(remove_null($finalData)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function licenseStatus(Request $request){
        try{
            // $currentDate = 
            $user = Auth::user();
            if(!$request->ulbId){
                $request->merge(["ulbId"=>$user->ulb_id]);
            }
            $trade = $this->_TradeLicense
                ->select("t.id","t.application_no","t.license_no","t.firm_name",'t.address','t.valid_from','t.valid_upto','t.license_date',
                    "p.new_holding_no","w.owner_name",'w.guardian_name','w.mobile_no',
                    // DB::raw("CASE WHEN t.valid_upto")
                )
                ->from("trade_licenses as t")
                ->leftJoin("property_details as p","p.id","t.property_detail_id")
                ->leftJoin("application_type_masters as apt","apt.id","t.application_type_id")
                ->leftJoin(DB::raw("(
                                    select trade_license_id,
                                        string_agg(owner_name,',') as owner_name, 
                                        string_agg(guardian_name,',') as guardian_name,
                                        string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                    from trade_license_owner_details
                                    where lock_status =false
                                    group by trade_license_id
                                ) as w"),"w.trade_license_id","t.id")
                ->leftJoin("ulb_ward_masters as wm","wm.id","t.ward_mstr_id")
                ->where("t.lock_status",false);
            if($request->key){
                $trade->where(function($where)use($request){
                    $where->where("application_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("license_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                        ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $trade->whereIn("wm.id",$request->wardId);
            }
            if($request->appStatus){
                switch($request->appStatus){
                    case"VALID" : $trade->where("t.valid_upto",">=",Carbon::now()->format("Y-m-d"));
                                break;
                    case"EXPIRE" : $trade->where("t.valid_upto","<",Carbon::now()->format("Y-m-d"));
                                break;
                    case"TOBEEXPIRE" : $trade->whereBetween("t.valid_upto",[Carbon::now()->format("Y-m-d"),Carbon::now()->addMonth()->format("Y-m-d")]);
                                break;
                }
            }
            if($request->all){
                $data = $trade->get();
                return responseMsg(true,"All Trade",camelCase(remove_null($data)));
            }
            $data = paginator($trade,$request);
            return responseMsg(true,"License Fetched",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }
}
