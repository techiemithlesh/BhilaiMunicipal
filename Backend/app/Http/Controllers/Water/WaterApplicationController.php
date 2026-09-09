<?php

namespace App\Http\Controllers\Water;

use App\Bll\Common;
use App\Bll\Water\BiharTaxCalculator;
use App\Bll\Water\PaymentReceiptBll;
use App\Bll\Water\TaxCalculator;
use App\Bll\Water\WaterApplicationApproveBll;
use App\Bll\Water\WaterApplicationDemandBll;
use App\Bll\Water\WaterApplicationPaymentBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RequestPostNextLevel;
use App\Http\Requests\Water\RequestAppEdit;
use App\Http\Requests\Water\RequestApplyApplication;
use App\Http\Requests\Water\RequestOwnerEdit;
use App\Http\Requests\Water\RequestTaxReview;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\PropertyDetail;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafDetail;
use App\Models\User;
use App\Models\Water\ChequeDetail;
use App\Models\Water\ConnectionChargeCollection;
use App\Models\Water\ConnectionThroughMaster;
use App\Models\Water\ConnectionTypeMaster;
use App\Models\Water\DocTypeMaster;
use App\Models\Water\FerruleTypeMaster;
use App\Models\Water\LevelRemark;
use App\Models\Water\OwnershipTypeMaster;
use App\Models\Water\ParamModel;
use App\Models\Water\PipelineTypeMaster;
use App\Models\Water\PropertyTypeMaster;
use App\Models\Water\TransactionFineRebateDetail;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterActiveApplicationOwner;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterApplicationDocDetail;
use App\Models\Water\WaterApplicationFiledVerification;
use App\Models\Water\WaterApplicationOwner;
use App\Models\Water\WaterConnectionCharge;
use App\Models\Water\WaterRejectedApplication;
use App\Models\Water\WaterRejectedApplicationOwner;
use App\Models\Water\WaterTransaction;
use App\Trait\Water\WaterTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class WaterApplicationController extends Controller
{
    use WaterTrait;
    private $_WaterConstant;
    private $_SystemConstant;
    private $_MODULE_ID;
    private $_CommonClass;
    private $_Conn;

    private $_UlbMaster;
    private $_WorkflowMaster;
    private $_RoleTypeMstr;
    private $_UlbWardMaster;
    private $_OldWardNewWardMap;
    private $_ActiveSafDetail;
    private $_SafDetail;
    private $_PropertyDetail;

    private $_ConnectionTypeMaster;
    private $_ConnectionThroughMaster;
    private $_PipelineTypeMaster;
    private $_OwnershipTypeMaster;
    private $_PropertyTypeMaster;
    private $_FerruleTypeMaster;

    private $_WaterActiveApplication;
    private $_WaterActiveApplicationOwner;
    private $_WaterApplication;
    private $_WaterApplicationOwner;
    private $_WaterRejectedApplication;
    private $_WaterRejectedApplicationOwner;
    private $_WaterConnectionCharge;
    private $_WaterTransaction ;
    private $_ConnectionChargeCollection;
    private $_TransactionFineRebateDetail;
    private $_ChequeDetail;
    private $_WaterApplicationDocDetail;
    private $_LevelRemark;
    private $_WaterApplicationFiledVerification;
    function __construct()
    {
        $this->_WaterConstant = Config::get("WaterConstant");
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["WATER"];        
        $this->_CommonClass = new Common();        
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();

        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_UlbMaster = new UlbMaster();
        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_OldWardNewWardMap = new OldWardNewWardMap();
        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_SafDetail = new SafDetail();
        $this->_PropertyDetail = new PropertyDetail();

        $this->_ConnectionTypeMaster = new ConnectionTypeMaster();
        $this->_ConnectionThroughMaster = new ConnectionThroughMaster();
        $this->_PipelineTypeMaster = new PipelineTypeMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_FerruleTypeMaster = new FerruleTypeMaster();
        $this->_WaterActiveApplication = new WaterActiveApplication();
        $this->_WaterActiveApplicationOwner = new WaterActiveApplicationOwner();

        $this->_WaterApplication = new WaterApplication();
        $this->_WaterApplicationOwner = new WaterApplicationOwner();

        $this->_WaterRejectedApplication = new WaterRejectedApplication();
        $this->_WaterRejectedApplicationOwner = new WaterRejectedApplicationOwner();
        $this->_WaterConnectionCharge = new WaterConnectionCharge();
        $this->_WaterTransaction = new WaterTransaction();
        $this->_ConnectionChargeCollection = new ConnectionChargeCollection();
        $this->_TransactionFineRebateDetail = new TransactionFineRebateDetail();
        $this->_ChequeDetail = new ChequeDetail();
        $this->_WaterApplicationDocDetail = new WaterApplicationDocDetail();
        $this->_LevelRemark = new LevelRemark();
        $this->_WaterApplicationFiledVerification = new WaterApplicationFiledVerification();
        
    }

    private function begin(){
        DB::connection($this->_Conn)->beginTransaction();
    }
    private function rollBack(){
        DB::connection($this->_Conn)->rollBack();
    }
    private function commit(){
        DB::connection($this->_Conn)->commit();
    }

    public function getMasterData(Request $request){
        try{
            $user = Auth::user();
            $ulbId = $request->ulbId ? $request->ulbId : ($user->ulb_id??0);
            $connectionType = $this->_ConnectionTypeMaster->getConnectionTypeList();
            $connectionThrow = $this->_ConnectionThroughMaster->getConnectionThrowTypeList();
            $pipelineType = $this->_PipelineTypeMaster->getPipelineTypeList();
            $ownershipTypeMaster = $this->_OwnershipTypeMaster->getOwnershipTypeList();
            $propertyTypeMaster = $this->_PropertyTypeMaster->getPropertyTypeList();
            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            $ferruleType = $this->_FerruleTypeMaster->where("lock_status",false)->get();
            $distributedPipelineType = $this->_WaterConstant["distributedPipelineType"];
            $permittedPipeDiameter = $this->_WaterConstant["permittedPipeDiameter"];
            $permittedPipeQuality = $this->_WaterConstant["permittedPipeQuality"];
            $roadType = $this->_WaterConstant["roadType"];
            $tsMap = $this->_WaterConstant["TS_MAP"];
            $data=[
                "wardList"=>$ulbWardMaster,
                "ownershipType"=>$ownershipTypeMaster,
                "propertyType"=>$propertyTypeMaster,
                "connectionType"=>$connectionType,
                "connectionThrow"=>$connectionThrow,
                "pipelineType"=>$pipelineType,
                "ferruleType"=>$ferruleType,
                "categoryType"=>[
                    "APL","BPL"
                ],
                "distributedPipelineType"=>$distributedPipelineType,
                "permittedPipeDiameter"=>$permittedPipeDiameter,
                "permittedPipeQuality"=>$permittedPipeQuality,
                "roadType"=>$roadType,
                "tsMap"=>$tsMap,
            ];
            return responseMsg(true,"Water Master Data",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function testAddRequest(RequestApplyApplication $request){
        return responseMsg(true,"Valid Request",""); 
    }

    public function reviewTax(RequestTaxReview $request){
        try{
            $calCulator = new BiharTaxCalculator($request);
            $calCulator->calculateTax();
            return responseMsg(true,"Tax Review",camelCase(remove_null($calCulator->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function applyApplication(RequestApplyApplication $request){
        try{
            $user = Auth()->user(); 
            $additionData = []; 
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }elseif($user){
                $additionData["citizenId"]=$user->id;
            }
            $request->merge(["applicationType"=>"Water Connection"]);
            if($request->holdingNo){
                $additionData["propertyDetailId"] = $this->_PropertyDetail->where("new_holding_no",$request->holdingNo)->first()->id;
            }
            if($request->safNo){
                $safId = $this->_ActiveSafDetail->where("saf_no",$request->safNo)->first();
                if(!$safId){
                    $safId = $this->_SafDetail->where("saf_no",$request->safNo)->first();
                }
                $additionData["safDetailId"] = $safId->id;
            }

            $workflowMater = $this->_WorkflowMaster->where("module_id",$this->_MODULE_ID )
                ->where("workflow_name",$request->applicationType)
                ->where("lock_status",false)
                ->first();
            if(!$workflowMater){
                throw new CustomException("No Workflow Available");
            }
            $initFinishRole = $this->_CommonClass->initiatorFinisher($request->ulbId,$workflowMater->id);
            $initiator = $initFinishRole["initiator"]??[];
            $finisher = $initFinishRole["finisher"]??[];
            if(!$initiator["role_id"]??false){
                throw new CustomException("Initiator Not Found");
            }
            if(!$finisher["role_id"]??false){
                throw new CustomException("Finisher Not Found");
            }
            $additionData["currentRoleId"]=$initiator["role_id"];
            $additionData["initiatorRoleId"]=$initiator["role_id"];
            $additionData["finisherRoleId"]=$finisher["role_id"];
            $additionData["workflowId"]=$workflowMater->id;

            $request->merge($additionData);

            $calCulator = new TaxCalculator($request);
            $calCulator->calculateTax();
            $tax = collect($calCulator->_GRID);

            $this->begin();
            $id = $this->_WaterActiveApplication->store($request);
            $chargeData=[
                "applicationId"=>$id,
                "chargeFor"=>"New Connection",
                "amount"=>$tax["totalCharge"]??0,
                "penalty"=>$tax["penalty"]??0,
                "conn_fee"=>$tax["connFee"]??0,
            ];
            $newRequest = new Request($chargeData);
            // $this->_WaterConnectionCharge->store($newRequest);
            foreach($request->ownerDtl as $owners){
                $newRequest = new Request($owners);
                $newRequest->merge(["applicationId"=>$id]);
                $this->_WaterActiveApplicationOwner->store($newRequest);                
            }
            $application = $this->_WaterActiveApplication->find($id);
            $application->payment_status =1;
            $application->update();
            $applicationNo = $application->application_no??"";
            $this->commit();
            return responseMsg(true,"Application Submitted ",remove_null(camelCase(["applicationId"=>$id,"applicationNo"=>$applicationNo])));
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    public function editAppData(RequestAppEdit $request){
        try{
            $app = $this->_WaterActiveApplication->find($request->id);
            $additionData=["currentDate",$app->apply_date];
            $additionData["propertyDetailId"]=null;
            $additionData["safDetailId"]=null;
            if($request->holdingNo){
                $additionData["propertyDetailId"] = $this->_PropertyDetail->where("new_holding_no",$request->holdingNo)->first()->id;
            }
            if($request->safNo){
                $safId = $this->_ActiveSafDetail->where("saf_no",$request->safNo)->first();
                if(!$safId){
                    $safId = $this->_SafDetail->where("saf_no",$request->safNo)->first();
                }
                $additionData["safDetailId"] = $safId->id;
            }
            $oldOwners = $app->getOwners();
            $newOwners = collect($request->ownerDtl);
            $request->merge($additionData);
            $newRequest = $request;
            $demandCalculate=true;
            if($app->payment_status){
                $demandCalculate = false;
                $newRequest = new Request(collect($request->all())
                                        ->only(["id","category","pipelineTypeId",
                                            "connectionThroughId","ownershipTypeId","wardMstrId","newWardMstrId","landmark",
                                            "pinCode","address","holdingNo","propertyDetailId","safNo","safDetailId","electConsumerNo","electAccNo","electBindBookNo",
                                            "electConsCategory"])
                                        ->toArray());
            }
            $this->begin();
            $this->_WaterActiveApplication->edit($newRequest);
            // deactivate old owner
            foreach($oldOwners as $owner){
                if (!$newOwners->where('id', $owner->id)->first()) {
                    $owner->lock_status = true;
                    $owner->save();
                }
            }
            // insert and update old owner;
            foreach($request->ownerDtl as $owners){
                $ownerRequest = new Request($owners);
                $ownerRequest->merge(["applicationId"=>$app->id]);
                if (isset($owners['id'])) {
                    $this->_WaterActiveApplicationOwner->edit($ownerRequest);
                } else {
                    $this->_WaterActiveApplicationOwner->store($ownerRequest);
                }
            }
            if($demandCalculate){
                $oldDemand = $this->_WaterConnectionCharge->where("application_id",$app->id)->where("lock_status",false)->get();
                $totalDemand = $oldDemand->sum("amount");
                $calCulator = new TaxCalculator($newRequest);
                $calCulator->calculateTax();
                $tax = collect($calCulator->_GRID);
                if(round($totalDemand)!=round($tax["totalCharge"])){
                    foreach($oldDemand as $charge){
                        $charge->lock_status=true;
                        $charge->update();
                    }
                    $chargeData=[
                        "applicationId"=>$app->id,
                        "chargeFor"=>"New Connection",
                        "amount"=>$tax["totalCharge"]??0,
                        "penalty"=>$tax["penalty"]??0,
                        "conn_fee"=>$tax["connFee"]??0,
                    ];
                    $newRequest = new Request($chargeData);
                    $this->_WaterConnectionCharge->store($newRequest);
                }
            }
            $this->commit();
            $app = $this->_WaterActiveApplication->find($request->id);
            return responseMsg(true,"Application Edit",$app);
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    public function editOwners(RequestOwnerEdit $request){
        try{
            dd("ok");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    public function searchApplication(Request $request){
        try {
            $select = [
                "app.id",
                "app.application_no",
                "pd.new_holding_no",
                "saf.saf_no",
                "app.address",
                "app.apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "app.is_btc",
                "app.current_role_id",
                "app.payment_status",
                "app.is_doc_upload",
            ];

            // Active Applications
            $activeApplication = $this->_WaterActiveApplication->from("water_active_applications as app")
                ->select($select)
                ->addSelect(DB::raw("'active' as app_type"))
                ->join("connection_type_masters as ctm", "ctm.id", "app.connection_type_id")
                ->join("property_type_masters as ptm", "ptm.id", "app.property_type_id")
                ->join("connection_through_masters as cthm", "cthm.id", "app.connection_through_id")
                ->join("ownership_type_masters as otm", "otm.id", "app.ownership_type_id")
                ->join(DB::raw("(
                    SELECT application_id,
                        STRING_AGG(owner_name, ',') AS owner_name,
                        STRING_AGG(guardian_name, ',') AS guardian_name,
                        STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                    FROM water_active_application_owners
                    WHERE lock_status = false
                    GROUP BY application_id
                ) AS w"), "w.application_id", "=", "app.id")
                ->leftJoin(DB::raw("(
                    SELECT id, saf_no,'active' as app
                    FROM active_saf_details
                    WHERE lock_status = false
                    UNION
                    SELECT id, saf_no,'app' as app
                    FROM saf_details
                    WHERE lock_status = false
                ) AS saf"), "saf.id", "=", "app.saf_detail_id")
                ->join("ulb_ward_masters as wm", "wm.id", "=", "app.ward_mstr_id")
                ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "app.new_ward_mstr_id")
                ->leftJoin("property_details as pd", "pd.id", "app.property_detail_id")
                ->where("app.lock_status", false);

            // Approved Applications
            $application = $this->_WaterApplication->from("water_applications as app")
                ->select($select)
                ->addSelect(DB::raw("'approved' as app_type"))
                ->join("connection_type_masters as ctm", "ctm.id", "app.connection_type_id")
                ->join("property_type_masters as ptm", "ptm.id", "app.property_type_id")
                ->join("connection_through_masters as cthm", "cthm.id", "app.connection_through_id")
                ->join("ownership_type_masters as otm", "otm.id", "app.ownership_type_id")
                ->join(DB::raw("(
                    SELECT application_id,
                        STRING_AGG(owner_name, ',') AS owner_name,
                        STRING_AGG(guardian_name, ',') AS guardian_name,
                        STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                    FROM water_application_owners
                    WHERE lock_status = false
                    GROUP BY application_id
                ) AS w"), "w.application_id", "=", "app.id")
                ->leftJoin(DB::raw("(
                    SELECT id, saf_no,'active' as app
                    FROM active_saf_details
                    WHERE lock_status = false
                    UNION
                    SELECT id, saf_no,'app' as app
                    FROM saf_details
                    WHERE lock_status = false
                ) AS saf"), "saf.id", "=", "app.saf_detail_id")
                ->join("ulb_ward_masters as wm", "wm.id", "=", "app.ward_mstr_id")
                ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "app.new_ward_mstr_id")
                ->leftJoin("property_details as pd", "pd.id", "app.property_detail_id")
                ->where("app.lock_status", false);

            // 🔍 Filters
            if ($request->keyWord) {
                foreach ([$activeApplication, $application] as $q) {
                    $q->where(function ($where) use ($request) {
                        $where->where("app.application_no", "ILIKE", "%" . $request->keyWord . "%")
                            ->orWhere("pd.new_holding_no", "ILIKE", "%" . $request->keyWord . "%")
                            ->orWhere("saf.saf_no", "ILIKE", "%" . $request->keyWord . "%")
                            ->orWhere("w.owner_name", "ILIKE", "%" . $request->keyWord . "%")
                            ->orWhere("w.mobile_no", "ILIKE", "%" . $request->keyWord . "%");
                    });
                }
            }

            if ($request->wardId) {
                if (!is_array($request->wardId)) {
                    $request->merge(["wardId" => [$request->wardId]]);
                }
                $activeApplication->whereIn("wm.id", $request->wardId);
                $application->whereIn("wm.id", $request->wardId);
            }

            if ($request->applyDate) {
                $date = Carbon::parse($request->applyDate)->format("Y-m-d");
                $activeApplication->where("app.apply_date", $date);
                $application->where("app.apply_date", $date);
            }

            $list = $activeApplication->union($application);
            $data = paginator($list, $request);

            $data["data"] = collect($data["data"])->map(function ($item) {
                $item->appStatus = $this->getAppStatus($item->id);
                return $item;
            });

            return responseMsg(true, "Water Application Fetched", camelCase(remove_null($data)));

        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }


    public function getApplicationDtl(Request $request){
        try{
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $application = $this->_WaterActiveApplication->readConnection()->find($request->id);
            if(!$application){
                $application = $this->_WaterApplication->readConnection()->find($request->id);
            }
            if(!$application){
                throw new CustomException("Water Application Not Found");
            }
            $this->adjustValue($application);
            $application->is_approved = $application->getTable()=="water_applications" ? true : false;
            $application->appStatus = $this->getAppStatus($application->id);
            $application->owners = $application->getOwners();
            $application->tc_verifications=$application->getVerification()->get()->map(function($item){
                $user = User::find($item->user_id);
                $item->user_name = $user ? $user->name : null;
                return $item;
            });
            $application->tran_dtls = $application->getTrans();
            $levelRemarks = $application->getLevelRemarks()->orderBy("id","ASC")->get();
            $application->level_remarks = collect($levelRemarks)->map(function($val){
                $val->senderRole = $val->getSenderRole()->first()->role_name??"";
                $val->senderUserName = $val->getSenderUser()->first()->name??"";
                $val->receiverRole = $val->getReceiverRole()->first()->role_name??""; 
                $val->actions = flipConstants(Config::get("TradeConstant.ACTION_TYPE"))[$val->verification_status]??"";
                return $val;  
            });            
            
            return responseMsg(true,"Application Detail",camelCase(remove_null($application)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function getApplicationDue(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $water = $this->_WaterActiveApplication->find($request->id);
            if(!$water){
                $water = $this->_WaterApplication->readConnection()->find($request->id);
            }
            if(!$water){
                throw new CustomException("Water Not Found");
            }
            $waterDemandBLL = new WaterApplicationDemandBll($water->id);
            $waterDemandBLL->generateDemand();
            return responseMsg(true,"Water Demand",camelCase(remove_null($waterDemandBLL->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function offlinePayment(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807",
                "paymentType"=>"required|in:FULL",
                "paymentMode" => "required|in:ONLINE,CASH,CHEQUE,DD,NEFT,RTGS",
                "amount"=>"nullable|required_if:paymentType,==,PART|numeric|min:0",
                "chequeNo"=>"required_unless:paymentMode,ONLINE,CASH",
                "chequeDate"=>"required_unless:paymentMode,ONLINE,CASH",                
                "bankName"=>"required_unless:paymentMode,ONLINE,CASH",
                "branchName"=>"required_unless:paymentMode,ONLINE,CASH",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }

            $water = $this->_WaterActiveApplication->find($request->id);
            if(!$water){
                $water = $this->_WaterApplication->readConnection()->find($request->id);
            }
            if(!$water){
                throw new CustomException("Application Not Found");
            }

            $waterDemandBLL = new WaterApplicationDemandBll($water->id);
            $waterDemandBLL->generateDemand();
            $demandPayableAmount = $waterDemandBLL->_GRID["payableAmount"];
            if($demandPayableAmount <=0){
                throw new CustomException("All Demand Are Clear");
            } 
            $applicationPaymentBll = new WaterApplicationPaymentBll($request);

            $this->begin();           
            $responseData = ($applicationPaymentBll->payNow());
            $water->payment_status = 1;
            $water->update();
            $this->commit();
            return responseMsg(true,"Payment Successfully Done",$responseData);
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getPaymentReceipt(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_WaterTransaction->getConnectionName().".".$this->_WaterTransaction->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new PaymentReceiptBll($request->id); 
            $receiptBll->generateReceipt();
            return responseMsg(true,"Payment Receipt",camelCase(remove_null($receiptBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function inbox(Request $request){
        try{
            $user = Auth()->user();
            if($user->getTable()!="users"){
                throw new CustomException("Another User Are Not Allow");
            }
            $role = $user->getRoleDetailsByUserId()->first();
            $wardPermissionList = $user->getUserWards()->get();
            $waredId = $wardPermissionList->unique("id")->pluck("id");
            $data = $this->metaDataList()
                    ->whereIn("app.ward_mstr_id",$waredId)
                    ->where("app.ulb_id",$user->ulb_id)
                    ->where("app.is_btc",false)
                    ->where("app.payment_status",1)
                    ->where("app.current_role_id",$role->id);
            if($request->key){
                $data->where(function($where)use($request){
                    $where->where("app.application_no","ILIKE","%".$request->key."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->key."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->key."%");

                });                
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("app.ward_mstr_id",$request->wardId);
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $data->whereBetween("app.apply_date",[Carbon::parse($request->fromDate)->format("Y-m-d"),Carbon::parse($request->uptoDate)->format("Y-m-d")]);
                }elseif($request->fromDate){
                    $data->where("app.apply_date",Carbon::parse($request->fromDate)->format("Y-m-d"));
                }elseif($request->uptoDate){
                    $data->where("app.apply_date",Carbon::parse($request->uptoDate)->format("Y-m-d"));
                }
            }

            
            $list = paginator($data,$request);
            $list["data"] = collect($list["data"])->map(function($item){                
                $lastRemarks = LevelRemark::where("application_id",$item["id"])->orderBy("id","DESC")->first();
                $item->receivingDate = Carbon::parse($lastRemarks->created_at??"")->format("Y-m-d H:i:s");
                if($item->current_role_id == $item->initiator_role_id && !$lastRemarks ){
                    $lastTran = $item->getLastTran();
                    $item->receivingDate = Carbon::parse($lastTran->created_at??"")->format("Y-m-d H:i:s");
                }
                return $item;
            });
            return responseMsg(true,($role->role_name??"")." Inbox",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function btcList(Request $request){
        try{
            $user = Auth()->user();
            if($user->getTable()!="users"){
                throw new CustomException("Another User Are Not Allow");
            }
            $role = $user->getRoleDetailsByUserId()->first();
            $wardPermissionList = $user->getUserWards()->get();
            $waredId = $wardPermissionList->unique("id")->pluck("id");
            $data = $this->metaDataList()
                    ->whereIn("app.ward_mstr_id",$waredId)
                    ->where("app.ulb_id",$user->ulb_id)
                    ->where("app.is_btc",true)
                    ->where("app.payment_status",1);
            if($request->key){
                $data->where(function($where)use($request){
                    $where->where("app.application_no","ILIKE","%".$request->key."%")
                        ->orWhere("w.owner_name","ILIKE","%".$request->key."%")
                        ->orWhere("w.mobile_no","ILIKE","%".$request->key."%");

                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("app.ward_mstr_id",$request->wardId);
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $data->whereBetween("app.apply_date",[Carbon::parse($request->fromDate)->format("Y-m-d"),Carbon::parse($request->uptoDate)->format("Y-m-d")]);
                }elseif($request->fromDate){
                    $data->where("app.apply_date",Carbon::parse($request->fromDate)->format("Y-m-d"));
                }elseif($request->uptoDate){
                    $data->where("app.apply_date",Carbon::parse($request->uptoDate)->format("Y-m-d"));
                }
            }
            
            
            $list = paginator($data,$request);
            $list["data"] = collect($list["data"])->map(function($item){                
                $lastRemarks = LevelRemark::where("application_id",$item["id"])->orderBy("id","DESC")->first();
                $item->receivingDate = Carbon::parse($lastRemarks->created_at??"")->format("Y-m-d H:i:s");
                $item->remarks = $lastRemarks->sender_remarks??"";
                if($item->current_role_id == $item->initiator_role_id && !$lastRemarks ){
                    $lastTran = $item->getLastTran();
                    $item->receivingDate = Carbon::parse($lastTran->created_at??"")->format("Y-m-d H:i:s");
                }
                return $item;
            });
            return responseMsg(true,($role->role_name??"")." BTC",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function outbox(Request $request){
        try{
            $user = Auth()->user();
            if($user->getTable()!="users"){
                throw new CustomException("Another User Are Not Allow");
            }
            $role = $user->getRoleDetailsByUserId()->first();
            $wardPermissionList = $user->getUserWards()->get();
            $waredId = $wardPermissionList->unique("id")->pluck("id");
            $data = $this->metaDataList()->addSelect(DB::raw("level_remarks.created_at as sending_date,level_remarks.receiving_date"))
                    ->join("level_remarks","level_remarks.application_id","app.id")
                    ->whereIn("app.ward_mstr_id",$waredId)
                    ->where("app.ulb_id",$user->ulb_id)
                    ->where("level_remarks.sender_user_id",$user->id)
                    ->where("app.payment_status",1)
                    ->where("app.current_role_id","<>",$role->id);

            $list = paginator($data,$request);
            return responseMsg(true,($role->role_name??"")." Outbox",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function postNextLevel(RequestPostNextLevel $request){
        try{
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            $water = $this->_WaterActiveApplication->find($request->id);
            if(!$water){
                throw new CustomException("Data Not Find");
            }
            if(!$water->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($water->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }
            $forWardBackWordRole = $this->_CommonClass->getForwordBackwordRoll($user->ulb_id,$water->workflow_id,$role->id);
            $workflowMater = $this->_WorkflowMaster->find($water->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role->id)->first();
            if(!$WfPermission){
                throw new CustomException("You Have No Any Permission On This WorkFlow");
            }
            if($WfPermission->is_initiator && in_array($request->status,["BTC","BACKWARD"])){
                throw new CustomException("Initiator Can't BTC OR Back The Application");
            }
            if($water->current_role_id != $role->id && !$water->is_btc){
                throw new CustomException("This Application Not Pending At You");
            }
            if($water->is_btc && $water->initiator_role_id != $role->id){
                throw new CustomException("This Application Is BTC. Only Initiator Can Forward It.");
            }

            if($request->status=="FORWARD" && $WfPermission->is_finisher){
                $request->merge(["status"=>"APPROVED"]);
            }

            if($request->status=="BTC"){
                return $this->btcApplication($request);
            }
            if(in_array($request->status,["APPROVED","REJECT"])){
                return $this->approveRejectApplication($request);
            }
            if($request->status=="FORWARD"){
                $testWoke = $this->testWorks($water->id);
                $flag = $testWoke["is_work_complied"];
                $message = $testWoke["message"];
                if(!$flag){                    
                    throw new CustomException($message ? $message :"Some Work Is Pending");
                }
                else{
                    if($WfPermission->can_doc_upload){
                        $water->is_doc_upload = true;
                        $water->is_doc_upload = true;
                    }
                    if($WfPermission->can_doc_verify){
                        $water->is_doc_verify = true;
                        $water->doc_verify_date = Carbon::now();
                    }                    
                }
            }
            #============================
            $sms = "Application Forward To";
            if($request->status=="FORWARD"){
                #=========forward===============
                if(!$water->is_btc){
                    $water->current_role_id = $WfPermission->forward_role_id;
                    $water->max_level_attempt = $water->max_level_attempt< $WfPermission->serial_no ? $WfPermission->serial_no : $water->max_level_attempt;
                }else{
                    $water->is_btc = false;
                }
            }
            elseif($request->status=="BACKWARD"){
                #===========backward=========
                $sms = "Application Back To";
                if($WfPermission->backward_role_id==$water->initiator_role_id){
                    $water->is_btc = true;
                    $sms = "Application Back From";
                }else{
                    $water->current_role_id = $WfPermission->backward_role_id;
                }
            } 
            $currentRole = $this->_RoleTypeMstr->find($water->current_role_id);
            $sms .= " " .$currentRole->role_name??"";
            $lastLevel = $this->_LevelRemark->where("application_id",$water->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_WaterTransaction->where("application_id",$water->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $water->apply_date;
            }
            $levelData=[
                "application_id"=>$water->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$water->current_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("SystemConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData);
            
            $this->begin();            
            $water->update();
            $id=$this->_LevelRemark->store($request);
            $this->commit();
            return responseMsg(true,$sms,"");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error",$e);
        }
    }

    public function btcApplication(Request $request){
        try{
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            $water = $this->_WaterActiveApplication->find($request->id);
            if(!$water){
                throw new CustomException("Data Not Find");
            }
            

            $workflowMater = $this->_WorkflowMaster->find($water->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role->id)->first();
            if(!$WfPermission){
                throw new CustomException("You Have No Any Permission On This WorkFlow");
            }
            if(!$WfPermission->can_btc){
                throw new CustomException("You Can't btc the Application");
            }
            $sms = "Application BTC from To";
            $water->is_btc = true;
            $currentRole = $this->_RoleTypeMstr->find($water->current_role_id);
            $sms .= " " .$currentRole->role_name??"";
            $lastLevel = $this->_LevelRemark->where("application_id",$water->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_WaterTransaction->where("application_id",$water->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $water->apply_date;
            }
            $levelData=[
                "application_id"=>$water->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$water->initiator_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 
            $this->begin();
            $water->update();
            $id=$this->_LevelRemark->store($request);
            $this->commit();
            return responseMsg(true,$sms,"");

        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function approveRejectApplication(RequestPostNextLevel $request){
        try{
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            $water = $this->_WaterActiveApplication->find($request->id);;
            if(!$water){
                throw new CustomException("Data Not Find");
            }
            if(!$water->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($water->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }

            $workflowMater = $this->_WorkflowMaster->find($water->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role->id)->first();
            if(!$WfPermission){
                throw new CustomException("You Have No Any Permission On This WorkFlow");
            }
            if(!$WfPermission->can_app_approved && in_array($request->status,["APPROVED"])){
                throw new CustomException("You Can't Approve The Application");
            }
            if(!$WfPermission->can_app_reject && in_array($request->status,["REJECT"])){
                throw new CustomException("You Can't Reject The Application");
            }
            $currentRole = $this->_RoleTypeMstr->find($water->current_role_id);
            $lastLevel = $this->_LevelRemark->where("application_id",$water->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_WaterTransaction->where("application_id",$water->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $water->apply_date;
            }
            $levelData=[
                "application_id"=>$water->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$water->current_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 
            $objMemo = new WaterApplicationApproveBll($water->id);
            $message="";
            $response = [];
            $this->begin();
            if($request->status=="APPROVED"){                
                $objMemo->approveApplication();
                $message="Application Approved";
                $response=[
                    "consumerId"=>$objMemo->_ConsumerId,
                    "consumerNo"=>$objMemo->_ConsumerNo,
                ];
            }            
            if($request->status=="REJECT"){
                $objMemo->rejectApplication();
                $message="Application Rejected";
                dd("REJECT");
            }
            $id=$this->_LevelRemark->store($request);
            $this->commit();
            return responseMsg(true,$message,camelCase(remove_null($response)));

        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }


    public function getDocList(Request $request){
        try{
            $rules =[
                "id"=>"required|digits_between:1,9223372036854775807",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $application = $this->_WaterActiveApplication->find($request->id);
            if(!$application){
                $application = $this->_WaterApplication->find($request->id);
            }
            if(!$application){
                $application = $this->_WaterRejectedApplication->find($request->id);
            }
            if(!$application){
                throw new CustomException("Data Not Found");
            }
            $docList= $this->getRequiredDocList($application);
            return responseMsg(true,"Application Required Doc List",camelCase(remove_null($docList)));
            
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function uploadDoc(Request $request){
        try{
            $rules =[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_WaterActiveApplication->getConnectionName().".".$this->_WaterActiveApplication->getTable(),
                "ownerId"=>"nullable|digits_between:1,9223372036854775807",
                "docCode"=>"required",
                "docName"=>"required",
                "document"=>[
                    "required",
                    "mimes:".($request->docCode=="Photo" ? "bmp,jpeg,jpg,png":"pdf"),
                    function ($attribute, $value, $fail) {
                        if($value instanceof UploadedFile){
                            $maxSize = $value->getClientOriginalExtension() === 'application/pdf' ? 10240 : 5120; // Size in KB
                            $maxSizeBytes = $maxSize * 1024; // Convert to bytes
                            if ($value->getSize() > $maxSizeBytes) {
                                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
                            }
                        }
                    },

                ]
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $water = $this->_WaterActiveApplication->find($request->id);
            $requiredDocList = $this->getDocList($request);
            $requiredDocList = $requiredDocList->original["data"];
            $appDocCode = collect($requiredDocList["appDoc"])->pluck("docCode");
            $ownerDoc = collect($requiredDocList["ownerDoc"]);
            $ownerDocCode = collect();
            $doc_type_id = null;

            $role = $user->getRoleDetailsByUserId()->first();
            $workflowMater = $this->_WorkflowMaster->find($water->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role?->id)->first();
            if((!$WfPermission) && $user->getTable()=="users"){
                throw new CustomException("You Have No Any Permission On This WorkFlow");
            }
            if($user->getTable()=="users" && (!$WfPermission->has_full_permission && !$WfPermission->can_doc_upload) ){
                throw new CustomException("You do not have permission to edit");
            }

            $canDocUpload = $water->is_btc || ($water->current_role_id == $water->initiator_role_id);
            if(!$canDocUpload){
                throw new CustomException("Currently Not Update Doc"); 
            }
            
            $relativePath = "Uploads/Water";
            $ownerDoc->map(function($item)use($ownerDocCode){                
                collect($item["docList"])->map(function($val)use($ownerDocCode){                    
                    $ownerDocCode->push($val["docCode"]);
                });
                return;
            });
            if(!in_array($request->docCode,$appDocCode->toArray()) && !in_array($request->docCode,$ownerDocCode->toArray())){
                throw new CustomException("Invalid Doc Code Pass");
            }
            if(in_array($request->docCode,$appDocCode->toArray())){
                $docList = collect($requiredDocList["appDoc"])->where("docCode",$request->docCode)->first();
                $doc_type_id = $docList["id"];
                $docNames = collect($docList["list"])->pluck("docName");                
                if(!in_array($request->docName,$docNames->toArray())){
                    throw new CustomException("Invalid Doc Name Pass For ". $request->docCode);
                }
                $request->merge(["ownerId"=>null]);
            }
            if(in_array($request->docCode,$ownerDocCode->toArray())){                
                $owner = collect($requiredDocList["ownerDoc"])->where("id",$request->ownerId)->first();
                if(!$owner){
                    throw new CustomException("Invalid Owner Id Pass");
                }
                $docList = collect($owner["docList"]??[])->where("docCode",$request->docCode)->first();                
                $doc_type_id = $docList["id"];
                $docNames = collect($docList["list"])->pluck("docName");              
                if(!in_array($request->docName,$docNames->toArray())){
                    throw new CustomException("Invalid Doc Name Pass For ". $request->docCode);
                }
            }

            $this->begin();
            $oldDoc = $water->getDocList()
                    ->where("doc_type_id",$doc_type_id)
                    ->where("owner_detail_id",$request->ownerId)
                    ->where("lock_status",false)->first();
            $sms = "Document Uploaded";            
            #reupload
            if($oldDoc){
                // $filePath = public_path($oldDoc->doc_path);
                // if (file_exists($filePath)) {
                //     // Delete the file
                //     @unlink($filePath);
                // }
                if (!empty($oldDoc->doc_path) && Storage::disk($this->disk)->exists($oldDoc->doc_path)) {
                    Storage::disk($this->disk)->delete($oldDoc->doc_path);
                }

                $imageName = $water->id."_".$request->docCode.".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $request->merge(["docPath"=>$path]);
                       
                $oldDoc->doc_name = $request->docName;          
                $oldDoc->doc_path = $request->docPath;
                $oldDoc->user_id = $user->id;
                $oldDoc->update();
                $sms ="Document Updated";
            }else{
                $imageName = $water->id."_".$request->docCode.".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $request->merge(["docPath"=>$path]);

                $this->_WaterApplicationDocDetail->application_id = $water->id;                
                $this->_WaterApplicationDocDetail->owner_detail_id = $request->ownerId;             
                $this->_WaterApplicationDocDetail->doc_type_id = $doc_type_id;          
                $this->_WaterApplicationDocDetail->doc_name = $request->docName;          
                $this->_WaterApplicationDocDetail->doc_path = $request->docPath;
                $this->_WaterApplicationDocDetail->user_id = $user->id;
                $this->_WaterApplicationDocDetail->save();
            }
            $this->commit();
            return responseMsg(true,$sms,"");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getUploadedDoc(Request $request){
        try{
            $rules =[
                "id"=>"required|digits_between:1,9223372036854775807",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $water = $this->_WaterActiveApplication->find($request->id);
            if(!$water){
                $water = $this->_WaterApplication->find($request->id);
            }
            if(!$water){
                $water = $this->_WaterRejectedApplication->find($request->id);
            }
            if(!$water){
                throw new CustomException("Data Not Found");
            }
            $owner = $water->getOwners();
            $docList = $water->getDocList()->get();
            $docList = $docList->map(function($val)use($owner){
                $verifyUser = User::find($val->verified_by_user_id);
                $uploadedUser = User::find($val->user_id);
                $docMaster = DocTypeMaster::find($val->doc_type_id);
                $val->docCode =$docMaster ? Str::title(implode(" ",explode("_",$docMaster->doc_type))) : "";
                $cOwner = $owner->where("id",$val->owner_detail_id)->first();
                $val->owner_name = $cOwner ? $cOwner->owner_name : "";
                $val->doc_path = $val->doc_path ? url("/documents")."/".$val->doc_path:"";
                $val->uploaded_by = $uploadedUser ? $uploadedUser->name : "";
                $val->verify_by = $verifyUser ? $verifyUser->name : "";
                return $val;
            });
            return responseMsg(true,"Application Doc List",camelCase(remove_null($docList)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }
    
    public function docVerify(Request $request){
        try{
            $rules=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_WaterApplicationDocDetail->getConnectionName().".".$this->_WaterApplicationDocDetail->getTable().",id",
                "verificationStatus"=>"required|in:VERIFY,REJECT",
                "remarks"=>"required_if:verificationStatus,REJECT",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $doc = $this->_WaterApplicationDocDetail->find($request->id);
            $doc->verified_by_user_id = $user->id;
            $doc->verified_at = Carbon::now();
            switch($request->verificationStatus){
                case "VERIFY":
                    $doc->verified_status = 1;
                    break;
                case "REJECT":
                    $doc->verified_status = 2;
                    $doc->remarks = $request->remarks;
                    break;
            }
            $doc->update();
            return responseMsg(true,$doc->doc_name." ".$request->verificationStatus,"");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getApplicationForVerification(Request $request ){
        try{
            $user = Auth()->user();
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807|exists:".$this->_WaterActiveApplication->getConnectionName().".".$this->_WaterActiveApplication->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            
            $role = $user->getRoleDetailsByUserId()->first();
            $water = $this->_WaterActiveApplication->find($request->id);
            $water = $this->adjustValue($water);            

            if($role->id==15){
                $tcVerifiedData = $water->getVerification()->where("verified_by","Junior Engineer")->orderBy("id","DESC")->first();                
                $water->tcVerifiedData = $tcVerifiedData ? $this->adjustValue($tcVerifiedData):collect();                
            }
            return responseMsgs(true,"Data Fetched",camelCase($water));
        }catch(CustomException $e){
            return responseMsgs(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsgs(false,"Server Error","");
        }
    }

    public function fieldVerification(Request $request){
        try{
            
            $rules=[
                "applicationId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_WaterActiveApplication->getConnectionName().".".$this->_WaterActiveApplication->getTable().",id",
                "connectionTypeId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ConnectionTypeMaster->getConnectionName().".".$this->_ConnectionTypeMaster->getTable().",id",
                "propertyTypeId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
                "connectionThroughId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ConnectionThroughMaster->getConnectionName().".".$this->_ConnectionThroughMaster->getTable().",id",
                "category"=>"required|string|in:APL,BPL",
                "pipelineTypeId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_PipelineTypeMaster->getConnectionName().".".$this->_PipelineTypeMaster->getTable().",id",
                "wardMstrId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
                "newWardMstrId" => "nullable|integer|exists:" .
                                    $this->_OldWardNewWardMap->getConnectionName() . "." .
                                    $this->_OldWardNewWardMap->getTable() . ",new_ward_id" .
                                    ($request->wardMstrId ? ",old_ward_id," . $request->wardMstrId : ""),
                "areaSqft" => "required|numeric|min:0.1",
                "distributedPipelineSize"=>"required|numeric|min:1",
                "distributedPipelineType"=>"required|in:".implode(",",$this->_WaterConstant["distributedPipelineType"]??[]),
                "permittedPipeDiameter"=>"required|integer|in:".implode(",",$this->_WaterConstant["permittedPipeDiameter"]??[]),
                "permittedPipeQuality"=>"required|in:".implode(",",$this->_WaterConstant["permittedPipeQuality"]??[]),
                "ferruleTypeId"=>"required|digits_between:1,9223372036854775807|exists:".$this->_FerruleTypeMaster->getConnectionName().".".$this->_FerruleTypeMaster->getTable().",id",
                "roadType"=>"required|in:".implode(",",$this->_WaterConstant["roadType"]??[]),
                "tsMapId"=>"required|integer|in:1,2",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();            
            $application = $this->_WaterActiveApplication->find($request->applicationId);
            $shortName = $this->_SystemConstant["USER-TYPE-SHORT-NAME"][strtoupper($role->role_name)]??"";
            $request->merge(["currentDate"=>$application->apply_date]);
            $calCulator = new BiharTaxCalculator($request);
            $calCulator->calculateTax();
            $demand = new WaterConnectionCharge();
            $oldCharge = $demand->where("lock_status",false)->where("application_id",$application->id)->get();
            $totalBalance = roundFigure($calCulator->_GRID["totalCharge"] - $oldCharge->sum("amount"));
            if($shortName=="JE"){
                $request->merge(["verified_by"=>"Junior Engineer"]);
                $application->is_field_verify =true;
                $application->field_verify_date =Carbon::now();
                $application->field_verify_user_id =$user->id;
            }
            if($shortName=="AE"){
                $request->merge(["verified_by"=>"Assistant Engineer"]);
                $application->is_utc_field_verify =true;
                $application->utc_field_verify_date =Carbon::now();
                $application->utc_field_verify_user_id =$user->id;
            }
            $request->merge(["user_id"=>$user->id]);
            $this->begin();
            $verificationId = $this->_WaterApplicationFiledVerification->store($request);
            // if($totalBalance>0){                
            //     $chargeData=[
            //         "applicationId"=>$application->id,
            //         "chargeFor"=>"Site Inspection",
            //         "amount"=>$totalBalance,
            //         "penalty"=>0,
            //         "conn_fee"=>$totalBalance,
            //     ];
            //     $newRequest = new Request($chargeData);
            //     $this->_WaterConnectionCharge->store($newRequest);
            //     $application->payment_status=0;
            // }else{
            //     foreach($oldCharge->where("paid_status",false) as $val){
            //         $val->lock_status=true;
            //         $val->update();
            //     }
            //     $application->payment_status=1;
            // }
            $application->update();
            $this->commit();
            return responseMsg(true,"Field Verification Done","");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getVerificationDetails(Request $request){
        try{
            $verificationDtl = $this->_WaterApplicationFiledVerification->find($request->id);
            if(!$verificationDtl){
                throw new CustomException("Data Not Found");
            }
            $app = $this->_WaterActiveApplication->find($verificationDtl->application_id);
            if(!$app){
                $app = $this->_WaterApplication->find($verificationDtl->application_id);
            }if(!$app){
                $app = $this->_WaterRejectedApplication->find($verificationDtl->application_id);
            }
            if(!$app){
                throw new CustomException("Data Not Found");
            }
            $verificationDtl->ferrule_type = $this->_FerruleTypeMaster->find($verificationDtl->ferrule_type_id)?->ferrule_type;
            $verificationDtl = $this->adjustValue($verificationDtl);
            $app = $this->adjustValue($app);
            $user = User::find($verificationDtl->user_id);            
            $owner = $app->getOwners();            
            $appComp = [
                [
                    "key"=>"Ward No",
                    "self"=>$app->ward_no,
                    "verify"=>$verificationDtl->ward_no??"",
                    "test"=>$app->ward_mstr_id==($verificationDtl->ward_mstr_id??false),
                ],
                [
                    "key"=>"New Ward No",
                    "self"=>$app->new_ward_no,
                    "verify"=>$verificationDtl->new_ward_no??"",
                    "test"=>$app->new_ward_mstr_id==($verificationDtl->new_ward_mstr_id??false),
                ],
                [
                    "key"=>"Property Type",
                    "self"=>$app->property_type,
                    "verify"=>$verificationDtl->property_type??"",
                    "test"=>$app->property_type_id==($verificationDtl->property_type_id??false),
                ],
                [
                    "key"=>"Pipeline Type",
                    "self"=>$app->pipeline_type,
                    "verify"=>$verificationDtl->pipeline_type??"",
                    "test"=>$app->pipeline_type_id==($verificationDtl->pipeline_type_id??false),
                ],
                [
                    "key" => "Connection Type",
                    "self" => $app->connection_type,
                    "verify" => $verificationDtl->connection_type,
                    "test" => $app->connection_type_id==($verificationDtl->connection_type_id??false),
                ],
                [
                    "key"=>"Area In Sqrt",
                    "self"=>$app->area_sqft,
                    "verify"=>$verificationDtl->area_sqft??"",
                    "test"=>$app->area_sqft==($verificationDtl->area_sqft??false),
                ],
                [
                    "key"=>"Connection Through",
                    "self"=>$app->connection_through,
                    "verify"=>$verificationDtl->connection_through??"",
                    "test"=>$app->connectionThroughId==($verificationDtl->connectionThroughId??false),
                ],
                [
                    "key"=>"Category",
                    "self"=>$app->category,
                    "verify"=>$verificationDtl->category??"",
                    "test"=>$app->category==($verificationDtl->category??false),
                ],
                [
                    "key"=>"Pipeline Size",
                    "self"=>$app->distributed_pipeline_size,
                    "verify"=>$verificationDtl->distributed_pipeline_size??"",
                    "test"=>$app->distributed_pipeline_size==($verificationDtl->distributed_pipeline_size??false),
                ],
                [
                    "key"=>"Pipeline Size Type",
                    "self"=>$app->distributed_pipeline_type,
                    "verify"=>$verificationDtl->distributed_pipeline_type??"",
                    "test"=>null,
                ],
                 [
                    "key"=>"Pipeline Size Diameter",
                    "self"=>$app->permittedPipeDiameter,
                    "verify"=>$verificationDtl->permittedPipeDiameter??"",
                    "test"=>null,
                ],
                [
                    "key"=>"Pipeline Size Quality",
                    "self"=>$app->permittedPipeQuality,
                    "verify"=>$verificationDtl->permittedPipeQuality??"",
                    "test"=>null,
                ],
                [
                    "key"=>"Ferrule Type",
                    "self"=>$app->ferrule_type,
                    "verify"=>$verificationDtl->ferrule_type??"",
                    "test"=>null,
                ],
                [
                    "key"=>"Road Type",
                    "self"=>$app->road_type,
                    "verify"=>$verificationDtl->road_type??"",
                    "test"=>null,
                ],
                
            ];
          
            $response = [
                "tcDtl"=>[
                    "user_name"=>$user->name??"",
                    "verified_by"=>$verificationDtl->verified_by??"",
                    "verification_date"=>Carbon::parse($verificationDtl->created_at)->format("Y-m-d H:i:s:v"),
                ],
                "appDtl"=>[
                    "application_no"=>$app->application_no,
                    "apply_date"=>$app->apply_date,
                    "application_type"=>$app->connection_type,
                    "property_type"=>$app->property_type,
                    "ward_no"=>$app->ward_no,
                    "new_ward_no"=>$app->new_ward_no,
                    "ownership_type"=>$app->ownership_type,
                ],
                "ownerDtl"=>$owner,
                "appComp"=>$appComp
            ];

            return responseMsgs(true,"Verification Dtl",camelCase($response));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsgs(false,"Server Error!!","");
        }
    }

    public function citizenApplication(Request $request){
        try{
            $user = Auth::user();
            $waterActiveApplication = $this->_WaterActiveApplication
                    ->select("id","application_no","ulb_id","apply_date","connection_type_id","connection_type_id","category","property_detail_id","saf_detail_id",DB::raw("'pending' as app_type, application_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $approvedWaterApplication=$this->_WaterApplication
                    ->select("id","application_no","ulb_id","apply_date","connection_type_id","connection_type_id","category","property_detail_id","saf_detail_id",DB::raw("'approved' as app_type, application_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $rejectedWaterApplication=$this->_WaterRejectedApplication
                    ->select("id","application_no","ulb_id","apply_date","connection_type_id","connection_type_id","category","property_detail_id","saf_detail_id",DB::raw("'approved' as app_type, application_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $waterApplication = $waterActiveApplication->merge($approvedWaterApplication)->merge($rejectedWaterApplication)
                        ->map(function($item){
                        $item->appStatus = $this->getAppStatus($item->id);
                        $item->connectionType = $connectionTypeMaster = ConnectionTypeMaster::find($item->connection_type_id)?->connection_type;
                        $item->saf_no = "";
                        $item->new_holding_no = "";
                        if($item->property_detail_id){
                            $item->new_holding_no = PropertyDetail::find($item->property_detail_id)?->new_holding_no;
                        }
                        if($item->saf_detail_id){
                            $saf = ActiveSafDetail::find($item->saf_detail_id);
                            if(!$saf){
                                $saf = SafDetail::find($item->saf_detail_id);
                            }
                            if(!$saf){
                                $saf = RejectedSafDetail::find($item->saf_detail_id);                
                            }
                            $item->saf_no = $saf?->saf_no;
                        }
                        $item->ulbName = $this->_UlbMaster->find($item->ulb_id)->ulb_name??"";
                        $item->lastTran = $item->getLastTran();
                        $waterDemandBLL = new WaterApplicationDemandBll($item->id);
                        $waterDemandBLL->generateDemand();
                        $item->bueAmount = $waterDemandBLL->_GRID["payableAmount"]??0;
                        return $item;
                    });
            return responseMsg(true,"Water Application",remove_null(camelCase($waterApplication)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }
    
}
