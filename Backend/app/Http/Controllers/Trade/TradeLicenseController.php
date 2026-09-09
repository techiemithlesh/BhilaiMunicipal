<?php

namespace App\Http\Controllers\Trade;

use App\Bll\Common;
use App\Bll\Trade\LicenseReceiptBll;
use App\Bll\Trade\PaymentReceiptBll;
use App\Bll\Trade\TaxCalculator;
use App\Bll\Trade\TradeApproveBll;
use App\Bll\Trade\TradePaymentBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RequestPostNextLevel;
use App\Http\Requests\Trade\RequestAppEdit;
use App\Http\Requests\Trade\RequestApplyLicense;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\ActiveTradeLicenseNatureOfBusiness;
use App\Models\Trade\ActiveTradeLicenseOwnerDetail;
use App\Models\Trade\ApplicationTypeMaster;
use App\Models\Trade\DocTypeMaster;
use App\Models\Trade\FirmTypeMaster;
use App\Models\Trade\LevelRemark;
use App\Models\Trade\OwnershipTypeMaster;
use App\Models\Trade\ParamModel;
use App\Models\Trade\RejectedTradeLicense;
use App\Models\Trade\TradeItemTypeMaster;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseDocDetail;
use App\Models\Trade\TradeLicenseLog;
use App\Models\Trade\TradeTransaction;
use App\Models\User;
use App\Trait\Trade\TradeTrait;
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

class TradeLicenseController extends Controller
{
    use TradeTrait;
    //

    private $_Conn;
    private $_MODULE_ID;
    private $_SystemConstant;
    private $_TradeConstant;
    private $_ActiveTradeLicense;
    private $_RejectedTradeLicense;
    private $_ActiveTradeLicenseOwnerDetail;
    private $_ActiveTradeLicenseNatureOfBusiness;
    private $_FirmTypeMaster;
    private $_ApplicationTypeMaster;
    private $_OwnershipTypeMaster;
    private $_TradeItemTypeMaster;
    private $_TradeLicense;
    private $_TradeLicenseLog;
    private $_TradeLicenseDocDetail;
    private $_UlbWardMaster;    
    private $_CommonClass ;    
    private $_WorkflowMaster;
    private $_PropertyDetail;
    private $_LevelRemark;
    private $_TradeTransaction;
    private $_RoleTypeMstr;

    private $_UlbMaster;

    function __construct()
    {
        $this->_TradeConstant = Config::get("TradeConstant");
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["TRADE"];        
        $this->_CommonClass = new Common();        
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();

        $this->_WorkflowMaster = new WorkflowMaster();
        $this->_ActiveTradeLicense = new ActiveTradeLicense();
        $this->_ActiveTradeLicenseOwnerDetail = new ActiveTradeLicenseOwnerDetail();
        $this->_ActiveTradeLicenseNatureOfBusiness = new ActiveTradeLicenseNatureOfBusiness();
        $this->_RejectedTradeLicense = new RejectedTradeLicense();
        $this->_TradeLicense = new TradeLicense();
        $this->_TradeLicenseLog = new TradeLicenseLog();
        $this->_TradeLicenseDocDetail = new TradeLicenseDocDetail();
        $this->_LevelRemark = new LevelRemark();
        $this->_TradeTransaction = new TradeTransaction();

        $this->_FirmTypeMaster = new FirmTypeMaster();
        $this->_ApplicationTypeMaster = new ApplicationTypeMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster() ;
        $this->_TradeItemTypeMaster = new TradeItemTypeMaster();

        $this->_UlbMaster = new UlbMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_RoleTypeMstr = new RoleTypeMstr();
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
            $firmType = $this->_FirmTypeMaster->getFirmTypeList();
            $ownershipTypeMaster = $this->_OwnershipTypeMaster->getOwnershipTypeList();
            $itemType = $this->_TradeItemTypeMaster->getItemTypeList();
            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            

            $data=[
                "wardList"=>$ulbWardMaster,
                "ownershipType"=>$ownershipTypeMaster,
                "firmType"=>$firmType,
                "itemType"=>$itemType,
            ];
            return responseMsg(true,"Trade Master Data",camelCase(remove_null($data)));
        }
        catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function testAddRequest(RequestApplyLicense $request){
        return responseMsg(true,"Valid Request",""); 
    }

    public function AddTrade(RequestApplyLicense $request){
        try{
            $user = Auth::user(); 
            $additionData = []; 
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }elseif($user){
                $additionData["citizenId"]=$user->id;
            }
            $additionData["applicationTypeId"] = $this->_TradeConstant["APPLICATION-TYPE"][$request->applicationType];
            if($request->holdingNo){
                $additionData["propertyDetailId"] = $this->_PropertyDetail->where("new_holding_no",$request->holdingNo)->first()->id;
            }

            if(!in_array($request->applicationType,["NEW LICENSE"])){
                $oldLicense = $this->_TradeLicense->find($request->priviesLicenseId);
                $ActiveLicense = $this->_ActiveTradeLicense->where("lock_status",false)->where("privies_license_id",$request->priviesLicenseId)->first();
                if($ActiveLicense){
                    throw new CustomException("You Have Already Apply A License (".$ActiveLicense->application_no.") That Is Not Approve. Please Wait For Approval...");
                }
                if(!$oldLicense){
                    throw new CustomException("Invalid Old License Id");
                }
                if($oldLicense->is_lock){
                    throw new CustomException("Old License Deactivated");
                }
                $additionData["citizenId"] = $oldLicense->citizen_id ? $oldLicense->citizen_id : $additionData["citizenId"]??null;
                $additionData["priviesLicenseIds"]=trim($oldLicense->id.",".$oldLicense->privies_license_ids,',');
                $additionData["licenseNo"]=$oldLicense->license_no;
                $additionData["valid_from"] = $oldLicense->valid_upto;
                if($request->applicationType=="SURRENDER"){
                    $additionData["valid_from"] = $oldLicense->valid_from;
                }
            }elseif($request->applicationType=="NEW LICENSE"){
                $additionData["priviesLicenseId"]=null;
                $additionData["valid_from"] = Carbon::now()->format("Y-m-d");
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
            

            $this->begin();
            $id = $this->_ActiveTradeLicense->store($request);
            foreach($request->ownerDtl as $owners){
                $newRequest = new Request($owners);
                $newRequest->merge(["tradeLicenseId"=>$id]);
                $this->_ActiveTradeLicenseOwnerDetail->store($newRequest);                
            }
            foreach($request->natureOfBusiness as $natureOfBusiness){
                $newRequest = new Request($natureOfBusiness);
                $newRequest->merge(["tradeLicenseId"=>$id]);
                $this->_ActiveTradeLicenseNatureOfBusiness->store($newRequest);                
            }
            $applicationNo = $this->_ActiveTradeLicense->find($id)->application_no??"";
            $this->commit();
            return responseMsg(true,"Application Submitted ",remove_null(camelCase(["licenseId"=>$id,"applicationNo"=>$applicationNo])));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function editAppData(RequestAppEdit $request){
        try{
            $app = $this->_ActiveTradeLicense->find($request->id);
            $additionData["currentDate"]=$app->apply_date;            
            $additionData["propertyDetailId"]=null;
            if($request->holdingNo){
                $additionData["propertyDetailId"] = $this->_PropertyDetail->where("new_holding_no",$request->holdingNo)->first()->id;
            }
            if($app->payment_status){
                $additionData["licenseForYears"]=$app->license_for_years;
            }
            $oldOwners = $app->getOwners();
            $oldNatureOfBusiness = $app->getNatureOfBusiness();
            $newOwners = collect($request->ownerDtl);
            $request->merge($additionData);
            $newRequest = $request;
            $this->begin();
            $this->_ActiveTradeLicense->edit($newRequest);
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
                $ownerRequest->merge(["tradeLicenseId"=>$app->id]);
                if (isset($owners['id']) && $owners['id']>0) {
                    $this->_ActiveTradeLicenseOwnerDetail->edit($ownerRequest);
                } else {
                    $this->_ActiveTradeLicenseOwnerDetail->store($ownerRequest);
                }
            }

            // deactivate old NatureOfBusiness
            foreach($oldNatureOfBusiness as $item){
                $item->lock_status = true;
                $item->save();
            }
            // insert and update old NatureOfBusiness;
            foreach($request->natureOfBusiness as $natureOfBusiness){
                $newRequest = new Request($natureOfBusiness);
                $newRequest->merge(["tradeLicenseId"=>$app->id]);
                $isExist = $this->_ActiveTradeLicenseNatureOfBusiness->where("trade_license_id",$newRequest->tradeLicenseId)->where("trade_item_type_id",$newRequest->tradeItemTypeId)->first();
                if ($isExist)
                {
                    $newRequest->merge(["id"=>$isExist->id,"lock_status"=>false]);
                    $this->_ActiveTradeLicenseNatureOfBusiness->edit($newRequest);
                } else {
                    $this->_ActiveTradeLicenseNatureOfBusiness->store($newRequest);
                }              
            }

            $this->commit();
            $app = $this->_ActiveTradeLicense->find($request->id);
            return responseMsg(true,"Application Edit",$app);
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    public function searchTrade(Request $request){
        try{
            $activeTrade = $this->_ActiveTradeLicense->select(
                "active_trade_licenses.id",                
                DB::raw("active_trade_licenses.id as trade_license_id"),
                DB::raw("'active' as type"),
                "application_no",
                "license_no",
                "pd.new_holding_no",
                "firm_name",
                "address",
                "apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "is_btc",
                "current_role_id",
                "payment_status",
                "is_doc_upload",
            )
            ->join("application_type_masters as pm","pm.id","active_trade_licenses.application_type_id")
            ->join(DB::raw("(
                SELECT trade_license_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM active_trade_license_owner_details
                WHERE lock_status = false
                GROUP BY trade_license_id
            ) AS w"), "w.trade_license_id", "=", "active_trade_licenses.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "active_trade_licenses.ward_mstr_id")
            ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "active_trade_licenses.new_ward_mstr_id")
            ->leftJoin("property_details as pd","pd.id","active_trade_licenses.property_detail_id")
            ->where("active_trade_licenses.lock_status", false);

            $trade = $this->_TradeLicense->select(
                "trade_licenses.id",
                DB::raw("trade_licenses.id as saf_dtl_id"),
                DB::raw("'approved' as type"),
                "application_no",
                "license_no",
                "pd.new_holding_no",
                "firm_name",
                "address",
                "apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "is_btc",
                "current_role_id",
                "payment_status",
                "is_doc_upload",
            )
            ->join("application_type_masters as pm","pm.id","trade_licenses.application_type_id")
            ->join(DB::raw("(
                SELECT trade_license_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM trade_license_owner_details
                WHERE lock_status = false
                GROUP BY trade_license_id
            ) AS w"), "w.trade_license_id", "=", "trade_licenses.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "trade_licenses.ward_mstr_id")
            ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "trade_licenses.new_ward_mstr_id")
            ->leftJoin("property_details as pd","pd.id","trade_licenses.property_detail_id")
            ->where("trade_licenses.lock_status", false);

            $tradeLog = $this->_TradeLicenseLog->select(
                "trade_license_logs.id",
                DB::raw("trade_license_logs.id as saf_dtl_id"),
                DB::raw("'approved' as type"),
                "application_no",
                "license_no",
                "pd.new_holding_no",
                "firm_name",
                "address",
                "apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "is_btc",
                "current_role_id",
                "payment_status",
                "is_doc_upload",
            )
            ->join("application_type_masters as pm","pm.id","trade_license_logs.application_type_id")
            ->join(DB::raw("(
                SELECT trade_license_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM trade_license_owner_details_logs
                WHERE lock_status = false
                GROUP BY trade_license_id
            ) AS w"), "w.trade_license_id", "=", "trade_license_logs.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "trade_license_logs.ward_mstr_id")
            ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "trade_license_logs.new_ward_mstr_id")
            ->leftJoin("property_details as pd","pd.id","trade_license_logs.property_detail_id")
            ->where("trade_license_logs.lock_status", false);


            if($request->keyWord){
                $activeTrade->where(function($where)use($request){
                    $where->where("application_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("license_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                        ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
                $trade->where(function($where)use($request){
                    $where->where("application_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("license_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                        ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
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
                $activeTrade->whereIn("wm.id",$request->wardId);

                $trade->whereIn("wm.id",$request->wardId);
                $tradeLog->whereIn("wm.id",$request->wardId);
            }
            if($request->applyDate){
                $activeTrade->where("apply_date",Carbon::parse($request->applyDate)->format("Y-m-d"));

                $trade->where("apply_date",Carbon::parse($request->applyDate)->format("Y-m-d"));
                $tradeLog->where("apply_date",Carbon::parse($request->applyDate)->format("Y-m-d"));
            }
            $list = $activeTrade->union($trade)->union($tradeLog);
            $data = paginator($list,$request);
            $data["data"] = collect($data["data"])->map(function($item){
                $item->appStatus = $this->getTradeStatus($item->id);
                return $item;
            });
            return responseMsg(true,"License Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getLicenseDtl(Request $request){
        try{
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $trade = $this->_ActiveTradeLicense->readConnection()->find($request->id);
            if(!$trade){
                $trade = $this->_TradeLicense->readConnection()->find($request->id);
            }
            if(!$trade){
                $trade = $this->_TradeLicenseLog->readConnection()->find($request->id);
            }
            if(!$trade){
                throw new CustomException("Trade License Not Found");
            }
            $user = Auth()->user();
            $this->adjustTradeValue($trade);
            $trade->is_approved = $trade->license_date ? true : false;
            $trade->is_renewable =  false;
            $pendingLicense =  $this->_ActiveTradeLicense->where("lock_status",false)->where("privies_license_id",$request->priviesLicenseId)->count();
            if($trade->is_approved  && $trade->getTable()==$this->_TradeLicense->getTable() && $pendingLicense==0){
                $trade->is_renewable =  true;
            } 
            $trade->appStatus = $this->getTradeStatus($trade->id);
            $trade->owners = $trade->getOwners();
            $natureOfBusiness = $trade->getTradeItems()->get();
            $trade->tradeItem = $natureOfBusiness;
            $trade->natureOfBusiness = $natureOfBusiness->implode("trade_item",' , ');
            $trade->tran_dtls = $trade->getTrans();
            $levelRemarks = $trade->getLevelRemarks()->orderBy("id","ASC")->get();
            $trade->level_remarks = collect($levelRemarks)->map(function($val){
                $val->senderRole = $val->getSenderRole()->first()->role_name??"";
                $val->senderUserName = $val->getSenderUser()->first()->name??"";
                $val->receiverRole = $val->getReceiverRole()->first()->role_name??""; 
                $val->actions = flipConstants(Config::get("TradeConstant.ACTION_TYPE"))[$val->verification_status]??"";
                return $val;  
            }); 
            
            if($trade->getTable()==$this->_TradeLicense->getTable() && $user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                $trade->UserPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();              
            }
            
            return responseMsg(true,"Trade License Detail",camelCase(remove_null($trade)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }


    public function reviewTax(Request $request){
        try{
            $rules=[
                "applicationType"=>"required|in:NEW LICENSE,RENEWAL,AMENDMENT,SURRENDER",
                "priviesLicenseId"=>"nullable|required_unless:applicationType,NEW LICENSE|exists:".$this->_TradeLicense->getConnectionName().".".$this->_TradeLicense->getTable().",id",
                "firmEstablishmentDate"=>"required|date|date_format:Y-m-d",
                "licenseForYears"=>"required|int|between:1,10",
                "areaInSqft"=>"required|numeric|min:0.1",
                "isTobaccoLicense"=>"required:bool",
                "natureOfBusiness"=>"required|array",            
                "natureOfBusiness.*.tradeItemTypeId"=>"required|exists:".$this->_TradeItemTypeMaster->getConnectionName().".".$this->_TradeItemTypeMaster->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $request->merge(["applicationId"=>$this->_TradeConstant["APPLICATION-TYPE"][$request->applicationType]]);
            if($request->applicationType!="NEW LICENSE" && $request->priviesLicenseId){
                $oldLicense = $this->_TradeLicense->find($request->priviesLicenseId);
                $request->merge(["firmEstablishmentDate"=>$oldLicense->valid_upto]);
            }
            $calCulator = new TaxCalculator($request);
            $calCulator->getCharge();
            return responseMsg(true,"Tax Review",camelCase(remove_null($calCulator->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }

    }

    public function getLicenseDue(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $trade = $this->_ActiveTradeLicense->find($request->id);
            if(!$trade){
                $trade = $this->_TradeLicense->readConnection()->find($request->id);
            }
            if(!$trade){
                throw new CustomException("Trade Not Found");
            }
            if($trade->payment_status){
                throw new CustomException("All Due Are Clear");
            }
            $requestArr = $this->generateTradeRequestForCharge($trade->id);
            $request->merge($requestArr);
            $tradeDemandBLL = new TaxCalculator($request);
            $tradeDemandBLL->getCharge();
            return responseMsg(true,"Trade Demand",camelCase(remove_null($tradeDemandBLL->_GRID)));
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

            $trade = $this->_ActiveTradeLicense->find($request->id);
            if(!$trade){
                $trade = $this->_TradeLicense->readConnection()->find($request->id);
            }
            if(!$trade){
                throw new CustomException("Trade Not Found");
            }
            if($trade->payment_status){
                throw new CustomException("All Due Are Clear");
            }
            $tradePaymentBll = new TradePaymentBll($request);
            $this->begin();           
            $responseData = ($tradePaymentBll->payNow());
            $trade->payment_status = 1;
            $trade->update();
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

    public function getTradePaymentReceipt(Request $request){
        try{
            $tradeTran = new TradeTransaction();
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$tradeTran->getConnectionName().".".$tradeTran->getTable().",id",
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

    public function getTradeLicenseReceipt(Request $request){
        try{
            $rules = [
                "id" => [
                    "required",
                    "integer",
                    "min:1",
                    "max:9223372036854775807",
                    function ($attribute, $value, $fail) {
                        $inTradeLicense = $this->_TradeLicense->where("id", $value)->exists();
                        $inTradeLicenseLog = $this->_TradeLicenseLog->where("id", $value)->exists();

                        if (!$inTradeLicense && !$inTradeLicenseLog) {
                            $fail("The {$attribute} does not exist.");
                        }
                    },
                ],
            ];

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new LicenseReceiptBll($request->id); 
            $receiptBll->generateReceipt();
            return responseMsg(true,"License Receipt",camelCase(remove_null($receiptBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){dd($e);
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
            $trade = $this->_ActiveTradeLicense->find($request->id);
            if(!$trade){
                $trade = $this->_TradeLicense->find($request->id);
            }
            if(!$trade){
                $trade = RejectedTradeLicense::find($request->id);
            }
            if(!$trade){
                throw new CustomException("Data Not Found");
            }
            $docList= $this->getRequiredDocList($trade);
            return responseMsg(true,"Trade Required Doc List",camelCase(remove_null($docList)));
            
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function uploadDoc(Request $request){
        try{
            $rules =[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ActiveTradeLicense->getConnectionName().".".$this->_ActiveTradeLicense->getTable(),
                "ownerId"=>"nullable|digits_between:1,9223372036854775807",
                "docCode"=>"required",
                "docName"=>"required",
                "document"=>[
                    "required",
                    "mimes:".($request->docCode=="Owner Image" ? "bmp,jpeg,jpg,png":"pdf"),
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
            $trade = $this->_ActiveTradeLicense->find($request->id);
            $requiredDocList = $this->getDocList($request);
            $requiredDocList = $requiredDocList->original["data"];
            $appDocCode = collect($requiredDocList["appDoc"])->pluck("docCode");
            $ownerDoc = collect($requiredDocList["ownerDoc"]);
            $ownerDocCode = collect();
            $doc_type_id = null;

            $role = $user->getRoleDetailsByUserId()->first();
            $workflowMater = $this->_WorkflowMaster->find($trade->workflow_id);
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

            $canDocUpload = $trade->is_btc || ($trade->current_role_id == $trade->initiator_role_id);
            if(!$canDocUpload){
                throw new CustomException("Currently Not Update Doc"); 
            }
            
            $relativePath = "Uploads/TradeDoc";
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
            $oldDoc = $trade->getDocList()
                    ->where("doc_type_id",$doc_type_id)
                    ->where("trade_license_owner_detail_id",$request->ownerId)
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

                $imageName = $trade->id."_".$request->docCode.".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $request->merge(["docPath"=>$path]);
                       
                $oldDoc->doc_name = $request->docName;          
                $oldDoc->doc_path = $request->docPath;
                $oldDoc->user_id = $user->id;
                $oldDoc->update();
                $sms ="Document Updated";
            }else{
                $imageName = $trade->id."_".$request->docCode.".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $request->merge(["docPath"=>$path]);

                $this->_TradeLicenseDocDetail->trade_license_id = $trade->id;                
                $this->_TradeLicenseDocDetail->trade_license_owner_detail_id = $request->ownerId;             
                $this->_TradeLicenseDocDetail->doc_type_id = $doc_type_id;          
                $this->_TradeLicenseDocDetail->doc_name = $request->docName;          
                $this->_TradeLicenseDocDetail->doc_path = $request->docPath;
                $this->_TradeLicenseDocDetail->user_id = $user->id;
                $this->_TradeLicenseDocDetail->save();
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
            $trade = $this->_ActiveTradeLicense->find($request->id);
            if(!$trade){
                $trade = $this->_TradeLicense->find($request->id);
            }
            if(!$trade){
                $trade = RejectedTradeLicense::find($request->id);
            }
            if(!$trade){
                $trade = TradeLicenseLog::find($request->id);
            }
            if(!$trade){
                throw new CustomException("Data Not Found");
            }
            $owner = $trade->getOwners();
            $docList = $trade->getDocList()->get();
            $docList = $docList->map(function($val)use($owner){
                $verifyUser = User::find($val->verified_by_user_id);
                $uploadedUser = User::find($val->user_id);
                $docMaster = DocTypeMaster::find($val->doc_type_id);
                $val->docCode =$docMaster ? Str::title(implode(" ",explode("_",$docMaster->doc_type))) : "";
                $cOwner = $owner->where("id",$val->trade_license_owner_detail_id)->first();
                $val->owner_name = $cOwner ? $cOwner->owner_name : "";
                $val->doc_path = $val->doc_path ? url("/documents")."/".$val->doc_path:"";
                $val->uploaded_by = $uploadedUser ? $uploadedUser->name : "";
                $val->verify_by = $verifyUser ? $verifyUser->name : "";
                return $val;
            });
            return responseMsg(true,"Trade Doc List",camelCase(remove_null($docList)));
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
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_TradeLicenseDocDetail->getConnectionName().".".$this->_TradeLicenseDocDetail->getTable().",id",
                "verificationStatus"=>"required|in:VERIFY,REJECT",
                "remarks"=>"required_if:verificationStatus,REJECT",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth::user();
            $doc = $this->_TradeLicenseDocDetail->find($request->id);
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
                    ->whereIn("active_trade_licenses.ward_mstr_id",$waredId)
                    ->where("active_trade_licenses.ulb_id",$user->ulb_id)
                    ->where("active_trade_licenses.is_btc",false)
                    ->where("active_trade_licenses.payment_status",1)
                    ->where("active_trade_licenses.current_role_id",$role->id);
            if($request->keyWord){
                $data->where(function($where)use($request){
                    $where->where("active_trade_licenses.application_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("owners.owner_name","ILIKE","%".$request->keyWord."%")
                        ->orWhere("owners.mobile_no","ILIKE","%".$request->keyWord."%");

                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("active_trade_licenses.ward_mstr_id",$request->wardId);
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $data->whereBetween("active_trade_licenses.apply_date",[Carbon::parse($request->fromDate)->format("Y-m-d"),Carbon::parse($request->uptoDate)->format("Y-m-d")]);
                }elseif($request->fromDate){
                    $data->where("active_trade_licenses.apply_date",Carbon::parse($request->fromDate)->format("Y-m-d"));
                }elseif($request->uptoDate){
                    $data->where("active_trade_licenses.apply_date",Carbon::parse($request->uptoDate)->format("Y-m-d"));
                }
            }

            
            $list = paginator($data,$request);
            $list["data"] = collect($list["data"])->map(function($item){                
                $lastRemarks = LevelRemark::where("trade_license_id",$item["id"])->orderBy("id","DESC")->first();
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
                    ->whereIn("active_trade_licenses.ward_mstr_id",$waredId)
                    ->where("active_trade_licenses.ulb_id",$user->ulb_id)
                    ->where("active_trade_licenses.is_btc",true)
                    ->where("active_trade_licenses.payment_status",1);
            if($request->keyWord){
                $data->where(function($where)use($request){
                    $where->where("active_trade_licenses.application_no","ILIKE","%".$request->keyWord."%")
                        ->orWhere("owners.owner_name","ILIKE","%".$request->keyWord."%")
                        ->orWhere("owners.mobile_no","ILIKE","%".$request->keyWord."%");

                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("active_trade_licenses.ward_mstr_id",$request->wardId);
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $data->whereBetween("active_trade_licenses.apply_date",[Carbon::parse($request->fromDate)->format("Y-m-d"),Carbon::parse($request->uptoDate)->format("Y-m-d")]);
                }elseif($request->fromDate){
                    $data->where("active_trade_licenses.apply_date",Carbon::parse($request->fromDate)->format("Y-m-d"));
                }elseif($request->uptoDate){
                    $data->where("active_trade_licenses.apply_date",Carbon::parse($request->uptoDate)->format("Y-m-d"));
                }
            }
            
            
            $list = paginator($data,$request);
            $list["data"] = collect($list["data"])->map(function($item){                
                $lastRemarks = LevelRemark::where("trade_license_id",$item["id"])->orderBy("id","DESC")->first();
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
                    ->join("level_remarks","level_remarks.trade_license_id","active_trade_licenses.id")                    
                    ->whereIn("active_trade_licenses.ward_mstr_id",$waredId)
                    ->where("active_trade_licenses.ulb_id",$user->ulb_id)
                    ->where("level_remarks.sender_user_id",$user->id)
                    ->where("active_trade_licenses.is_btc",false)
                    ->where("active_trade_licenses.payment_status",1)
                    ->where("active_trade_licenses.current_role_id","<>",$role->id);

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
            $trade = ActiveTradeLicense::find($request->id);
            if(!$trade){
                throw new CustomException("Data Not Find");
            }
            if(!$trade->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($trade->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }
            $forWardBackWordRole = $this->_CommonClass->getForwordBackwordRoll($user->ulb_id,$trade->workflow_id,$role->id);
            $workflowMater = $this->_WorkflowMaster->find($trade->workflow_id);
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
            if($trade->current_role_id != $role->id && !$trade->is_btc){
                throw new CustomException("This Application Not Pending At You");
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
                $testWoke = $this->testWorks($trade->id);
                $flag = $testWoke["is_work_complied"];
                $message = $testWoke["message"];
                if(!$flag){                    
                    throw new CustomException($message ? $message :"Some Work Is Pending");
                }
                else{
                    if($WfPermission->can_doc_upload){
                        $trade->is_doc_upload = true;
                    }
                    if($WfPermission->can_doc_verify){
                        $trade->is_doc_verify = true;
                        $trade->doc_verify_date = Carbon::now();
                    }                    
                }
            }
            #============================
            $sms = "Application Forward To";
            if($request->status=="FORWARD"){
                #=========forward===============
                if(!$trade->is_btc){
                    $trade->current_role_id = $WfPermission->forward_role_id;
                    $trade->max_level_attempt = $trade->max_level_attempt< $WfPermission->serial_no ? $WfPermission->serial_no : $trade->max_level_attempt;
                }else{
                    $trade->is_btc = false;
                }
            }
            elseif($request->status=="BACKWARD"){
                #===========backward=========
                $sms = "Application Back To";
                if($WfPermission->backward_role_id==$trade->initiator_role_id){
                    $trade->is_btc = true;
                    $sms = "Application Back From";
                }else{
                    $trade->current_role_id = $WfPermission->backward_role_id;
                }
            } 
            $currentRole = $this->_RoleTypeMstr->find($trade->current_role_id);
            $sms .= " " .$currentRole->role_name??"";
            $lastLevel = $this->_LevelRemark->where("trade_license_id",$trade->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_TradeTransaction->where("trade_license_id",$trade->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $trade->apply_date;
            }
            $levelData=[
                "trade_license_id"=>$trade->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$trade->current_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 

            $this->begin();            
            $trade->update();
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
            $trade = ActiveTradeLicense::find($request->id);
            if(!$trade){
                throw new CustomException("Data Not Find");
            }
            

            $workflowMater = $this->_WorkflowMaster->find($trade->workflow_id);
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
            $trade->is_btc = true;
            $currentRole = $this->_RoleTypeMstr->find($trade->current_role_id);
            $sms .= " " .$currentRole->role_name??"";
            $lastLevel = $this->_LevelRemark->where("trade_license_id",$trade->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_TradeTransaction->where("trade_license_id",$trade->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $trade->apply_date;
            }
            $levelData=[
                "trade_license_id"=>$trade->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$trade->initiator_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 
            $this->begin();
            $trade->update();
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
            $trade = ActiveTradeLicense::find($request->id);
            if(!$trade){
                throw new CustomException("Data Not Find");
            }
            if(!$trade->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($trade->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }

            $workflowMater = $this->_WorkflowMaster->find($trade->workflow_id);
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
            $currentRole = $this->_RoleTypeMstr->find($trade->current_role_id);
            $lastLevel = $this->_LevelRemark->where("trade_license_id",$trade->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_TradeTransaction->where("trade_license_id",$trade->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $trade->apply_date;
            }
            $levelData=[
                "trade_license_id"=>$trade->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$trade->current_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 
            $this->begin();
            if($request->status=="APPROVED"){
                $objMemo = new TradeApproveBll($trade->id);
                $objMemo->approveLicense();
            }
            
            if($request->status=="REJECT"){
                $objMemo = new TradeApproveBll($trade->id);
                $objMemo->rejectLicense();
                dd("REJECT");
            }
            $id=$this->_LevelRemark->store($request);

            $this->commit();
            return responseMsg(true,"License Approved","");

        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function citizenTrade(Request $request){
        try{
            $user = Auth::user();
            $activeTradeLicense=$this->_ActiveTradeLicense
                    ->select("id","application_type_id","property_detail_id","application_no","license_no","apply_date","ulb_id","firm_name","valid_from","valid_upto","payment_status",DB::raw("'pending' as app_type, application_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $approvedTradeLicense=$this->_TradeLicense
                    ->select("id","application_type_id","property_detail_id","application_no","license_no","apply_date","ulb_id","firm_name","valid_from","valid_upto","payment_status",DB::raw("'approved' as app_type, application_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $rejectedTradeLicense=$this->_RejectedTradeLicense
                    ->select("id","application_type_id","property_detail_id","application_no","license_no","apply_date","ulb_id","firm_name","valid_from","valid_upto","payment_status",DB::raw("'rejected' as app_type, application_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $tradeLicense = $activeTradeLicense->merge($approvedTradeLicense)->merge($rejectedTradeLicense)->map(function($item) use($request){
                $item->appStatus = $this->getTradeStatus($item->id);
                $item->applicationType = ApplicationTypeMaster::find($item->application_type_id)?->application_type;
                $item->ulbName = $this->_UlbMaster->find($item->ulb_id)->ulb_name??"";
                $item->lastTran = $item->getLastTran();
                
                $item->bueAmount=0;
                if(!$item->payment_status){
                    $requestArr = $this->generateTradeRequestForCharge($item->id);
                    $request->merge($requestArr);
                    $tradeDemandBLL = new TaxCalculator($request);
                    $tradeDemandBLL->getCharge();
                    $item->bueAmount = $tradeDemandBLL->_GRID["totalCharge"]??0;
                }
                return $item;
            });
            return responseMsg(true,"Trade License",remove_null(camelCase($tradeLicense)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }


}
