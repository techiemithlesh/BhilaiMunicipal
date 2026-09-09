<?php

namespace App\Http\Controllers;

use App\Bll\Property\TransactionDeactivationBll;
use App\Bll\Trade\TransactionDeactivationBll as TradeTransactionDeactivationBll;
use App\Bll\Water\TransactionDeactivationBll as WaterTransactionDeactivationBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Property\ReportController as PropertyReportController;
use App\Http\Controllers\Trade\ReportController as TradeReportController;
use App\Http\Controllers\Water\ReportController as WaterReportController;
use App\Models\DBSystem\ModuleMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ChequeDetail;
use App\Models\Property\PropertyCollection;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropTransaction;
use App\Models\Property\PropTransactionDeactivation;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafDetail;
use App\Models\Property\SwmChequeDetail;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\ChequeDetail as TradeChequeDetail;
use App\Models\Trade\RejectedTradeLicense;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseLog;
use App\Models\Trade\TradeTransaction;
use App\Models\Trade\TradeTransactionDeactivation;
use App\Models\User;
use App\Models\Water\ChequeDetail as WaterChequeDetail;
use App\Models\Water\Consumer;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterRejectedApplication;
use App\Models\Water\WaterTransaction;
use App\Models\Water\WaterTransactionDeactivation;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
class AccountController extends Controller
{
    //
    private $_SystemConstant;
    private $_MODULE_ID;
    private $_User;
    private $_ModuleMaster;
    private $_PropTransaction;
    private $_PropertyDetail;
    private $_ActiveSafDetail;
    private $_SafDetail;
    private $_RejectedSaf;
    private $_PropTransactionDeactivation;

    private $_WaterTransaction;
    private $_WaterActiveApplication;
    private $_WaterApplication;
    private $_WaterRejectedApplication;
    private $_Consumer;
    private $_WaterTransactionDeactivation;

    private $_TradeTransaction;
    private $_ActiveTradeLicense;
    private $_TradeLicense;
    private $_RejectedTradeLicense;
    private $_TradeLicenseLog;
    private $_TradeTransactionDeactivation;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["ACCOUNT"];  

        $this->_User = new User();
        $this->_ModuleMaster = new ModuleMaster();

        $this->_PropTransaction = new PropTransaction();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_SafDetail = new SafDetail();
        $this->_RejectedSaf = new RejectedSafDetail();
        $this->_PropTransactionDeactivation = new PropTransactionDeactivation();

        $this->_WaterTransaction = new WaterTransaction();
        $this->_WaterActiveApplication = new WaterActiveApplication();
        $this->_WaterApplication = new WaterApplication();
        $this->_WaterRejectedApplication = new WaterRejectedApplication();
        $this->_Consumer = new Consumer();
        $this->_WaterTransactionDeactivation = new WaterTransactionDeactivation();

        $this->_TradeTransaction = new TradeTransaction();
        $this->_ActiveTradeLicense = new ActiveTradeLicense();
        $this->_TradeLicense = new TradeLicense();
        $this->_RejectedTradeLicense = new RejectedTradeLicense();
        $this->_TradeLicenseLog = new TradeLicenseLog();
        $this->_TradeTransactionDeactivation = new TradeTransactionDeactivation();
    }

    private function begin(){
        DB::connection($this->_PropTransaction->getConnectionName())->beginTransaction();
        DB::connection($this->_WaterTransaction->getConnectionName())->beginTransaction();
        DB::connection($this->_TradeTransaction->getConnectionName())->beginTransaction();
    }
    private function rollBack(){
        DB::connection($this->_PropTransaction->getConnectionName())->rollBack();
        DB::connection($this->_WaterTransaction->getConnectionName())->rollBack();
        DB::connection($this->_TradeTransaction->getConnectionName())->rollBack();
    }
    private function commit(){
        DB::connection($this->_PropTransaction->getConnectionName())->commit();
        DB::connection($this->_WaterTransaction->getConnectionName())->commit();
        DB::connection($this->_TradeTransaction->getConnectionName())->commit();
    }

    public function userList(Request $request){
        try{
            $rules = [
                "userId"=>"nullable|integer|exists:".$this->_User->getConnectionName().".".$this->_User->getTable().",id",
                "fromDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "uptoDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d")
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $propTran = $this->_PropTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->where("user_type","!=","ONLINE")->whereBetween("tran_date",[$request->fromDate,$request->uptoDate]);
            $waterTran = $this->_WaterTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->where("user_type","!=","ONLINE")->whereBetween("tran_date",[$request->fromDate,$request->uptoDate]);
            $tradeTran = $this->_TradeTransaction->where("lock_status",false)->whereIn("payment_status",[1,2])->where("user_type","!=","ONLINE")->whereBetween("tran_date",[$request->fromDate,$request->uptoDate]);
            if($request->userId){
                $propTran->where("user_id",$request->userId);
                $waterTran->where("user_id",$request->userId);
                $tradeTran->where("user_id",$request->userId);
            }
            $propTran = $propTran->get();
            $waterTran = $waterTran->get();
            $tradeTran = $tradeTran->get();
            
            $userIds = $propTran->pluck("user_id");
            $userIds = $userIds->merge($waterTran->pluck("user_id"));
            $userIds = $userIds->merge($tradeTran->pluck("user_id"));
            $uniqueId = $userIds->unique();
            $data = $this->_User->whereIn("id",$uniqueId->toArray())
                    ->orderBy("id","ASC")
                    ->get()
                    ->map(function($item)use($propTran,$waterTran,$tradeTran){
                        $prop = $propTran->where("user_id",$item->id);
                        $water = $waterTran->where("user_id",$item->id);
                        $trade = $tradeTran->where("user_id",$item->id);
                        $propVerified = $prop->where("verification_status",1);
                        $waterVerified = $water->where("verification_status",1);
                        $tradeVerified = $trade->where("verification_status",1);

                        $item->property_amount = roundFigure($prop->sum("payable_amt"));
                        $item->property_verified_amount = roundFigure($propVerified->sum("payable_amt"));
                        $item->property_count = ($prop->count());

                        $item->water_amount = roundFigure($water->sum("payable_amt"));
                        $item->water_verified_amount = roundFigure($waterVerified->sum("payable_amt"));
                        $item->water_count = ($water->count());

                        $item->trade_amount = roundFigure($trade->sum("payable_amt"));
                        $item->trade_verified_amount = roundFigure($tradeVerified->sum("payable_amt"));
                        $item->trade_count = ($trade->count());

                        $item->total_amount = roundFigure($item->property_amount + $item->water_amount + $item->trade_amount);
                        $item->total_verified_amount = roundFigure($item->property_verified_amount + $item->water_verified_amount + $item->trade_verified_amount);
                        $item->total_app = ($item->property_count + $item->water_count + $item->trade_count);
                        $item->user_img = $item->user_img ? url("/")."/".$item->user_img : null;
                        return $item;
                    });
            return responseMsg(true,"Data Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function userCash(Request $request){
        try{
            $rules = [
                "userId"=>"required|integer|exists:".$this->_User->getConnectionName().".".$this->_User->getTable().",id",
                "fromDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "uptoDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d")
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $allUser = $this->_User->all();
            $user = $this->_User->find($request->userId);
            $user->user_img = $user->user_img ? url("/")."/".$user->user_img : null;
            $propTran = $this->_PropTransaction->where("lock_status",false)
                        ->whereIn("payment_status",[1,2])
                        ->where("user_id",$user->id)->where("user_type","!=","ONLINE")
                        ->whereBetween("tran_date",[$request->fromDate,$request->uptoDate])
                        ->orderBy("id","ASC")
                        ->get()
                        ->map(function($item) use($allUser){
                            $item->verified_by_user_name = $allUser->where("id",$item->verified_by)->first()?->name;
                            $item->app_no =null;
                            if($item->property_detail_id){
                                $property = $this->_PropertyDetail->find($item->property_detail_id);
                                $item->app_no = $property ? ($property->new_holding_no ? $property->new_holding_no : $property->holding_no) : null;
                            }else{
                                $saf = $this->_ActiveSafDetail->find($item->saf_detail_id);
                                if(!$saf){
                                    $saf = $this->_SafDetail->find($item->saf_detail_id);
                                }
                                if(!$saf){
                                    $saf = $this->_RejectedSaf->find($item->saf_detail_id);
                                }
                                $item->app_no = $saf?->saf_no;
                            }
                            $cheque = $item->getChequeDtl();
                            $item->cheque_no = $cheque?->cheque_no;
                            $item->cheque_date = $cheque?->cheque_date;
                            $item->bank_name = $cheque?->bank_name;
                            $item->branch_name = $cheque?->branch_name;
                            return $item;
                        });
            $waterTran = $this->_WaterTransaction->where("lock_status",false)
                        ->whereIn("payment_status",[1,2])
                        ->where("user_id",$user->id)->where("user_type","!=","ONLINE")
                        ->whereBetween("tran_date",[$request->fromDate,$request->uptoDate])
                        ->orderBy("id","ASC")
                        ->get()
                        ->map(function($item)  use($allUser){
                            $item->verified_by_user_name = $allUser->where("id",$item->verified_by)->first()?->name;
                            $item->app_no =null;
                            if($item->consumer_id){
                                $item->app_no = $this->_Consumer->find($item->consumer_id)?->consumer_no;
                            }else{
                                $app = $this->_WaterActiveApplication->find($item->application_id);
                                if(!$app){
                                    $app = $this->_WaterApplication->find($item->application_id);
                                }
                                if(!$app){
                                    $app = $this->_WaterRejectedApplication->find($item->application_id);
                                }
                                $item->app_no = $app?->application_no;
                            }
                            $cheque = $item->getChequeDtl();
                            $item->cheque_no = $cheque?->cheque_no;
                            $item->cheque_date = $cheque?->cheque_date;
                            $item->bank_name = $cheque?->bank_name;
                            $item->branch_name = $cheque?->branch_name;
                            return $item;
                        });
            $tradeTran = $this->_TradeTransaction->where("lock_status",false)
                        ->whereIn("payment_status",[1,2])
                        ->where("user_id",$user->id)->where("user_type","!=","ONLINE")
                        ->whereBetween("tran_date",[$request->fromDate,$request->uptoDate])
                        ->orderBy("id","ASC")
                        ->get()
                        ->map(function($item) use($allUser){
                            $item->verified_by_user_name = $allUser->where("id",$item->verified_by)->first()?->name;
                            $app = $this->_ActiveTradeLicense->find($item->application_id);
                            if(!$app){
                                $app = $this->_TradeLicense->find($item->application_id);
                            }
                            if(!$app){
                                $app = $this->_RejectedTradeLicense->find($item->application_id);
                            }
                            if(!$app){
                                $app = $this->_TradeLicenseLog->find($item->application_id);
                            }
                            $item->app_no = $app?->application_no;
                            $cheque = $item->getChequeDtl();
                            $item->cheque_no = $cheque?->cheque_no;
                            $item->cheque_date = $cheque?->cheque_date;
                            $item->bank_name = $cheque?->bank_name;
                            $item->branch_name = $cheque?->branch_name;
                            return $item;
                        });
            $paymentModeSummary = Collect(Config::get("SystemConstant.PAYMENT_MODE"))
                                ->map(function($item)use($propTran,$waterTran,$tradeTran){
                                    $prop = $propTran->where("payment_mode",$item);
                                    $water = $waterTran->where("payment_mode",$item);
                                    $trade = $tradeTran->where("payment_mode",$item);
                                    return [
                                        "mode"=>$item,
                                        "amount"=>roundFigure($prop->sum("payable_amt") + $water->sum("payable_amt") + $trade->sum("payable_amt")),
                                    ];
                                });
            $data=[
                "userDtl"=>$user,
                "paymentModeSummary"=>$paymentModeSummary,
                "property"=>$propTran,
                "water"=>$waterTran,
                "trade"=>$tradeTran,
                "propertyAmount"=>roundFigure($propTran->sum("payable_amt")),
                "waterAmount"=>roundFigure($waterTran->sum("payable_amt")),
                "tradeAmount"=>roundFigure($tradeTran->sum("payable_amt")),
                "totalAmount"=>roundFigure($propTran->sum("payable_amt") + $waterTran->sum("payable_amt") + $tradeTran->sum("payable_amt")),
            ];
            return responseMsg(true,"Data Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function cashVerify(Request $request){
        try{
            $rules = [
                "property"=>"nullable|array",
                "property.*.id"=>"nullable|integer|exists:".$this->_PropTransaction->getConnectionName().".".$this->_PropTransaction->getTable().",id,lock_status,false,verification_status,0",
                "water"=>"nullable|array",
                "water.*.id"=>"nullable|integer|exists:".$this->_WaterTransaction->getConnectionName().".".$this->_WaterTransaction->getTable().",id,lock_status,false,verification_status,0",
                "trade"=>"nullable|array",
                "trade.*.id"=>"nullable|integer|exists:".$this->_TradeTransaction->getConnectionName().".".$this->_TradeTransaction->getTable().",id,lock_status,false,verification_status,0",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            if($user->getTable()!="users" || !$role){
                throw new CustomException("Access Denial");
            }  
            $userPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();          
            if(!$userPermission || !$userPermission->can_cash_verify){
                throw new CustomException("Permission Denial");
            }
            $this->begin();
            #property
            if($request->property){
                foreach($request->property as $val){
                    $tran = $this->_PropTransaction->find($val["id"]);
                    $tran->verification_status=1;
                    $tran->verified_by = $user->id;
                    $tran->verify_date = Carbon::now();
                    $tran->update();
                    $tran->getSwmTrans()->map(function($item)use($user){
                        $item->verification_status=1;
                        $item->verified_by = $user->id;
                        $item->verify_date = Carbon::now();
                        $item->update();
                    });
                }
            }
            #Water
            if($request->water){
                foreach($request->water as $val){
                    $tran = $this->_WaterTransaction->find($val["id"]);
                    $tran->verification_status=1;
                    $tran->verified_by = $user->id;
                    $tran->verify_date = Carbon::now();
                    $tran->update();

                }
            }
            #trade
            if($request->trade){
                foreach($request->trade as $val){
                    $tran = $this->_TradeTransaction->find($val["id"]);
                    $tran->verification_status=1;
                    $tran->verified_by = $user->id;
                    $tran->verify_date = Carbon::now();
                    $tran->update();

                }
            }
            $this->commit();            
            return responseMsg(true,"Case Verify","");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function bankReconciliationList(Request $request){
        try{
            
            $rules = [
                "chequeNo"=>"nullable|string",
                "fromDate"=>"required_without:chequeNo|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "uptoDate"=>"required_without:chequeNo|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "moduleId"=>"required|integer|exists:".$this->_ModuleMaster->getTable().",id",
                "paymentMode"=>"nullable|string|in:CHEQUE,DD,NEFT,RTGS",
                "verificationStatus"=>"nullable|string|in:PENDING,CLEAR,BOUNCED",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $configModule = $this->_SystemConstant["MODULE"];
            switch($request->moduleId){
                case $configModule["PROPERTY"] : $data = $this->_PropTransaction->from("prop_transactions as tran")
                                                              ->join("cheque_details as cheque",function($join){
                                                                    $join->on('cheque.transaction_id','tran.id')
                                                                    ->where('cheque.lock_status', false);
                                                              })
                                                              ->leftJoin("users",function($join){
                                                                    $join->on('users.id','tran.user_id')
                                                                    ->where('tran.user_type',"<>","ONLINE");
                                                              });
                    break;
                case $configModule["WATER"] : $data = $this->_WaterTransaction->from("water_transactions as tran")
                                                              ->join("cheque_details as cheque",function($join){
                                                                    $join->on('cheque.transaction_id','tran.id')
                                                                    ->where('cheque.lock_status', false);
                                                              })
                                                              ->leftJoin("users",function($join){
                                                                    $join->on('users.id','tran.user_id')
                                                                    ->where('tran.user_type',"<>","ONLINE");
                                                              });
                    break;
                case $configModule["TRADE"] : $data = $this->_TradeTransaction->from("trade_transactions as tran")
                                                              ->join("cheque_details as cheque",function($join){
                                                                    $join->on('cheque.transaction_id','tran.id')
                                                                    ->where('cheque.lock_status', false);
                                                              })
                                                              ->leftJoin("users",function($join){
                                                                    $join->on('users.id','tran.user_id')
                                                                    ->where('tran.user_type',"<>","ONLINE");
                                                              });
                    break;
                
            }
            if($request->fromDate && $request->uptoDate){
                $data->whereBetween("tran.tran_date",[$request->fromDate, $request->uptoDate]);
            }
            if($request->paymentMode){
                $data->where(DB::raw("upper(tran.payment_mode)"),$request->paymentMode);
            }
            if($request->chequeNo){
                $data->where("cheque.cheque_no",$request->chequeNo);
            }
            if($request->verificationStatus){
                $verificationStatus = $this->_SystemConstant["PAYMENT_STATUS"][$request->verificationStatus];
                $data->where("tran.payment_status",$verificationStatus);
            }
            $data = $data->select("tran.*","cheque.cheque_no","cheque.cheque_date","cheque.cheque_date",
                                    "cheque.bank_name","cheque.branch_name","cheque.clear_bounce_date",
                                    "cheque.remarks","cheque.bounce_amount",
                                    "users.name as user_name")
                    ->where("tran.lock_status",false)
                    ->orderBy("tran.id","DESC");
            $data = paginator($data,$request);
            return responseMsg(true,"Transaction List Fetched",camelCase(remove_null($data)));            
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function bankReconciliation(Request $request){
        try{
            $rules = [
                "moduleId" => "required|integer|exists:" . $this->_ModuleMaster->getTable() . ",id",
                "tranId" => [
                    "required",
                    "integer",
                    function ($attribute, $value, $fail) use ($request) {
                        $configModule = $this->_SystemConstant["MODULE"];
                        $exists = false;
                        switch ($request->moduleId) {
                            case $configModule["PROPERTY"]:
                                $exists = $this->_PropTransaction->where("lock_status",false)->where("id", $value)->exists();
                                break;
                            case $configModule["WATER"]:
                                $exists = $this->_WaterTransaction->where("lock_status",false)->where("id", $value)->exists();
                                break;
                            case $configModule["TRADE"]:
                                $exists = $this->_TradeTransaction->where("lock_status",false)->where("id", $value)->exists();
                                break;
                        }
                        if ($request->moduleId && !$exists) {
                            $fail("The {$attribute} is invalid.");
                        }
                    },
                ],
                "verificationStatus" => "required|in:CLEAR,BOUNCED",
                "bounceAmount"=>"nullable|numeric|min:0",
                "remarks"=>"required_if:verificationStatus,BOUNCED|string|min:5",
                "clearBounceDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
            ];

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            if($user->getTable()!="users" || !$role){
                throw new CustomException("Access Denial");
            }  
            $userPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();          
            if(!$userPermission || !$userPermission->can_cheque_status_verify){
                throw new CustomException("Permission Denial");
            }
            $configModule = $this->_SystemConstant["MODULE"];
            $verificationStatus = $this->_SystemConstant["PAYMENT_STATUS"][$request->verificationStatus];
            switch ($request->moduleId) {
                case $configModule["PROPERTY"]:
                    $tran = $this->_PropTransaction->find($request->tranId);
                    $cheque = ChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
                    $objTranDeactivate = new TransactionDeactivationBll($request->tranId);
                    break;

                case $configModule["WATER"]:
                    $tran = $this->_WaterTransaction->find($request->tranId);
                    $cheque = WaterChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
                    $objTranDeactivate = new WaterTransactionDeactivationBll($request->tranId);
                    break;

                case $configModule["TRADE"]:
                    $tran = $this->_TradeTransaction->find($request->tranId);
                    $cheque = TradeChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
                    $objTranDeactivate = new TradeTransactionDeactivationBll($request->tranId);
                    break;
                default : throw new CustomException("Tran section Not Found");
            }
            $tran->payment_status = $verificationStatus;
            $cheque->cheque_status = $verificationStatus;
            $cheque->clear_bounce_date = $request->clearBounceDate;
            $cheque->remarks = $request->remarks;
            $cheque->bounce_amount = $request->bounceAmount;
            
            $this->begin();  
            if($request->verificationStatus=="BOUNCED"){
                $objTranDeactivate->chequeBounce();
            }
            $tran->update();
            $cheque->update();
            $this->commit();
            return responseMsg(true,"Transaction Reconciliation","");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function searchTransaction(Request $request){
        try{
            $rules = [
                "moduleId" => "required|integer|exists:" . $this->_ModuleMaster->getTable() . ",id",
                "tranNo" => "required",
            ];

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $configModule = $this->_SystemConstant["MODULE"];
            switch($request->moduleId){
                case $configModule["PROPERTY"]:
                    $data = $this->_PropTransaction
                            ->where("tran_no",$request->tranNo)
                            ->where("lock_status",false)
                            ->whereIn("payment_status",[1,2])
                            ->get()
                            ->map(function($item){
                                if($item->saf_detail_id){
                                    $app = $this->_ActiveSafDetail->find($item->saf_detail_id);
                                    if(!$app){
                                        $app = $this->_SafDetail->find($item->saf_detail_id);
                                    }
                                    if(!$app){
                                        $app = $this->_RejectedSaf->find($item->saf_detail_id);
                                    }
                                    $item->app_no = $app?->saf_no;
                                    $item->app_typ ="Saf";
                                    $item->ward_no = $app?->getWardOldWardNo()?->ward_no;
                                    $item->new_ward_no = $app?->getWardNewdWardNo()?->ward_no;
                                }else{
                                    $app = $this->_PropertyDetail->find($item->property_detail_id);
                                    $item->app_no = $app?->new_holding_no ? $app->new_holding_no: $app?->holding_no;
                                    $item->app_typ ="Property";
                                    $item->ward_no = $app?->getWardOldWardNo()?->ward_no;
                                    $item->new_ward_no = $app?->getWardNewdWardNo()?->ward_no;
                                }
                                return $item;
                            });
                    break;

                case $configModule["WATER"]:
                    $data = $this->_WaterTransaction
                            ->where("tran_no",$request->tranNo)
                            ->where("lock_status",false)
                            ->whereIn("payment_status",[1,2])
                            ->get()
                            ->map(function($item){
                                if($item->application_id){
                                    $app = $this->_WaterActiveApplication->find($item->application_id);
                                    if(!$app){
                                        $app = $this->_WaterApplication->find($item->application_id);
                                    }
                                    if(!$app){
                                        $app = $this->_WaterRejectedApplication->find($item->application_id);
                                    }
                                    $item->app_no = $app?->application_no;
                                    $item->app_typ ="Water Application";
                                    $item->ward_no = $app?->getWardOldWardNo()?->ward_no;
                                    $item->new_ward_no = $app?->getWardNewdWardNo()?->ward_no;
                                }else{
                                    $app = $this->_Consumer->find($item->consumer_id);
                                    $item->app_no = $app?->consumer_no;
                                    $item->app_typ ="Water Consumer";
                                    $item->ward_no = $app?->getWardOldWardNo()?->ward_no;
                                    $item->new_ward_no = $app?->getWardNewdWardNo()?->ward_no;
                                }
                                return $item;
                            });
                    break;

                case $configModule["TRADE"]:
                    $data = $this->_TradeTransaction
                            ->where("tran_no",$request->tranNo)
                            ->where("lock_status",false)
                            ->whereIn("payment_status",[1,2])
                            ->get()
                            ->map(function($item){
                                $app = $this->_ActiveTradeLicense->find($item->application_id);
                                if(!$app){
                                    $app = $this->_TradeLicense->find($item->application_id);
                                }
                                if(!$app){
                                    $app = $this->_RejectedTradeLicense->find($item->application_id);
                                }
                                if(!$app){
                                    $app = $this->_TradeLicenseLog->find($item->application_id);
                                }
                                $item->app_no = $app?->application_no;
                                $item->app_typ ="Trade License";
                                $item->ward_no = $app?->getWardOldWardNo()?->ward_no;
                                $item->new_ward_no = $app?->getWardNewdWardNo()?->ward_no;
                                
                                return $item;
                            });
                    break;
                default : throw new CustomException("Tran section Not Found");
            }
            $data = $data->map(function($item){
                $cheque = $item->getChequeDtl();
                $item->cheque_no = $cheque?->cheque_no;
                $item->cheque_date = $cheque?->cheque_date;
                $item->bank_name = $cheque?->bank_name;
                $item->branch_name = $cheque?->branch_name;
                return $item;
            });
            return responseMsg(true,"Data Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function updatePaymentMode(Request $request){
        try{
            $rules = [
                "moduleId" => "required|integer|exists:" . $this->_ModuleMaster->getTable() . ",id",
                "tranId" => [
                    "required",
                    "integer",
                    function ($attribute, $value, $fail) use ($request) {
                        $configModule = $this->_SystemConstant["MODULE"];
                        $exists = false;
                        switch ($request->moduleId) {
                            case $configModule["PROPERTY"]:
                                $exists = $this->_PropTransaction->where("id", $value)->where("lock_status",false)->where("verification_status",0)->exists();
                                break;
                            case $configModule["WATER"]:
                                $exists = $this->_WaterTransaction->where("id", $value)->where("lock_status",false)->where("verification_status",0)->exists();
                                break;
                            case $configModule["TRADE"]:
                                $exists = $this->_TradeTransaction->where("id", $value)->where("lock_status",false)->where("verification_status",0)->exists();
                                break;
                        }
                        if ($request->moduleId && !$exists) {
                            $fail("The {$attribute} is invalid.");
                        }
                    },
                ],
                "paymentMode" => "required|in:CASH,CHEQUE,DD,NEFT,RTGS",
                "chequeNo"=>"required_unless:paymentMode,CASH",
                "chequeDate"=>"required_unless:paymentMode,CASH",                
                "bankName"=>"required_unless:paymentMode,CASH",
                "branchName"=>"required_unless:paymentMode,CASH",
            ];

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            if($user->getTable()!="users" || !$role){
                throw new CustomException("Access Denial");
            }  
            $userPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();          
            if(!$userPermission || !$userPermission->can_payment_mode_update){
                throw new CustomException("Permission Denial");
            }
            $configModule = $this->_SystemConstant["MODULE"];
            switch ($request->moduleId) {
                case $configModule["PROPERTY"]:
                    $tran = $this->_PropTransaction->find($request->tranId);
                    $cheque = ChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
                    break;

                case $configModule["WATER"]:
                    $tran = $this->_WaterTransaction->find($request->tranId);
                    $cheque = WaterChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
                    break;

                case $configModule["TRADE"]:
                    $tran = $this->_TradeTransaction->find($request->tranId);
                    $cheque = TradeChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
                    break;
                default : throw new CustomException("Tran section Not Found");
            }
            $tran->payment_mode = $request->paymentMode;
            if($request->paymentMode!="CASH"){
                if(!$cheque){
                    switch ($request->moduleId) {
                        case $configModule["PROPERTY"]:
                            $cheque = ChequeDetail::where("transaction_id",$tran->id)->first();
                            if(!$cheque){
                                $cheque = new ChequeDetail();
                                $cheque->transaction_id = $tran->id;
                            }
                            break;

                        case $configModule["WATER"]:
                            $cheque = WaterChequeDetail::where("transaction_id",$tran->id)->first();
                            if(!$cheque){
                                $cheque = new WaterChequeDetail();
                                $cheque->transaction_id = $tran->id;
                            }
                            break;

                        case $configModule["TRADE"]:
                            $cheque = TradeChequeDetail::where("transaction_id",$tran->id)->first();
                            if(!$cheque){
                                $cheque = new TradeChequeDetail();
                                $cheque->transaction_id = $tran->id;
                            }
                            break;
                    }                    
                }
                $cheque->lock_status = false;
                $cheque->cheque_no = $request->chequeNo;
                $cheque->cheque_date = $request->chequeDate;
                $cheque->bank_name = $request->bankName;
                $cheque->branch_name = $request->branchName;
            }else{
                if($cheque){
                    $cheque->lock_status = true;
                }
            }
            $this->begin();
            $tran->update();
            if($cheque){
                $cheque->save();
            }
            if($configModule["PROPERTY"]==$request->moduleId){
                $this->updateSwmPaymentMode($request);
            }
            // $this->commit();
            return responseMsg(true,"Transaction Update","");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }

    }
    
    private function updateSwmPaymentMode(Request $request){
        $PropTran = $this->_PropTransaction->find($request->tranId);
        $swmTran = $PropTran->getSwmTrans();
        foreach($swmTran as $tran){
            $tran->payment_mode = $request->paymentMode;
            $cheque = SwmChequeDetail::where("lock_status",false)->where("transaction_id",$tran->id)->first();
            if($request->paymentMode!="CASH"){
                if(!$cheque){
                    $cheque = SwmChequeDetail::where("transaction_id",$tran->id)->first();
                    if(!$cheque){
                        $cheque = new SwmChequeDetail();
                        $cheque->transaction_id = $tran->id;
                    }                   
                }
                $cheque->lock_status = false;
                $cheque->cheque_no = $request->chequeNo;
                $cheque->cheque_date = $request->chequeDate;
                $cheque->bank_name = $request->bankName;
                $cheque->branch_name = $request->branchName;
            }else{
                if($cheque){
                    $cheque->lock_status = true;
                }
            }

            $tran->update();
            if($cheque){
                $cheque->save();
            }
        }
            
    }

    public function deactivateTransaction(Request $request){
        try{
            $rules = [
                "moduleId" => "required|integer|exists:" . $this->_ModuleMaster->getTable() . ",id",
                "tranId" => [
                    "required",
                    "integer",
                    function ($attribute, $value, $fail) use ($request) {
                        $configModule = $this->_SystemConstant["MODULE"];
                        $exists = false;
                        switch ($request->moduleId) {
                            case $configModule["PROPERTY"]:
                                $exists = $this->_PropTransaction->where("id", $value)->where("lock_status",false)->whereIn("payment_status",[1,2])->exists();
                                break;
                            case $configModule["WATER"]:
                                $exists = $this->_WaterTransaction->where("id", $value)->where("lock_status",false)->whereIn("payment_status",[1,2])->exists();
                                break;
                            case $configModule["TRADE"]:
                                $exists = $this->_TradeTransaction->where("id", $value)->where("lock_status",false)->whereIn("payment_status",[1,2])->exists();
                                break;
                        }
                        if ($request->moduleId && !$exists) {
                            $fail("The {$attribute} is invalid.");
                        }
                    },
                ],
                "document"=>[
                    "required",
                    "mimes:".($request->docCode=="Applicant Image" ? "bmp,jpeg,jpg,png":"pdf"),
                    function ($attribute, $value, $fail) {
                        if($value instanceof UploadedFile){
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },

                ],
                "remarks"=>"required|string|min:10",
            ];

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            if($user->getTable()!="users" || !$role){
                throw new CustomException("Access Denial");
            }  
            $userPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();          
            if(!$userPermission || !$userPermission->can_tran_deactivate){
                throw new CustomException("Permission Denial");
            }
            $configModule = $this->_SystemConstant["MODULE"];
            $relativePath="Uploads/PropertyTranDeactivation";            
            $logModal = $this->_PropTransactionDeactivation;
            switch($request->moduleId){
                case $configModule["PROPERTY"]:
                    $relativePath="Uploads/PropertyTranDeactivation";
                    $objTranDeactivate = new TransactionDeactivationBll($request->tranId);
                    $logModal = $this->_PropTransactionDeactivation;
                    break;

                case $configModule["WATER"]:
                    $relativePath="Uploads/WaterTranDeactivation";
                    $objTranDeactivate = new WaterTransactionDeactivationBll($request->tranId);
                    $logModal = $this->_WaterTransactionDeactivation;
                    break;

                case $configModule["TRADE"]:
                    $relativePath="Uploads/TradeTranDeactivation";
                    $objTranDeactivate = new TradeTransactionDeactivationBll($request->tranId);
                    $logModal = $this->_TradeTransactionDeactivation;
                    break;
                default : throw new CustomException("Tran section Not Found");
            }

            $imageName = (string) Str::uuid().".".$request->document->getClientOriginalExtension();
            // $request->document->move($relativePath, $imageName);
            $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
            $request->merge([
                "transactionId"=>$request->tranId,
                "docPath"=>$path,
                "userId"=>$user->id
            ]);
            $this->begin();
            $objTranDeactivate->deactivateTransaction();
            $logModal->store($request);
            $this->commit();
            return responseMsg(true,"Transaction Deactivated","");

        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }
        
    }

    public function deactivatedTranList(Request $request){
        try{
            $rules = [
                "moduleId" => "required|integer|exists:" . $this->_ModuleMaster->getTable() . ",id",                
            ];

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $configModule = $this->_SystemConstant["MODULE"];
            switch($request->moduleId){
                case $configModule["PROPERTY"]:
                    $orm = $this->_PropTransactionDeactivation
                        ->from("prop_transaction_deactivations as tran_d")
                        ->join("prop_transactions as tran","tran.id","tran_d.transaction_id");
                    break;

                case $configModule["WATER"]:
                    $orm = $this->_WaterTransactionDeactivation
                        ->from("water_transaction_deactivations as tran_d")
                        ->join("water_transactions as tran","tran.id","tran_d.transaction_id");
                    break;

                case $configModule["TRADE"]:
                    $orm = $this->_TradeTransactionDeactivation
                        ->from("trade_transaction_deactivations as tran_d")
                        ->join("trade_transactions as tran","tran.id","tran_d.transaction_id");
                    break;
                default : throw new CustomException("Tran section Not Found");
            }
            $orm->where("tran_d.lock_status",false);
            if($request->fromDate){
                $orm->where(DB::raw("cast(tran_d.created_at as date)"),">=",$request->fromDate);
            }
            if($request->uptoDate){
                $orm->where(DB::raw("cast(tran_d.created_at as date)"),"<=",$request->uptoDate);
            }
            if($request->tranNo){
                $orm->where("tran.tran_no","ILIKE","%".$request->tranNo."%");
            }
            $orm->select("tran_d.*","tran.tran_date","tran.tran_no","tran.payment_mode","tran.payable_amt","tran.tran_type");
            
            $list = paginator($orm,$request);
            $list["data"] = collect($list["data"])->map(function($item){ 
                $item->doc_path = $item->doc_path ? url("/documents")."/".$item->doc_path:"";
                $user = User::find($item->user_id);
                $item->deactivate_by = $user?->name;
                $item->user_img = $item->user_img ? trim(Config::get("app.url"),'\\/')."/".$item->user_img:"";
                return $item;
            });
            return responseMsg(true,"Deactivate Tran List",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function collectionSummary(Request $request){
        try{
            $rules=[
                "fromDate"=>"required|date|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "uptoDate"=>"required|date|before_or_equal:".Carbon::now()->format("Y-m-d"),
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $request->merge(["active_tran"=>true]);
            $propertyReports = new PropertyReportController();
            $tradeReports = new TradeReportController();
            $waterReports = new WaterReportController();
            $propResponse = $propertyReports->collectionSummary($request);
            $tradeResponse = $tradeReports->collectionSummary($request);
            $waterResponse = $waterReports->collectionSummary($request);

            $propertyPaymentListResponse = $propertyReports->getPaymentMode($request);
            $waterPaymentListResponse = $waterReports->getPaymentMode($request);
            $tradePaymentListResponse = $tradeReports->getPaymentMode($request);

            $propertyPaymentListResponse = $propertyPaymentListResponse->original["status"]?$propertyPaymentListResponse->original["data"]:collect();
            $waterPaymentListResponse = $waterPaymentListResponse->original["status"]?$waterPaymentListResponse->original["data"]:collect();
            $tradePaymentListResponse = $tradePaymentListResponse->original["status"]?$tradePaymentListResponse->original["data"]:collect();
            

            $propTran = $propResponse->original["status"]?$propResponse->original["data"]:collect();
            $tradeTran = $tradeResponse->original["status"]?$tradeResponse->original["data"]:collect();
            $waterTran = $waterResponse->original["status"]?$waterResponse->original["data"]:collect();
            
            $paymentMode = collect()
                        ->merge($propertyPaymentListResponse->pluck("paymentMode"))
                        ->merge($waterPaymentListResponse->pluck("paymentMode"))
                        ->merge($tradePaymentListResponse->pluck("paymentMode"))
                        ->unique()
                        ->sort();

            $filterProp = $propTran->filter(fn($item) => !empty($item["propertyDetailId"]));
            $filterSaf = $propTran->filter(fn($item) => !empty($item["safDetailId"]));

            $holding = $paymentMode->map(function($val)use($filterProp){  
                $list = $filterProp->where("paymentMode",$val);              
                return[ 
                        "key"=>$val,
                        "amount"=>roundFigure($list->sum("payableAmt")),
                        "count"=>$list->count(),
                ];
            });
            $saf = $paymentMode->map(function($val)use($filterSaf){
                $list = $filterSaf->where("paymentMode",$val);                
                return[
                        "key"=>$val,
                        "amount"=>roundFigure($list->sum("payableAmt")),
                        "count"=>$list->count(),
                ];
            });

            $trade = $paymentMode->map(function($val)use($tradeTran){  
                $list = $tradeTran->where("paymentMode",$val);              
                return[
                        "key"=>$val,
                        "amount"=>roundFigure($list->sum("payableAmt")),
                        "count"=>$list->count(),
                ];
            });

            $water = $paymentMode->map(function($val)use($waterTran){  
                $list = $waterTran->where("paymentMode",$val);              
                return[
                        "key"=>$val,
                        "amount"=>roundFigure($list->sum("payableAmt")),
                        "count"=>$list->count(),
                ];
            });

            $paymentModeWise = $paymentMode->map(function($val)use($propTran,$tradeTran,$waterTran){  
                $propAmount = $propTran->where("paymentMode",$val);
                $tradeAmount = $tradeTran->where("paymentMode",$val);  
                $waterAmount = $waterTran->where("paymentMode",$val);           
                return[
                        "key"=>$val,
                        "amount"=>roundFigure($propAmount->sum("payableAmt") + $tradeAmount->sum("payableAmt") + $waterAmount->sum("payableAmt")),
                        "count"=>($propAmount->count() + $tradeAmount->count()),
                    ];
            });
            $data=[
                "paymentModeWise"=>$paymentModeWise->values(),
                "total"=>[
                            "count"=>$paymentModeWise->sum("count"),
                            "amount"=>roundFigure($paymentModeWise->sum("amount")),
                ],
                "table"=>[
                    [
                        "title"=>"Holding Collection Description",
                        "data"=>$holding->values(),
                        "total"=>[
                            "count"=>$holding->sum("count"),
                            "amount"=>roundFigure($holding->sum("amount")),
                        ]
                    ],                
                    [
                        "title"=>"Saf Collection Description",
                        "data"=>$saf->values(),
                        "total"=>[
                            "count"=>$saf->sum("count"),
                            "amount"=>roundFigure($saf->sum("amount")),
                        ]
                    ],
                    [
                        "title"=>"Trade Collection Description",
                        "data"=>$trade->values(),
                        "total"=>[
                            "count"=>$trade->sum("count"),
                            "amount"=>roundFigure($trade->sum("amount")),
                        ]
                    ],
                    [
                        "title"=>"Water Collection Description",
                        "data"=>$water->values(),
                        "total"=>[
                            "count"=>$water->sum("count"),
                            "amount"=>roundFigure($water->sum("amount")),
                        ]
                    ],
                ],
            ];
            
            return responseMsg(true,"all module collection summary",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function dateWiseCollection(Request $request){
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
            $propertyReports = new PropertyReportController();
            $tradeReports = new TradeReportController();
            $waterReports = new WaterReportController();

            $propResponse = $propertyReports->collectionReport($request);
            $tradeResponse = $tradeReports->collectionReport($request);
            $waterResponse = $waterReports->collectionReport($request);

            $propTran = $propResponse->original["status"]?$propResponse->original["data"]:collect();
            $tradeTran = $tradeResponse->original["status"]?$tradeResponse->original["data"]:collect();
            $waterTran = $waterResponse->original["status"]?$waterResponse->original["data"]:collect();

            $fromDate = Carbon::parse($request->fromDate);
            $uptoDate = Carbon::parse( $request->uptoDate);
            $response = collect();

            while($fromDate->lte($uptoDate)){
                $date = $fromDate->clone()->format("Y-m-d");
                $prop = $propTran->where("tranDate",$date)->where("safTran",FALSE);
                $saf = $propTran->where("tranDate",$date)->where("safTran",TRUE);
                $trade = $tradeTran->where("tranDate",$date);
                $water = $waterTran->where("tranDate",$date);
                $response->push([
                    "date"=> $fromDate->clone()->format("Y-m-d"),
                    "propertyAmount"=>roundFigure($prop->sum("payableAmt")),
                    "totalProperty"=>$prop->count("id"),
                    "safAmount"=>roundFigure($saf->sum("payableAmt")),
                    "totalSaf"=>$saf->count("id"),
                    "waterAmount"=>roundFigure($water->sum("payableAmt")),
                    "totalWater"=>$water->count("id"),
                    "tradeAmount"=>roundFigure($trade->sum("payableAmt")),
                    "totalTrade"=>$trade->count("id"),
                    "totalAmount"=>roundFigure($prop->sum("payableAmt") + $saf->sum("payableAmt") + $water->sum("payableAmt") +$trade->sum("payableAmt") ),
                ]);
                $fromDate = $fromDate->addDay();
            }

            $data = [
                "data"=>$response,
                "summary"=>[
                    'fromDate'=>$response->min("date"),
                    'uptoDate'=>$response->max("date"),
                    "total"=>$response->count(),
                    "totalAmount"=>roundFigure($response->sum("totalAmount")),
                    "propertyAmount"=>roundFigure($response->sum("propertyAmount")),
                    "totalProperty"=>$response->sum("totalProperty"),
                    "totalSaf"=>$response->sum("totalSaf"),
                    "safAmount"=>roundFigure($response->sum("safAmount")),
                    "waterAmount"=>roundFigure($response->sum("waterAmount")),
                    "totalWater"=>$response->sum("totalWater"),
                    "tradeAmount"=>roundFigure($response->sum("tradeAmount")),
                    "totalTrade"=>$response->sum("totalTrade"),
                ],                
            ];
            return responseMsg(true,"Date Wise Collection",camelCase(remove_null($data)));

        }catch(CustomException $e){

        }catch(Exception $e){

        }
    }

}
