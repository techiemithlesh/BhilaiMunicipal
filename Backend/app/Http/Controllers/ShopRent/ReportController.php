<?php

namespace App\Http\Controllers\ShopRent;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopTransaction;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private $_SystemConstant;
    private $_MODULE_ID;
    private $_RoleTypeMstr;
    private $_User;
    private $_UlbMaster;
    private $_UlbWardMaster;
    private $_Shop;
    private $_ShopTransaction;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["SHOP"];

        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_UlbMaster  = new UlbMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_User = new User();
        $this->_Shop = new Shop();
        $this->_ShopTransaction = new ShopTransaction();
        
    }

    public function getPaymentMode(Request $request){
        try{
            $data=$this->_ShopTransaction->select(DB::raw("DISTINCT(upper(payment_mode)) AS payment_mode"))->get();
            return responseMsg(true,"Payment List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
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
                "shop_transactions.*",
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

            $shopTran = $this->_ShopTransaction->select(array_merge($commonSelect, [DB::raw("shops.consumer_no, shops.shop_no")]))                    
                    ->leftJoin("cheque_details","cheque_details.transaction_id","shop_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","shop_transactions.user_id")
                        ->where("shop_transactions.user_type","<>","ONLINE");
                    })
                    ->join("shops","shops.id","shop_transactions.shop_id")
                    ->leftJoin(DB::raw("(
                                        select shop_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from shop_owners
                                        where lock_status =false
                                        group by shop_id
                                    ) as w"),"w.shop_id","shop_transactions.shop_id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","shop_transactions.ward_mstr_id")
                    ->where("shop_transactions.lock_status",false)
                    ->whereIn("shop_transactions.payment_status",[1,2]);
            
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $shopTran->whereBetween("shop_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                }
                elseif($request->fromDate){
                    $shopTran->where("shop_transactions.tran_date",">=",$request->fromDate);
                }elseif($request->uptoDate){
                    $shopTran->where("shop_transactions.tran_date","<=",$request->uptoDate);
                }
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $shopTran->whereIn("shop_transactions.ward_mstr_id",$request->wardId);
            }
            if($request->paymentMode){
                if(!is_array($request->paymentMode)){
                    $request->merge(["paymentMode"=>[$request->paymentMode]]);
                }
                $shopTran->whereIn("shop_transactions.payment_mode",$request->paymentMode);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$shopTran] as $q) {
                    $q->where("shop_transactions.user_type", "<>", "ONLINE");
                    $q->whereIn("shop_transactions.user_id", $userIds);
                }
            }
            $data = $shopTran;

            if($request->all){
                $data = $data->get();
            }else{
                $data = paginator($data,$request);
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
            if (!$request->ulbId) {
                $request->merge(['ulbId' => $user->ulb_id]);
            }

            $data = $this->_ShopTransaction->select('*')
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
            $paymentModes = $this->_ShopTransaction->select(DB::raw("DISTINCT(UPPER(payment_mode)) AS payment_mode"))
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
}
