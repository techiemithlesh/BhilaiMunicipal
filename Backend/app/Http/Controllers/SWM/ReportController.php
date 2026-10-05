<?php

namespace App\Http\Controllers\SWM;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\DriverDetail;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\VehicleDetail;
use App\Models\DBSystem\VehicleMovementLog;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\SWM\CategoryTypeMaster;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerTransaction;
use App\Models\SWM\ConsumerWastCollectionLog;
use App\Models\User;
use App\Trait\SWM\ConsumerTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    use ConsumerTrait;

    private $_SystemConstant;
    private $_MODULE_ID;
    private $_WorkflowMaster;
    private $_RoleTypeMstr;
    private $_User;
    private $_Consumer;
    private $_CategoryTypeMaster;
    private $_UlbMaster;
    private $_UlbWardMaster;
    private $_ConsumerTransaction;
    private $_ConsumerWastCollectionLog;
    private $_VehicleDetail;
    private $_DriverDetail;
    private $_VehicleMovementLog;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["SWM"];

        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_UlbMaster  = new UlbMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_User = new User();

        $this->_VehicleDetail = new VehicleDetail();
        $this->_DriverDetail = new DriverDetail();
        $this->_VehicleMovementLog = new VehicleMovementLog();

        $this->_Consumer = new Consumer();
        $this->_CategoryTypeMaster = new CategoryTypeMaster();
        $this->_ConsumerTransaction = new ConsumerTransaction();
        $this->_ConsumerWastCollectionLog = new ConsumerWastCollectionLog();
        
    }

    public function getPaymentMode(Request $request){
        try{
            $data=$this->_ConsumerTransaction->select(DB::raw("DISTINCT(upper(payment_mode)) AS payment_mode"))->get();
            return responseMsg(true,"Payment List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function collectionReport(Request $request){
        try{DB::connection($this->_Consumer->getConnectionName())->enableQueryLog();
            $user = Auth::user();
            if(!$request->ulbId){
                $request->merge(["ulbId"=>$user->ulb_id]);
            }
            $commonSelect = [
                "consumers.consumer_no",
                "consumers.address",
                "consumers.holding_no",
                "consumer_transactions.*",
                "cheque_details.cheque_no",
                "cheque_details.cheque_date",
                "cheque_details.bank_name",
                "cheque_details.branch_name",
                "ulb_ward_masters.ward_no",
                "users.name as user_name",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "c.rate",
                "category_type_masters.category_type",
                "sub_category_type_masters.sub_category_type",
            ];

            $summarySelect=[
                DB::raw(
                    "SUM (consumer_transactions.payable_amt) as total_amount, COUNT(consumer_transactions.id) as total_count"
                ),
            ];

            $consumerTran = $this->_ConsumerTransaction->select($commonSelect)                    
                    ->leftJoin("cheque_details","cheque_details.transaction_id","consumer_transactions.id")
                    ->leftJoin("users",function($join){
                        $join->on("users.id","consumer_transactions.user_id")
                        ->where("consumer_transactions.user_type","<>","ONLINE");
                    })
                    ->join("consumers","consumers.id","consumer_transactions.consumer_id")
                    ->leftJoin("category_type_masters","category_type_masters.id","consumers.category_type_master_id")
                    ->leftJoin("sub_category_type_masters","sub_category_type_masters.id","consumers.sub_category_type_master_id")
                    ->leftJoin(DB::raw("(
                                        select consumer_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from consumer_owners
                                        where lock_status =false
                                        group by consumer_id
                                    ) as w"),"w.consumer_id","consumer_transactions.consumer_id")
                    ->leftJoin(DB::raw("(
                                        select consumer_demands_collections.transaction_id,
                                            string_agg(DISTINCT(rate::text),',') as rate 
                                        from consumer_demands_collections
                                        JOIN consumer_demands ON consumer_demands.id = consumer_demands_collections.consumer_demand_id
                                        where consumer_demands_collections.lock_status =false
                                        group by consumer_demands_collections.transaction_id
                                    ) as c"),"c.transaction_id","consumer_transactions.id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","consumer_transactions.ward_mstr_id")
                    ->where("consumer_transactions.lock_status",false)
                    ->whereIn("consumer_transactions.payment_status",[1,2]);
            
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){                    
                    $consumerTran->whereBetween("consumer_transactions.tran_date",[$request->fromDate,$request->uptoDate]);
                }
                elseif($request->fromDate){
                    $consumerTran->where("consumer_transactions.tran_date",">=",$request->fromDate);
                }elseif($request->uptoDate){
                    $consumerTran->where("consumer_transactions.tran_date","<=",$request->uptoDate);
                }
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $consumerTran->whereIn("consumer_transactions.ward_mstr_id",$request->wardId);
            }
            if($request->paymentMode){
                if(!is_array($request->paymentMode)){
                    $request->merge(["paymentMode"=>[$request->paymentMode]]);
                }
                $consumerTran->whereIn("consumer_transactions.payment_mode",$request->paymentMode);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$consumerTran] as $q) {
                    $q->where("consumer_transactions.user_type", "<>", "ONLINE");
                    $q->whereIn("consumer_transactions.user_id", $userIds);
                }
            }
            $summaryQuery = (clone $consumerTran)->select($summarySelect);
            $data = $consumerTran;
            if($request->all){
                $data = $data->get();
               return responseMsg(true,"Transaction List Fetched",camelCase(remove_null($data))); 
            }

            $data = paginator($data,$request);
            $summary = $this->_ConsumerTransaction->getConnection()->table(DB::raw("({$summaryQuery->toSql()}) as sub"))
                        ->mergeBindings($summaryQuery->getQuery()) // Essential for where clause values
                        ->select(DB::raw("SUM(total_amount) as total_amount, SUM(total_count) as total_count"))
                        ->first();
            $data["summary"]=$summary;
            // dd(DB::connection($this->_Consumer->getConnectionName())->getQueryLog());
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

            $data = $this->_ConsumerTransaction->select('*')
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
            $paymentModes = $this->_ConsumerTransaction->select(DB::raw("DISTINCT(UPPER(payment_mode)) AS payment_mode"))
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

    public function teamSummary(Request $request){
        try{
            $rule=[
                "fromDate"=>"required|date",
                "uptoDate"=>"required|date",
                "tlId"=>"nullable|digits_between:1,9223372036854775807",
                "userId"=>"nullable|digits_between:1,9223372036854775807",
            ];
            $request->merge(["all"=>true]);
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }

            if(!$request->userId && $request->tlId){
                $tcIds = $this->_User->where("lock_status",false)->where("report_to",$request->tlId)->get();
                $request->merge(["userId"=>$tcIds->pluck("id")]);
            }
            $users = $this->_User->where("lock_status",false);

            if($request->userId)
            $users->whereIn("id",$request->userId);

            $users = $users->get();
            $collection = $this->collectionReport($request);
            if(!$collection->original["status"]){
                throw new CustomException($collection->original["message"]);
            }
            $collection = $collection->original["data"];

            $data = $users->map(function($item)use($collection){
                $userCollection = $collection->where("userId",$item->id);
                $ward = $item->getUserWards()->get();
                $item->permittedWard = $ward->pluck("ward_no")->implode(" , ");
                $item->wardList = $ward;
                $item->amount = roundFigure($userCollection->sum("payableAmt"));
                $item->count = $userCollection->count("id");
                return $item;
            });

            return responseMsg(true,"Team Summary Fetched",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
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
                $data = $this->_Consumer->select(DB::raw("COUNT(id) as total_consumer, COUNT(CASE WHEN rf_id IS NOT NULL THEN id ELSE NULL END) as total_rf_id_consumer, COUNT(CASE WHEN rf_id IS NULL THEN id ELSE NULL END) as total_not_rf_id_consumer "))
                        ->where("ward_mstr_id",$item->id)
                        ->where("ulb_id",$item->ulb_id)
                        ->where("lock_status",false)
                        ->first();
                $item->total_consumer = $data->total_consumer;
                $item->total_rf_id_consumer = $data->total_rf_id_consumer;
                $item->total_not_rf_id_consumer = $data->total_not_rf_id_consumer;
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
                    c.id,c.consumer_no,c.address,c.ward_mstr_id,c.holding_no,
                    ct.category_type,wm.ward_no,w.owner_name,w.guardian_name, w.mobile_no ,
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
                ->join("category_type_masters as ct","ct.id","c.category_type_master_id")                
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
                        join consumer_transactions as t on t.id = c.transaction_id
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
                        join consumer_transactions as t on t.id = c.transaction_id
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
                        join consumer_transactions as t on t.id = rb.transaction_id 
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
            if($request->categoryTypeId){
                if(!is_array($request->categoryTypeId)){
                    $request->merge(["categoryTypeId"=>[$request->categoryTypeId]]);
                }
                $orm->whereIn("c.category_type_master_id",$request->categoryTypeId);
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

    public function consumerDueList(Request $request){
        try{
            $orm = $this->_Consumer
                ->select(DB::raw("
                    c.id,c.consumer_no,c.address,c.ward_mstr_id,c.holding_no,
                    ct.category_type,wm.ward_no,w.owner_name,w.guardian_name, w.mobile_no ,
                    demands.demand_from,demands.demand_upto,demands.total_tax
                "))
                ->from("consumers as c")     
                ->join("ulb_ward_masters as wm","wm.id","c.ward_mstr_id") 
                ->join("category_type_masters as ct","ct.id","c.category_type_master_id")           
                ->join(DB::raw("
                    (
                        select consumer_id, sum(balance) as total_tax,
                            min(demand_from) as demand_from,
                            max(demand_upto) as demand_upto
                        from consumer_demands
                        where lock_status=false and is_full_paid=false
                        group by consumer_id                        
                    ) as demands
                "),"demands.consumer_id", "c.id")
                ->leftJoin(DB::raw("(
                        select consumer_id,string_agg(owner_name,',') as owner_name , string_agg(guardian_name,',') as guardian_name, string_agg(cast(mobile_no as text),',') as mobile_no,
                        string_agg(email,',') as email
                        from consumer_owners
                        where lock_status=false
                        group by consumer_id
                    ) as w
                "),"w.consumer_id", "c.id");

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
                    SUM((COALESCE(demands.total_tax,0)))as total_tax
                "))->first();
                $data["summary"]=$summary;
            }else{
                $data = $orm->get();
            }
            return responseMsg(true,"Due Consumer List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function consumerTypeList(Request $request){
        try{
            $user = Auth::user();
            if (!$request->ulbId) {
                $request->merge(['ulbId' => $user->ulb_id]);
            }
            $orm = $this->_CategoryTypeMaster
                    ->from("category_type_masters as ct")
                    ->select(DB::raw("
                        ct.*,
                        (COALESCE(c.total_consumer,0)) as total_consumer
                    "))
                    ->leftJoin(DB::raw("(
                        select count(id) as total_consumer,category_type_master_id
                        from consumers
                        where lock_status = false
                        group by category_type_master_id
                    ) as c"),"c.category_type_master_id","ct.id")
                    ->where("ct.lock_status",false);


            if($request->categoryTypeId){
                if(!is_array($request->categoryTypeId)){
                    $request->merge(["categoryTypeId"=>[$request->categoryTypeId]]);
                }
                $orm->whereIn("c.category_type_master_id",$request->categoryTypeId);
            }

            $summaryQuery = clone $orm;
            $orm->orderBy("ct.id","ASC");
            if(!$request->all){
                $data = paginator($orm,$request);
                $summary = $summaryQuery->select(DB::raw("
                    COUNT(ct.id) as total,
                    SUM((COALESCE(c.total_consumer,0))) as total_consumer
                "))->first();
                $data["summary"]=$summary;
            }else{
                $data = $orm->get();
            }
            return responseMsg(true,"Consumer Type List",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {dd($e);
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function dateWiseCollection(Request $request){
        try{
            $request->merge(["all"=>true]);
            $collection = $this->collectionReport($request);
            if(!$collection->original["status"]){
                return $collection;
            }
            
            $collection = $collection->original["data"];
            $fromDate = Carbon::parse($request->fromDate);
            $uptoDate = Carbon::parse( $request->uptoDate);
            $response = collect();
            while($fromDate->lte($uptoDate)){
                $date = $fromDate->clone()->format("Y-m-d");
                $coll = $collection->where("tranDate",$date);
                $response->push([
                    "date"=> $fromDate->clone()->format("Y-m-d"),
                    "amount"=>roundFigure($coll->sum("payableAmt")),
                    "consumer"=>($coll->unique("consumer_id")->count()),
                    "count"=>($coll->count()),
                ]);
                $fromDate = $fromDate->addDay();
            }
            $data = [
                "data"=>$response,
                "summary"=>[
                    'fromDate'=>$response->min("date"),
                    'uptoDate'=>$response->max("date"),
                    "total"=>$response->count(),
                    "amount"=>roundFigure($response->sum("amount")),
                    "consumer"=>$response->sum("consumer"),
                    "count"=>$response->sum("count"),
                ],                
            ];
            return responseMsg(true,"Date Wise Collection",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }


    public function appliedConnectionList(Request $request){
        try{
            $fromDate = $uptoDate = Carbon::now()->format("Y-m-d");
            if($request->fromDate){
                $fromDate =$request->fromDate;
            }
            if($request->uptoDate){
                $uptoDate =$request->uptoDate;
            }
            $app = $this->_Consumer
                    ->select(
                        "consumers.id","consumers.consumer_no","consumers.apply_date",
                        "consumers.category_type_master_id",
                        "consumers.sub_category_type_master_id",
                        "consumers.ward_mstr_id",
                        "consumers.user_id",
                        "ulb_ward_masters.ward_no",
                        "ctm.category_type",
                        "sctm.sub_category_type",
                        "users.name as user_name",
                        "w.owner_name",
                        "w.guardian_name",
                        "w.mobile_no",
                    )
                    ->join("category_type_masters as ctm", "ctm.id", "consumers.category_type_master_id")
                    ->join("sub_category_type_masters as sctm", "sctm.id", "consumers.sub_category_type_master_id")
                    ->leftJoin(DB::raw("(
                                        select consumer_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from consumer_owners
                                        where lock_status =false
                                        group by consumer_id
                                    ) as w"),"w.consumer_id","consumers.id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","consumers.ward_mstr_id")
                    ->leftJoin("users","users.id","consumers.user_id");

            $app->where("consumers.lock_status",false);

            $app->whereBetween("consumers.apply_date",[$fromDate,$uptoDate]);
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $app->whereIn("consumers.ward_mstr_id",$request->wardId);
            }
            if($request->userId){
                if(!is_array($request->userId)){
                    $request->merge(["userId"=>[$request->userId]]);
                }
                $app->whereIn("consumers.user_id",$request->userId);
            }
            if($request->categoryTypeMasterId){
                if(!is_array($request->categoryTypeMasterId)){
                    $request->merge(["categoryTypeMasterId"=>[$request->categoryTypeMasterId]]);
                }
                $app->whereIn("consumers.category_type_master_id",$request->categoryTypeMasterId);
            }
            $orm = $app->orderBy("consumers.apply_date");
            if(!$request->all){
                $data = paginator($orm,$request);
            }else{
                $data = $orm->get();
            }
            return responseMsg(true,"Apply Connection",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function wardWiseAppliedList(Request $request){
        try{
            $user = Auth::user();
            $request->merge(["all"=>true]);
            $holdingWiseDcbResponse = $this->appliedConnectionList($request);
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
                        $item->totalConsumer = $holding->count("id");
                        return $item;
                    });
            $summary =[
                "total"=>$ward->count(),
                "totalConsumer"=>($ward->sum("totalConsumer")),
            ]; 
            $data = arrayPaginator($ward,$request);
            $data["summary"]=$summary;
            return responseMsg(true,"Ward Wise Applied Connection",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function userWiseApplyConnection(Request $request){
        try{
            $user = Auth::user();
            $request->merge(["all"=>true]);
            $holdingWiseDcbResponse = $this->appliedConnectionList($request);
            if(!$holdingWiseDcbResponse->original["status"]){
                throw new CustomException($holdingWiseDcbResponse->original["message"]);
            }
            $holdingWiseDcb = $holdingWiseDcbResponse->original["data"];
            $userIds = $holdingWiseDcb->pluck("userId")->unique();
            
            $user = $this->_User->select("*")
                ->where("ulb_id",$user->ulb_id);
            if($request->userId){
                if(!is_array($request->userId)){
                    $request->merge(["userId"=>[$request->userId]]);
                }
                $user->whereIn("id",$request->userId);
            }
            $user->orderBy("id","ASC");
            $data = $user->get()
                    ->map(function($item) use($holdingWiseDcb){
                        $holding = $holdingWiseDcb->where("userId",$item->id);
                        $item->totalConsumer = $holding->count("id");
                        return $item;
                    });
            $summary =[
                "total"=>$data->count(),
                "totalConsumer"=>($data->sum("totalConsumer")),
            ]; 
            $data = arrayPaginator($data,$request);
            $data["summary"]=$summary;
            return responseMsg(true,"Ward Wise Applied Connection",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function visitingReport(Request $request){
        try{
            $user = Auth::user();
            if(!$request->ulbId){
                $request->merge(["ulbId"=>$user->ulb_id]);
            }
            $commonSelect = [
                "consumers.consumer_no",
                "consumers.holding_no",
                "consumers.ward_mstr_id",
                "consumer_wast_collection_logs.*",
                "users.name as user_name",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "ulb_ward_masters.ward_no"
            ];

            $consumerTran = $this->_ConsumerWastCollectionLog->select($commonSelect)  
                    ->join("consumers","consumers.id","consumer_wast_collection_logs.consumer_id")  
                    ->leftJoin("users",function($join){
                        $join->on("users.id","consumer_wast_collection_logs.user_id");
                    })
                    
                    ->leftJoin(DB::raw("(
                                        select consumer_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from consumer_owners
                                        where lock_status =false
                                        group by consumer_id
                                    ) as w"),"w.consumer_id","consumers.id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","consumers.ward_mstr_id")
                    ->where("consumer_wast_collection_logs.lock_status",false);
            
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){                    
                    $consumerTran->whereBetween("consumer_wast_collection_logs.visiting_date",[$request->fromDate,$request->uptoDate]);
                }
                elseif($request->fromDate){
                    $consumerTran->where("consumer_wast_collection_logs.visiting_date",">=",$request->fromDate);
                }elseif($request->uptoDate){
                    $consumerTran->where("consumer_wast_collection_logs.visiting_date","<=",$request->uptoDate);
                }
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $consumerTran->whereIn("consumers.ward_mstr_id",$request->wardId);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$consumerTran] as $q) {;
                    $q->whereIn("consumer_wast_collection_logs.user_id", $userIds);
                }
            }
            $data = $consumerTran;
            if($request->all){
                $data = $data->get();
               return responseMsg(true,"Visiting List Fetched",camelCase(remove_null($data))); 
            }

            $data = paginator($data,$request);
            return responseMsg(true,"Visiting List Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error!!","");
        }
    }

    public function dateVisitedConsumer(Request $request){
        try{
            $request->merge(["all"=>true]);
            $collection = $this->visitingReport($request);
            if(!$collection->original["status"]){
                return $collection;
            }
            
            $collection = $collection->original["data"];
            $fromDate = Carbon::parse($request->fromDate);
            $uptoDate = Carbon::parse( $request->uptoDate);
            $response = collect();
            while($fromDate->lte($uptoDate)){
                $date = $fromDate->clone()->format("Y-m-d");
                $coll = $collection->where("visitingDate",$date);
                $response->push([
                    "date"=> $fromDate->clone()->format("Y-m-d"),
                    "consumer"=>($coll->unique("consumerId")->count()),
                    "count"=>($coll->count()),
                ]);
                $fromDate = $fromDate->addDay();
            }
            $data = [
                "data"=>$response,
                "summary"=>[
                    'fromDate'=>$response->min("date"),
                    'uptoDate'=>$response->max("date"),
                    "total"=>$response->count(),
                    "consumer"=>$response->sum("consumer"),
                    "count"=>$response->sum("count"),
                ],                
            ];
            return responseMsg(true,"Date Wise Visiting",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function consumerRFIDmaped(Request $request){
        try{
            $data = $this->consumerMetaDataList()
            ->leftJoin("users AS rf_id_install_users","rf_id_install_users.id","app.rf_id_install_by")
            ->addSelect("app.rf_id","rf_id_install_users.name as install_by", "app.rf_id_install_date");
            if($request->keyWord){
                $data->where(function($where)use($request){
                    $where->where("app.consumer_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("app.holding_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");

                });                
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("app.ward_mstr_id",$request->wardId);
            }
            if($request->has("isRfIdMap")){
                if($request->isRfIdMap){
                    $data->whereNotNull("app.rf_id");
                }elseif($request->isRfIdMap===false ){
                    $data->whereNull("app.rf_id");
                }
            }
            $data->orderBy("app.id","ASC");
            if($request->all){
                $data = $data->get();
               return responseMsg(true,"data Fetched",camelCase(remove_null($data))); 
            }
            $list = paginator($data,$request);
            return responseMsg(true,"data Fetched",camelCase(remove_null($list)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function getVehicleTodayLog(Request $request){
        try{
            $date = Carbon::parse($request->date)->format("Y-m-d");
            $vehicle = $this->_VehicleDetail->where("lock_status",false)->get();
            $log = $this->_VehicleMovementLog
                    ->select("vehicle_movement_logs.*","vehicle_driver_maps.vehicle_id","vehicle_driver_maps.driver_id")
                    ->join("vehicle_driver_maps","vehicle_driver_maps.id","vehicle_movement_logs.vehicle_driver_map_id")
                    ->where("vehicle_movement_logs.lock_status",false)
                    ->where(DB::raw("vehicle_movement_logs.created_at::date"),$date)
                    ->orderBy("vehicle_movement_logs.id","ASC")
                    ->get();
            $data = $vehicle->map(function($item)use($log){
                $path = $log->where("vehicle_id",$item->id)->sortBy('id');
                $last = $path->last();
                $driver = $this->_DriverDetail->find($last?->driver_id);
                $item->type = "truck";
                $item->path = $path;
                $item->latitude = $last?->latitude;
                $item->longitude = $last?->longitude;
                $item->driver_name = $driver?->driver_name;                
                return $item;
            });
            return responseMsg(true,"Vehicle Movement",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {dd($e);
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function consumerWestCollection(Request $request){
        try{
            $date = Carbon::parse($request->date)->format("Y-m-d");
            $log = $this->_ConsumerWastCollectionLog
                    ->select("id","visiting_date","visiting_time","consumer_id")
                    ->where("lock_status",false)
                    ->where("visiting_date",$date)
                    ->orderBy("consumer_id","ASC")
                    ->get();
            return responseMsg(true,"Consumer Visited Log",$log);
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {dd($e);
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function getConsumerLocation(Request $request){
        try{
            $date = Carbon::parse($request->date)->format("Y-m-d");
            $log = $this->_Consumer
                    ->select("consumers.id","consumers.consumer_no","consumers.rf_id","consumers.holding_no",
                        "consumers.latitude",
                        "consumers.longitude")
                    ->where("consumers.lock_status",false)
                    ->orderBy("consumers.id","ASC")
                    ->get();
            return responseMsg(true,"Consumer Visited Log",$log);
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function todayWestCollectNotCollectConsumer(Request $request){
        try{
            $date = Carbon::parse($request->date)->format("Y-m-d");
            $isVisited = $request->isVisited;
            $commonSelect = [                
                "consumer_wast_collection_logs.*",
                DB::raw("consumers.id as consumer_id"),
                "consumers.consumer_no",
                "consumers.holding_no",
                "consumers.ward_mstr_id",
                "users.name as user_name",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "ulb_ward_masters.ward_no"
            ];

            $consumerTran = $this->_Consumer->select($commonSelect) 
                    ->leftJoin("consumer_wast_collection_logs",function($join)use($date){
                        $join->on("consumer_wast_collection_logs.consumer_id","consumers.id")
                        ->where("consumer_wast_collection_logs.visiting_date",$date)                        
                        ->where("consumer_wast_collection_logs.lock_status",false);
                    })  
                    ->leftJoin("users",function($join){
                        $join->on("users.id","consumer_wast_collection_logs.user_id");
                    })
                    
                    ->leftJoin(DB::raw("(
                                        select consumer_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from consumer_owners
                                        where lock_status =false
                                        group by consumer_id
                                    ) as w"),"w.consumer_id","consumers.id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","consumers.ward_mstr_id");
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $consumerTran->whereIn("consumers.ward_mstr_id",$request->wardId);
            }
            if($isVisited){                
                $consumerTran->whereNotNull("consumer_wast_collection_logs.id");
            }else{
                $consumerTran->whereNull("consumer_wast_collection_logs.id");
            }
            $data = $consumerTran;
            if($request->all){
                $data = $data->get();
               return responseMsg(true,"Visiting List Fetched",camelCase(remove_null($data))); 
            }
            $data = paginator($data,$request);
            return responseMsg(true,"Visiting List Fetched",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function wardWiseWestCollection(Request $request){
        try{
            $user = Auth::user();
            $request->merge(["all"=>true]);
            $todayCollection = $this->todayWestCollectNotCollectConsumer($request);
            if(!$todayCollection->original["status"]){
                return $todayCollection;
            }
            $todayWastCollection = collect($todayCollection->original["data"]);

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
                    ->map(function($item) use($todayWastCollection){
                        $holding = $todayWastCollection->where("wardMstrId",$item->id);
                        $item->totalConsumer = $holding->count("consumerId");
                        return $item;
                    });
            $summary =[
                "total"=>$ward->count(),
                "totalConsumer"=>($ward->sum("totalConsumer")),
            ]; 
            $data = arrayPaginator($ward,$request);
            $data["summary"]=$summary;
            return responseMsg(true,"Ward Wise Consumer Visited",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }

    public function addedConsumersList(Request $request){
        try{
            $user = Auth::user();
            $fromDate = $uptoDate = Carbon::now()->format("Y-m-d");
            if($request->fromDate){
                $fromDate =$request->fromDate;
            }
            if($request->uptoDate){
                $uptoDate =$request->uptoDate;
            }
            $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
            $isActive = $request->isActive;
            $commonSelect = [                
                "consumers.*",
                "users.name as user_name","users.user_img",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "ulb_ward_masters.ward_no",
                "deactivate_user.name AS deactivated_by_user_name","deactivate_user.user_img AS deactivated_by_user_img",
                "consumer_deactivations.created_at AS deactivated_date",
                "consumer_deactivations.remarks",
                "consumer_deactivations.doc_path",
            ];
            $consumer = $this->_Consumer->select($commonSelect)  
                    ->leftJoin("users",function($join){
                        $join->on("users.id","consumers.user_id");
                    })
                    
                    ->leftJoin(DB::raw("(
                                        select consumer_id,
                                            string_agg(owner_name,',') as owner_name, 
                                            string_agg(guardian_name,',') as guardian_name,
                                            string_agg(CAST(mobile_no AS text),',') as mobile_no 
                                        from consumer_owners
                                        where lock_status =false
                                        group by consumer_id
                                    ) as w"),"w.consumer_id","consumers.id")
                    ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","consumers.ward_mstr_id")                     
                    ->leftJoin("consumer_deactivations",function($join){
                        $join->on("consumer_deactivations.consumer_id","consumers.id")                     
                        ->where("consumer_deactivations.lock_status",false);
                    })
                    ->leftJoin("users AS deactivate_user",function($join){
                        $join->on("deactivate_user.id","consumer_deactivations.user_id");
                    });
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $consumer->whereIn("consumers.ward_mstr_id",$request->wardId);
            }            
            if($isActive){                
                $consumer->where("consumers.lock_status",false)
                ->whereBetween("consumers.apply_date",[$fromDate,$uptoDate]);
                if($request->userId){
                    $consumer->whereIn("consumers.user_id", $userIds);
                }
            }else{
                $consumer->whereNotNull("consumer_deactivations.id")
                ->whereBetween(DB::raw("CAST(consumer_deactivations.created_at AS DATE)"),[$fromDate,$uptoDate]);
                if($request->userId){
                    $consumer->whereIn("consumer_deactivations.user_id", $userIds);
                }
            }
            $data = $consumer;
            if($request->all){
                $data = $data->get();
               return responseMsg(true,"Consumer List Fetched",camelCase(remove_null($data))); 
            }
            $data = paginator($data,$request);
            $data["data"] = collect($data["data"])->map(function($item){ 
                $item->doc_path = $item->doc_path ? trim(Config::get("app.url"),'\\/')."/".$item->doc_path:"";
                $item->user_img = $item->user_img ? trim(Config::get("app.url"),'\\/')."/".$item->user_img:"";
                $item->deactivated_by_user_img = $item->deactivated_by_user_img ? trim(Config::get("app.url"),'\\/')."/".$item->deactivated_by_user_img:"";
                return $item;
            });
            
            return responseMsg(true,"Consumer List",camelCase(remove_null($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), '');
        } catch (Exception $e) {
            return responseMsg(false, 'Internal Server Error!!', '');
        }
    }
    
}
