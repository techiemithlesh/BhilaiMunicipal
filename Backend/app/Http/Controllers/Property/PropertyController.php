<?php

namespace App\Http\Controllers\Property;

use App\Bll\Common;
use App\Bll\Payment\NttData;
use App\Bll\Property\BiharSwmTaxCalculator;
use App\Bll\Property\BiharTaxCalculator;
use App\Bll\Property\NoticeReceiptBll;
use App\Bll\Property\PaymentReceiptBll;
use App\Bll\Property\PropDemandBll;
use App\Bll\Property\PropertyPaymentBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RequestAddExistingProperty;
use App\Http\Requests\Property\RequestOwnerEdit;
use App\Http\Requests\Property\RequestPropertyBasicEdit;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbRolePermission;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\AppBasicUpdate;
use App\Models\Property\AppOwnerUpdate;
use App\Models\Property\DeactivateAppDetail;
use App\Models\Property\NttPaymentRequest;
use App\Models\Property\PropertyAdditionalDocument;
use App\Models\Property\PropertyDemand;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyFloorDetail;
use App\Models\Property\PropertyNotice;
use App\Models\Property\PropertyOwnerDetail;
use App\Models\Property\PropertyTax;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\PropTransaction;
use App\Models\Property\SwmActiveConsumer;
use App\Models\Property\SwmActiveConsumerOwner;
use App\Models\Property\SwmConsumer;
use App\Models\Property\SwmConsumerDemand;
use App\Models\Property\SwmConsumerOwner;
use App\Models\User;
use App\Trait\Property\PropertyTrait;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PropertyController extends Controller
{
    use PropertyTrait;
    /**
     * Created by Sandeep Bara
     * Date : 2025-07-03
     * State : open
     */

    private $_PropertyTypeMaster;
    private $_PropertyTax;
    private $_PropertyDetail;
    private $_PropertyOwnerDetail;
    private $_PropertyFloorDetail;
    private $_PropertyAdditionalDocument;
    private $_PropertyDemand;
    private $_DeactivateAppDetail;
    private $_ActiveSafDetail;
    private $_AppBasicUpdate;
    private $_AppOwnerUpdate;
    private $_PropertyNotice;
    private $_SwmConsumer;
    private $_SwmConsumerOwner;
    private $_SYSTEM_CONST;
    private $_UlbWardMaster;
    private $_UlbMaster;
    private $_User;
    private $_RoleTypeMstr;
    private $_MODULE_ID;
    private $_CommonClass ;
    private $_SwmActiveConsumer;
    private $_SwmActiveConsumerOwner;
    private $_SwmConsumerDemand;
    private $_NttPaymentRequest;
    function __construct()
    {
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_PropertyTax = new PropertyTax();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_PropertyOwnerDetail = new PropertyOwnerDetail();
        $this->_PropertyFloorDetail =  new PropertyFloorDetail();
        $this->_PropertyDemand = new PropertyDemand();
        $this->_DeactivateAppDetail = new DeactivateAppDetail();
        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_AppBasicUpdate = new AppBasicUpdate();
        $this->_AppOwnerUpdate = new AppOwnerUpdate();
        $this->_PropertyNotice = new PropertyNotice();
        $this->_NttPaymentRequest = new NttPaymentRequest();
        $this->_PropertyAdditionalDocument = new PropertyAdditionalDocument();

        $this->_SwmActiveConsumer = new SwmActiveConsumer();
        $this->_SwmActiveConsumerOwner = new SwmActiveConsumerOwner();
        $this->_SwmConsumer = new SwmConsumer();
        $this->_SwmConsumerOwner = new SwmConsumerOwner();
        $this->_SwmConsumerDemand = new SwmConsumerDemand();
        
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_UlbMaster = new UlbMaster();
        $this->_User = new User();
        $this->_RoleTypeMstr = new RoleTypeMstr();

        $this->_CommonClass = new Common();
        $this->_SYSTEM_CONST = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SYSTEM_CONST["MODULE"]["PROPERTY"];
    }

    private function begin(){
        DB::connection("pgsql_property")->beginTransaction();
    }
    private function rollBack(){
        DB::connection("pgsql_property")->rollBack();
    }
    private function commit(){
        DB::connection("pgsql_property")->commit();
    }

    public function searchProperty(Request $request){
        try{
            $property = $this->_PropertyDetail->readConnection()->select(
                "property_details.id",  
                "holding_no",
                "new_holding_no",
                "assessment_type",
                "prop_address",
                "holding_type",
                "prop_address",
                "khata_no",
                "plot_no",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "pm.property_type",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
            )
            ->join("property_type_masters as pm","pm.id","property_details.prop_type_mstr_id")
            ->join(DB::raw("(
                SELECT property_detail_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM property_owner_details
                WHERE lock_status = false
                GROUP BY property_detail_id
            ) AS w"), "w.property_detail_id", "=", "property_details.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "property_details.ward_mstr_id")
            ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "property_details.new_ward_mstr_id")
            ->where("property_details.lock_status", false);

            if($request->keyWord){
                $property->where(function($where)use($request){
                    $where->where("holding_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("new_holding_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $property->whereIn("wm.id",$request->wardId);
            }
            if($request->propTypeId){
                $property->where("prop_type_mstr_id",$request->propTypeId);
            }
            $list = $property;
            $data = paginator($list,$request);
            return responseMsg(true,"Property Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function propDtl(Request $request){
        try{
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $property = $this->_PropertyDetail->find($request->id);            
            if(!$property){
                throw new CustomException("Property Not Found");
            }
            $this->adjustSafValue($property);
            $property->floors = $this->adjustFloorValue($property->getFloors());
            $property->owners = $property->getOwners();
            $property->tran_dtls = $property->getTrans();
            $property->additionalDoc = $property->getAdditionalDoc()->map(function($item){
                $item->docPath = $item->doc_path ? url("/documents")."/".$item->doc_path:"";
                return $item;
            });
            $property->swm_consumer = $property->getSwmConsumer()->map(function($val){
                $val=$this->adjustSWMConsumer($val);
                $val->owners = $val->getOwners();
                $val->tran_dtls = $val->getTrans();
                return $val;
            });
            
            $user = Auth()->user();
            if($user){
                $currentToken = $user->currentAccessToken();
                if($currentToken->login_type !="mobile"){
                    $property->taxDtl = $property->getAllTaxDetail()->get();
                }
            }
            if($user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                $property->UserPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();
                // $property->rolePermission = $this->_CommonClass->getModuleWiseRolePermissions($user->ulb_id,$role->id,$this->_MODULE_ID);               
            }
            return responseMsg(true,"Property Detail",camelCase(remove_null($property)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function editPropBasicDtl(RequestPropertyBasicEdit $request){
        try{
            $user = Auth::user();
            if(!$request->isCorrAddDiffer){
                $request->merge([
                    "isCorrAddDiffer"=>false,
                    "corrAddress"=>$request->propAddress,
                    "corrCity"=>$request->propCity,
                    "corrDist"=>$request->propDist,
                    "corrPinCode"=>$request->propPinCode,
                    "corrState"=>$request->propState,
                ]);
            }
            $property = $this->_PropertyDetail->find($request->id);
            $originalValues = $property->getOriginal();

            $property->ward_mstr_id = $request->wardMstrId;
            $property->new_ward_mstr_id = $request->newWardMstrId;
            $property->khata_no = $request->khataNo;
            $property->plot_no = $request->plotNo;
            $property->village_mauja_name = $request->villageMaujaName;
            $property->area_of_plot = $request->areaOfPlot;
            $property->prop_address = $request->propAddress;
            $property->prop_city = $request->propCity;
            $property->prop_dist = $request->propDist;
            $property->prop_pin_code = $request->propPinCode;
            $property->prop_state = $request->propState;

            $property->is_corr_add_differ = $request->isCorrAddDiffer;

            $property->corr_address = $request->corrAddress;
            $property->corr_city = $request->corrCity;
            $property->corr_dist = $request->corrDist;
            $property->corr_pin_code = $request->corrPinCode;
            $property->corr_state = $request->corrState;

            $imageName = $property->id."_".$user->id."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->document->getClientOriginalExtension(); 
            $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["PROPERTY_BASIC_EDIT"];
            // $request->document->move($relativePath, $imageName);
            $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
            $request->merge([
                "deactivationType"=>1,
                "docPath"=>$path,
                "propertyDetailId"=>$property->id,
            ]);
            // --- Detect changes before saving ---
            $dirty       = $property->getDirty();                  // what's changed
            $changedKeys = array_keys($dirty);                     // keys that changed
            $oldValues   = Arr::only($originalValues, $changedKeys); // previous values of those keys

            $this->begin();
            $property->update();
            $request->merge(["updatesField"=>["old"=>$oldValues,"new"=>$dirty],"userId"=>$user->id]);
            $this->_AppBasicUpdate->store($request);
            $this->commit();
            return responseMsg(true,"Basic Details Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!!","");
        }
    }

    public function editOwnerDtl(RequestOwnerEdit $request){
        try{
            $user = Auth::user();
            $owner = $this->_PropertyOwnerDetail->find($request->id);
            $originalValues = $owner->getOriginal();

            $imageName = $owner->id."_".$user->id."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->document->getClientOriginalExtension(); 
            $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["PROPERTY_BASIC_EDIT"];
            // $request->document->move($relativePath, $imageName);
            $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
            $request->merge([
                "deactivationType"=>1,
                "docPath"=>$path,
                "propertyDetailId"=>$owner->property_detail_id,
                "ownerId"=>$owner->id,
            ]);
            $this->begin();
            $dirtyModel = $this->_PropertyOwnerDetail->editDirty($request);
            $owner->fill($dirtyModel->getAttributes());
            $dirty       = $owner->getDirty();
            $changedKeys = array_keys($dirty);
            $oldValues   = Arr::only($originalValues, $changedKeys);
            $request->merge(["updatesField"=>["old"=>$oldValues,"new"=>$dirty],"userId"=>$user->id]);
            $this->_AppOwnerUpdate->store($request);
            $owner->save();
            $this->commit();
            return responseMsg(true,"Basic Details Updated","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!!","");
        }
    }

    public function getPropDue(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $property = $this->_PropertyDetail->find($request->id);
            if(!$property){
                throw new CustomException("Property Not Found");
            }
            $propDemandBLL = new PropDemandBll($property->id);
            $propDemandBLL->getPropDue();
            return responseMsg(true,"Property Demand",camelCase(remove_null($propDemandBLL->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getPropDemandHistory(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $property = $this->_PropertyDetail->readConnection()->find($request->id);
            if(!$property){
                throw new CustomException("Property Not Found");
            }

            $demandList = $property->getAllDemand()->orderBy("fyear","DESC")->orderBy("qtr","ASC")->get();

            return responseMsg(true,"Property Demand",camelCase(remove_null($demandList)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function propOfflinePayment(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807",
                "paymentType"=>"required|in:FULL,PART,ARREAR",
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
            
            $property = $this->_PropertyDetail->find($request->id);
            if(!$property){
               throw new CustomException("Property Not Found"); 
            }
            $testSafPending = $this->_ActiveSafDetail->find($property->saf_detail_id);
            if($testSafPending){
                throw new CustomException("Saf Not Is Not Approved. Please Wait For Approval");
            }
            $propertyDemandBLL = new PropDemandBll($property->id);
            $propertyDemandBLL->getPropDue();
            $demandPayableAmount = $propertyDemandBLL->_GRID["payableAmount"];
            $isLastPaymentClear = $propertyDemandBLL->_GRID["lastPaymentClear"];
            if($demandPayableAmount <=0){
                throw new CustomException("All Demand Are Clear");
            }
            if(!$isLastPaymentClear){
                throw new CustomException("Last Payment Is Not Clear Please Wait For Clearance");
            } 
            if($propertyDemandBLL->_GRID["notice"]??false && $request->paymentType=="PART"){
                throw new CustomException("If Notice Generated Then Not Pay Part Payment");
            }
            $propertyPaymentBll = new PropertyPaymentBll($request);
            $this->begin();           
            $responseData = ($propertyPaymentBll->payNow());           
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

    public function propOnlineNttDataInitPayment(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807",
                "paymentType"=>"required|in:FULL,PART,ARREAR",
                "amount"=>"nullable|required_if:paymentType,==,PART|numeric|min:0",
                "successUrl"=>"required|url",
                "failUrl"=>"required|url",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $property = $this->_PropertyDetail->find($request->id);
            if(!$property){
               throw new CustomException("Property Not Found"); 
            }
            $testSafPending = $this->_ActiveSafDetail->find($property->saf_detail_id);
            if($testSafPending){
                throw new CustomException("Saf Not Is Not Approved. Please Wait For Approval");
            }
            $propertyDemandBLL = new PropDemandBll($property->id);
            $propertyDemandBLL->getPropDue();
            $demandPayableAmount = $propertyDemandBLL->_GRID["payableAmount"];
            $isLastPaymentClear = $propertyDemandBLL->_GRID["lastPaymentClear"];
            if($demandPayableAmount <=0){
                throw new CustomException("All Demand Are Clear");
            }
            if(!$isLastPaymentClear){
                throw new CustomException("Last Payment Is Not Clear Please Wait For Clearance");
            } 
            if($propertyDemandBLL->_GRID["notice"]??false && $request->paymentType=="PART"){
                throw new CustomException("If Notice Generated Then Not Pay Part Payment");
            }
            $paymentRequest = collect($request->all());
            $paymentRequest = $paymentRequest->merge($propertyDemandBLL->_GRID);
            $paymentRequest = new Request($paymentRequest->toArray());
            $paymentRequest->merge(
                [
                    "moduleId"=>$this->_MODULE_ID,
                    "successUrl"=>$request->successUrl,
                    "failUrl"=>$request->failUrl,
                    "id"=>$request->id,
                    "amount"=>$propertyDemandBLL->_GRID["totalPayableAmount"]
                ]
            );
            $objNTT = new NttData();
            $oderData = $objNTT->initiatePayment($paymentRequest);
            if((!$oderData["status"]) || (!$oderData["atomTokenId"])){
                throw new CustomException("Payment Order Not Created");
            }
            $paymentRequest->merge([
                "atom_token_id"=>$oderData["atomTokenId"],
                "order_id"=>$oderData["orderId"],
                "merch_id"=>$oderData["merchId"],
                "status"=>"PENDING",
                "module"=>"PROPERTY",
                "app_id"=>$request->id,
                "payment_type"=>$request->paymentType,
                "payable_amt"=>$propertyDemandBLL->_GRID["totalPayableAmount"],
                "demand_data"=>json_encode($propertyDemandBLL->_GRID, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                "request_data"=>json_encode($request->all(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                "payload"=>json_encode($oderData["payload"], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                "payload_hash_value"=>$oderData["payload_hash_value"],
                "user_id"=>$user->id,
                "user_type"=>$user->getTable(),
            ]);
            $this->_NttPaymentRequest->store($paymentRequest);
            $response=collect($oderData)->only([
                'status',
                "requestId",
                "atomTokenId",
                "merchId",
                "custEmail",
                "custMobile",
                "returnUrl",
                "amount",
                "orderId",
                "payload_hash_value",
                "mode",
                ]);
            return responseMsg(true,"Payment Initiated",camelCase(remove_null($response)));
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function propOnlineNttDataHandelPayment(Request $request){
        try{
            $rule=[
                "orderId"=>"required|exists:".$this->_NttPaymentRequest->getConnectionName().".".$this->_NttPaymentRequest->getTable()."order_id,status,PENDING",
                "id"=>"required|digits_between:1,9223372036854775807",
                "paymentType"=>"required|in:FULL,PART,ARREAR",
                "amount"=>"nullable|required_if:paymentType,==,PART|numeric|min:0",
            ];

            $rule = [
                "orderId" => "required|exists:".$this->_NttPaymentRequest->getConnectionName().".".$this->_NttPaymentRequest->getTable().",order_id,status,PENDING",

                "id" => "required|integer|min:1",

                "paymentType" => "required|in:FULL,PART,ARREAR",

                "amount" => "nullable|required_if:paymentType,PART|numeric|min:0",
            ];

            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $requestData = $this->_NttPaymentRequest
                            ->where("order_id",$request->orderId)
                            ->where("app_id",$request->id)
                            ->where("module","PROPERTY")
                            ->first();
            $request->merge(["paymentMode"=>"ONLINE","userId"=>$requestData->user_id,"typeOfUser"=>$requestData->user_type]);
            $propertyPaymentBll = new PropertyPaymentBll($request);
            $this->begin();           
            $responseData = ($propertyPaymentBll->payNow()); 
            $requestData->status = $request->status;
            $requestData->response = $request->response;
            $requestData->response_hash_value = $request->response_hash_value;                    
            $requestData->tran_id = $responseData["tranId"]; 
            $requestData->save();
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

    public function verifyOnlinePayment(Request $request){
        try{
            $rule = [
                "orderId" => "required|exists:".$this->_NttPaymentRequest->getConnectionName().".".$this->_NttPaymentRequest->getTable().",order_id",
            ];

            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $requestData = $this->_NttPaymentRequest
                            ->where("order_id",$request->orderId)
                            ->where("module","PROPERTY")
                            ->first();
            if($requestData->status!="SUCCESS"){
                throw new CustomException("Payment Not Clear");
            }
            return responseMsg(true,"Payment Successfully Done",["tranId"=>$requestData->tran_id]);
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getPropPaymentReceipt(Request $request){
        try{
            $proTran = new PropTransaction();
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$proTran->getConnectionName().".".$proTran->getTable().",id",
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

    public function propDeactivate(Request $request){
        try{
            $rules =[
                "id"=>"required|int|exists:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",id,lock_status,false", 
                "remarks"=>"required|string|min:10",
                "document"=>[
                    "required",
                    "mimes:bmp,jpeg,jpg,png,pdf",
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
            
            $user = Auth::user();
            $property = $this->_PropertyDetail->find($request->id); 
            $testSaf = $this->_ActiveSafDetail->find($property->saf_detail_id);
            if($testSaf){
                throw new CustomException("Saf Is Not Approved Please Wait For Approval");
            }
            $imageName = $property->id."_".$user->id."_".(Str::slug(Carbon::now()->toDateTimeString())).".".$request->document->getClientOriginalExtension(); 
            $relativePath = $this->_SYSTEM_CONST["DOC-RELATIVE-PATHS"]["PROPERTY_DEACTIVATE"];
            // $request->document->move($relativePath, $imageName);
            $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
            $request->merge([
                "deactivationType"=>1,
                "docPath"=>$path,
                "propertyDetailId"=>$property->id,
            ]);
            $property->lock_status= true;

            $this->begin();
            $this->_DeactivateAppDetail->store($request);
            $property->update();
            $this->commit();
            return responseMsgs(true,"Property Deactivated","");

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function validateHoldingNo(Request $request){
        try{
            $rules =[
                "holdingNo"=>"required|string|exists:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",new_holding_no,lock_status,false",             
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }           
            
            $property = $this->_PropertyDetail->where("new_holding_no",$request->holdingNo)->where("lock_status",false)->first(); 
            $this->adjustSafValue($property);
            $owners = $property->getOwners(); 
            $property = $property->only(["id","ulb_id","assessment_type","holding_type","holding_no","new_holding_no",
                "zone_mstr_id","ward_mstr_id","new_ward_mstr_id","ownership_type_mstr_id","prop_type_mstr_id","road_type_mstr_id",
                "road_width","ward_no","new_ward_no","ownership_type","zone","property_type","prop_address","prop_city","prop_dist","prop_pin_code","prop_state"]);
            $property["owners"]=$owners;       
            return responseMsg(true,"Validate Property",camelCase(remove_null($property)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function citizenProperty(Request $request){
        try{
            $user = Auth::user();
            $property = $this->_PropertyDetail->select("id","holding_no","new_holding_no","ulb_id","assessment_type",DB::raw("'holding' as app_type, new_holding_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get()
                    ->map(function($item){
                        $item->ulbName = $this->_UlbMaster->find($item->ulb_id)->ulb_name??"";
                        $item->lastTran = $item->getLastTran();
                        $propDemandBLL = new PropDemandBll($item->id);
                        $propDemandBLL->getPropDue();
                        $item->bueAmount = $propDemandBLL->_GRID["payableAmount"]??0;
                        return $item;
                    });
            return responseMsg(true,"property",remove_null(camelCase($property)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function generateNotice(Request $request){
        try{
            $rules =[
                "id"=>"required|int|exists:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",id,lock_status,false",  
                "noticeType"=>"required|string|in:Demand,Assessment",   
                "noticeDate"=>"required|date|before_or_equal:".Carbon::now()->format("Y-m-d"),     
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }  
            
            $user = Auth()->user();
            
            $property = $this->_PropertyDetail->find($request->id); 
            $noticeCount = $this->_PropertyNotice->where("property_detail_id",$property->id)
                        ->where("lock_status",false)
                        ->where("is_clear",false)
                        ->where("notice_type",$request->noticeType)
                        ->count();
            if($noticeCount>=3){
                throw new CustomException("Maximum Notice Generated");
            }

            $testNoticeBefore = $this->_PropertyNotice->where("property_detail_id",$property->id)
                        ->where("lock_status",false)
                        ->where("is_clear",false)
                        ->where("notice_type",$request->noticeType)
                        ->where("notice_date",">",$request->noticeDate)
                        ->count();
            if($testNoticeBefore){
                throw new CustomException("Can't Generate Notice On Previous Date Notice Generated");
            }
            $ulbRolePermission = collect($this->_CommonClass->getUlbRolePermissions($property->ulb_id))->where("module_id",$this->_MODULE_ID)->where("can_notice_approved",true)->first();
            if(!$ulbRolePermission){
                throw new CustomException("Not Approval Role Not Found");
            }
            $role = $this->_RoleTypeMstr->where("id",$ulbRolePermission["role_id"])->first();
            $approvalUser = $role->getUsers()->where("users.lock_status",false)->where("users.ulb_id",$property->ulb_id)->orderBy("users.id","ASC")->first();
            if(!$approvalUser){
                throw new CustomException("Not Approval Person Not Found");
            }
            $margData = [
                "propertyDetailId"=>$property->id,
                "noticeDate"=>Carbon::now()->format("Y-m-d"),
                "userId"=>$user->id,
                "approvedBy"=>$approvalUser->id,
            ];
            if($request->noticeType=="Demand"){
                $propDemandBLL = new PropDemandBll($property->id);
                $propDemandBLL->getPropDue();      
                $grid = $propDemandBLL->_GRID;
                if($grid["arrearDemandAmount"]<=0){
                    throw new CustomException("Demand Cannot Be Generated When Arrear Demand Is Zero");
                }
                $margData["fromFyear"]=$grid["fromFyear"];
                $margData["fromQtr"]=$grid["fromQtr"];
                $margData["uptoFyear"]=$grid["uptoFyear"];
                $margData["uptoQtr"]=$grid["uptoQtr"];
                $margData["demandAmount"]=$grid["demandAmount"];
                $margData["penalty"]=$grid["monthlyPenalty"];
                $margData["arrearDemandAmount"]=$grid["arrearDemandAmount"];
                $margData["arrearPenalty"]=$grid["arrearDemandMonthlyPenalty"];
            }
            $request->merge($margData);
            $this->begin();
            $noticeId = $this->_PropertyNotice->store($request);
            $this->commit();
            $notice = $this->_PropertyNotice->find($noticeId);
            return responseMsg(true,ordinalWithDecimal($notice->serial_no)." Notice Generated",camelCase(remove_null(["noticeId"=>$notice->id,"noticeNo"=>$notice->notice_no])));

        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getPropertyNoticeList(Request $request){
        try{
            $rules =[
                "id"=>"required|int|exists:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",id,lock_status,false",  
                "noticeType"=>"nullable|string|in:Demand,Assessment",           
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }  
            
            $user = Auth()->user();
            $data = $this->_PropertyNotice->where("property_detail_id",$request->id)
                        ->where("lock_status",false)
                        ->where("is_clear",false);
            if($request->noticeType){
                $data->where("notice_type",$request->noticeType);
            }
            $data = $data->orderBy("id","DESC")
                ->get()
                ->map(function($item){
                    $emp = $this->_User->find($item->user_id);
                    $servedEmp = $this->_User->find($item->served_by);
                    $item->generated_by_user_name = $emp?->name;
                    $item->served_by_user_name = $servedEmp?->name;
                    return $item;
                });
            return responseMsg(true," Notice List",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function propertyNoticeDeactivate(Request $request){
        try{
            $rules =[
                "id"=>"required|int|exists:".$this->_PropertyNotice->getConnectionName().".".$this->_PropertyNotice->getTable().",id",    
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $notice = $this->_PropertyNotice->find($request->id);
            if($notice->served_by){
                throw new CustomException("Served Notice Can't Deactivated");
            }
            $test = $this->_PropertyNotice->where("lock_status",false)->where("prev_notice_id",$notice->id)->count();
            if($test){
                throw new CustomException("Next Notice Is Generated. So This Notice Can't Deactivated");
            }
            $user = Auth()->user();
            $notice->deactivated_by = $user->id;
            $notice->lock_status = true;
            $notice->update();
            return responseMsg(true," Notice Deactivate","");

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function propertyNoticeReceipt(Request $request){
        try{
            $rules =[
                "id"=>"required|int|exists:".$this->_PropertyNotice->getConnectionName().".".$this->_PropertyNotice->getTable().",id",    
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new NoticeReceiptBll($request->id); 
            $receiptBll->generateReceipt();
            return responseMsg(true," Notice List",camelCase(remove_null($receiptBll->_GRID)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }


    public function validateExistingHolding(Request $request){
        try{
            $rules = [
                "holdingNo"=>"required|unique:".$this->_PropertyDetail->getConnectionName().".".$this->_PropertyDetail->getTable().",holding_no",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            return responseMsg(true,"Valid Holding","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function testAddExistingPropertyRequest(RequestAddExistingProperty $request){
        return responseMsg(true,"Valid Request",""); 
    }

    public function addExistingProperty(RequestAddExistingProperty $request){
        try{
            if(!$request->isCorrAddDiffer){
                $request->merge([
                    "isCorrAddDiffer"=>false,
                    "corrAddress"=>$request->propAddress,
                    "corrCity"=>$request->propCity,
                    "corrDist"=>$request->propDist,
                    "corrPinCode"=>$request->propPinCode,
                    "corrState"=>$request->propState,
                ]);
            }
            if($request->demandPaidUpto){
                $request->merge(["demandPaidUpto"=>Carbon::parse($request->demandPaidUpto)->format("Y-m-d")]);
            }
            $user = Auth()->user(); 
            $additionData = []; 
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }elseif($user){
                $additionData["citizenId"]=$user->id;
            }

            $holdingType = $this->getHoldingType($request);
            $additionData["holdingType"]=$holdingType;
            $additionData["entryType"]="Existing";
            $calCulator = new BiharTaxCalculator($request);
            $calCulator->calculateTax();
            $tax = collect($calCulator->_GRID);

            $propertyTypeMaster = $this->_PropertyTypeMaster->getPropertyTypeList();

            $request->merge($additionData);
            
            $this->begin();
            $propertyId = $this->_PropertyDetail->store($request);
            if($request->additionDoc){
                $relativePath = "Uploads/ExistingProperty";
                $imageName = $propertyId."_Existing".".".$request->additionDoc->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->additionDoc->storeAs($relativePath,$imageName, $this->disk);
                $additionalDocRequest = new Request(
                    [
                        "property_detail_id"=>$propertyId,
                        "document_name"=>"Existing",
                        "doc_path"=>$path,
                        "user_id"=>$user?->id,
                    ]
                );
                $this->_PropertyAdditionalDocument->store($additionalDocRequest);
            }
            foreach($tax["RuleSetVersionTax"] as $key=>$safTax){  
                if($safTax["Fyearlytax"]) {
                    $taxRequest = new Request($safTax);  
                    $taxRequest->merge(["propertyDetailId"=>$propertyId]);
                    $minFyear = collect($safTax["Fyearlytax"]??[])->min("fyear");
                    $minYearTax = collect($safTax["Fyearlytax"]??[])->where("fyear",$minFyear)->first();
                    $minQtr = collect($minYearTax["quarterly"]??[])->min("qtr");
                    $taxRequest->merge(["Fyear"=>$minFyear,"Qtr"=>$minQtr]);
                    $taxId = $this->_PropertyTax->store($taxRequest);
                    foreach($safTax["Fyearlytax"] as $yearTax){
                        $qtrTax = $yearTax["quarterly"];
                        if ($request->demandPaidUpto) {
                            $paidFy  = getFy($request->demandPaidUpto);
                            $paidQtr = getQtr($request->demandPaidUpto);
                            $qtrTax = collect($yearTax['quarterly'])
                                ->filter(function ($item) use ($paidFy, $paidQtr) {
                                    return $item['fyear'] > $paidFy || ($item['fyear'] == $paidFy && $item['qtr'] > $paidQtr);
                                })
                                ->values()   
                                ->toArray();
                        }
                        foreach($qtrTax as $quarterlyTax){
                            $newDemandRequest = new Request($quarterlyTax);
                            $newDemandRequest->merge(["propertyDetailId"=>$propertyId,"propertyTaxId"=>$taxId,"wardMstrId"=>$request->wardMstrId]);                        
                            $demandId = $this->_PropertyDemand->store($newDemandRequest);
                            
                        }    
                    }
                }          
                
            }
            foreach($request->ownerDtl as $owners){
                $newRequest = new Request($owners);
                $newRequest->merge(["propertyDetailId"=>$propertyId]);
                $this->_PropertyOwnerDetail->store($newRequest);
                
            }
            $vacantLand = collect($propertyTypeMaster)->where("property_type","VACANT LAND")->first();
            if($request->propTypeMstrId!=($vacantLand->id??"")){
                foreach($request->floorDtl as $floor){
                    $newRequest = new Request($floor);
                    $newRequest->merge(["dateFrom"=>$newRequest->dateFrom."-01"]);
                    if($newRequest->dateUpto){
                        $newRequest->merge(["dateUpto"=>$newRequest->dateUpto."-01"]);
                    }
                    $newRequest->merge(["propertyDetailId"=>$propertyId]);
                    $this->_PropertyFloorDetail->store($newRequest);
                    
                }
            }

            if($request->swmConsumer && $request->propTypeMstrId!=($vacantLand->id??"")){
                foreach($request->swmConsumer as $swm){
                    //new Entry
                    $swmNewRequest = new Request($swm);
                    $swmNewRequest->merge(["propertyDetailId"=>$propertyId,"dateOfEffective"=>$swmNewRequest->dateOfEffective."-01"]);
                    $consumerId = $this->_SwmActiveConsumer->store($swmNewRequest);

                    $swmNewRequest->merge(["consumerId"=>$consumerId]);
                    $this->_SwmActiveConsumerOwner->store($swmNewRequest);

                    //transfer
                    $activeConsumer = $this->_SwmActiveConsumer->find($consumerId);
                    $swmConsumer = $activeConsumer->replicate();
                    $swmConsumer->setTable((new SwmConsumer())->getTable());
                    $swmConsumer->id = $activeConsumer->id;
                    $swmConsumer->property_detail_id = $propertyId;
                    $swmConsumer->save();

                    foreach($activeConsumer->getOwners() as $val){
                        $approveOwner = $val->replicate();
                        $approveOwner->setTable((new SwmConsumerOwner())->getTable());
                        $approveOwner->id = $val->id;
                        $approveOwner->save();
                        $val->forceDelete();
                    }
                    $activeConsumer->forceDelete();

                    //tax calculate
                    $newRequest = new Request(camelCase($activeConsumer)->toArray());
                    $objTaxCalculator = new BiharSwmTaxCalculator($newRequest);
                    $objTaxCalculator->calculateTax();
                    $tax = collect($objTaxCalculator->_GRID)->sortBy("demandFrom");
                    foreach($tax as $demand){
                        $newDemand = new Request($demand);
                        $newDemand->merge(["consumer_id"=>$activeConsumer->id,"balance"=>$newDemand->amount]);
                        $this->_SwmConsumerDemand->store($newDemand);

                    }
                }
            }
            $property = $this->_PropertyDetail->find($propertyId);
            $holdingNo = $property->holding_no;
            if(!$request->hasOldHoldingNo){
                $newHoldingNo = $this->generateHoldingNo($propertyId);
                $property->new_holding_no = $newHoldingNo;
                $property->update();
                $holdingNo=$newHoldingNo;
            }
            $this->commit();
            return responseMsg(true,"Holding Add",remove_null(camelCase(["id"=>$property->id,"holdingNo"=>$holdingNo])));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

}
