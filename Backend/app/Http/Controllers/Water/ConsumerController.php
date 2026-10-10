<?php

namespace App\Http\Controllers\Water;

use App\Bll\Common;
use App\Bll\Water\BhilaiConsumerDemandGenerateBll;
use App\Bll\Water\ConsumerDemandGenerateBll;
use App\Bll\Water\ConsumerDemandReceiptBll;
use App\Bll\Water\ConsumerDueBll;
use App\Bll\Water\ConsumerPaymentBll;
use App\Bll\Water\PaymentReceiptBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\UlbMaster;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\PropertyDetail;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafDetail;
use App\Models\Water\Consumer;
use App\Models\Water\ConsumerDemand;
use App\Models\Water\ConsumerOwner;
use App\Models\Water\MeterReading;
use App\Models\Water\MeterStatus;
use App\Http\Requests\Water\RequestAddExistingConsumer;
use App\Models\Water\MeterTypeMaster;
use App\Models\Water\ParamModel;
use App\Models\Water\PropertyTypeMaster;
use App\Models\Water\WaterTransaction;
use App\Trait\Water\WaterTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ConsumerController extends Controller
{
    use WaterTrait;

    private $_WaterConstant;
    private $_SystemConstant;
    private $_MODULE_ID;
    private $_CommonClass;
    private $_Conn;

    private $_UlbMaster;

    protected $_Consumer;
    protected $_ConsumerOwner;
    protected $_ConsumerDemand;
    protected $_MeterTypeMaster;
    protected $_PropertyTypeMaster;
    protected $_MeterStatus;
    protected $_MeterReading;
    protected $_WaterTransaction;

    function __construct()
    {
        $this->_WaterConstant = Config::get("WaterConstant");
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["WATER"];        
        $this->_CommonClass = new Common();        
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();        
        
        $this->_UlbMaster = new UlbMaster();

        $this->_Consumer = new Consumer();
        $this->_ConsumerOwner = new ConsumerOwner();
        $this->_ConsumerDemand = new ConsumerDemand();
        $this->_MeterTypeMaster = new MeterTypeMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_MeterStatus = new MeterStatus();
        $this->_MeterReading = new MeterReading();
        $this->_WaterTransaction = new WaterTransaction();
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

    public function searchConsumer(Request $request){
        try{
            $data = $this->consumerMetaDataList();
            if($request->keyWord){
                $data->where(function($where)use($request){
                    $where->where("app.consumer_no","ILIKE","%".$request->keyWord."%")
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
            $list = paginator($data,$request);
            return responseMsg(true,"data Fetched",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function consumerDtl(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $application = $this->_Consumer->readConnection()->find($request->id);            
            $this->adjustValue($application);
            $application->appStatus = $application->lock_status ? "Consumer Deactivated" : "";
            $application->owners = $application->getOwners();
            if($application->lock_status){
                $application->appStatus="Consumer Deactivated";
            }

            $application->tran_dtls = $application->getTrans()->map(function($val){
                $val->balance = $val->request_demand_amount - $val->demand_amt;
                return $val;
            });
            $connectionDtl = $application->getCurrentConnection()->first();
            if($connectionDtl){
                $connectionType = $connectionDtl->getMeterType()->first();
                $connectionDtl->connectionType =$connectionType->meter_type;
                $lastReading = $connectionDtl->getLastReading();
                $connectionDtl->current_reading_date = $lastReading?->created_at;
                $connectionDtl->current_reading = $lastReading?->reading;
                $connectionDtl->doc_path = $lastReading?->doc_path ? url("/documents")."/".$lastReading?->doc_path:"";
                $connectionDtl->userName = $lastReading?->user_id ? $lastReading->getUser()->first()?->name:"";
            }
            $application->connectionDtl = $connectionDtl;
            if($user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                $application->UserPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();
            }
            return responseMsg(true,"Consumer Detail",camelCase(remove_null($application)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function getAllDemands(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $allDemand = $this->_ConsumerDemand->readConnection()
                    ->where("consumer_id",$request->id)
                    ->where("lock_status",false)
                    ->orderBy("demand_from","DESC"); 
            $summaryOrm = clone $allDemand;
            $summary = $summaryOrm->get();
            $data = paginator($allDemand,$request);
            $data["summary"]=[
                "totalDue"=>$summary->sum("balance"),
            ];
            $data["data"] = collect($data["data"])->map(function($val){
                $readingImage = $val->getMeterReading()->first();
                $meterStatus = $readingImage?->getMeterStatus()->first();
                $val->doc_path = $readingImage?->doc_path ? url("/documents")."/".$readingImage?->doc_path:"";
                $val->meter_no = $meterStatus?->meter_no;
                return $val;
            });
            return responseMsg(true,"Consumer Demand History",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error","");
        }
    }


    public function getDemandReceipt(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new ConsumerDemandReceiptBll($request->id);
            $receiptBll->generateReceipt();
            return responseMsg(true,"Water Demand Receipt",camelCase(remove_null($receiptBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }


    public function updateConnectionType(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                "meterTypeId"=>"required|exists:".$this->_MeterTypeMaster->getConnectionName().".".$this->_MeterTypeMaster->getTable().",id",
                "propertyTypeId"=>"required|exists:".$this->_PropertyTypeMaster->getConnectionName().".".$this->_PropertyTypeMaster->getTable().",id",
                "connectionDate"=>"required|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d"),
                "initialReading"=>"required_if:meterTypeId,1".($request->initialReading ? "|numeric" : ""),
                "meterNo"=>"required_if:meterTypeId,1",
                "lastReading"=>"nullable|".($request->lastReading ? "|numeric" : ""),
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
                ],
            ];
            $validator = Validator::make($request->all(),$rule);
            $validator->sometimes('lastReading', 'required', function ($input) use ($request) {
                $consumer = $this->_Consumer->find($request->id);
                $lastConnection = $consumer?->getCurrentConnection;
                return $lastConnection && $lastConnection->meter_type_id == 1;
            });
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth::user();
            $request->merge(["userId"=>$user->id]);
            $consumer = $this->_Consumer->find($request->id);
            $lastConnection = $consumer->getCurrentConnection;
            $relativePath = "Uploads/WaterMeterConnection";
            $imageName = $consumer->id."_".((string) Str::uuid()).".".$request->document->getClientOriginalExtension();
            // $request->document->move($relativePath, $imageName);
            $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
            $newMeterStatusRequest = new Request($request->all());
            $newMeterStatusRequest->merge([
                "consumerId"=>$consumer->id,                
                "docPath"=>$path,
            ]);  
            $this->begin();          
            if($lastConnection){
                $newRequest = new Request($newMeterStatusRequest->all());
                $newRequest->merge([
                    "currentDate"=>$request->connectionDate,
                ]);
                $objGenerateDemand = new ConsumerDemandGenerateBll($request);
                $objGenerateDemand->generateDemand();
            }
            $meterId = $this->_MeterStatus->store($newMeterStatusRequest);            
            if(in_array($request->meterTypeId,[1,2])){
                $meterReadingRequest = new Request($request->all());
                $meterReadingRequest->merge(["meter_status_id"=>$meterId,"reading"=>$request->initialReading]);
                $this->_MeterReading->store($meterReadingRequest);
            }
            $consumer->meter_status_id = $meterId;
            $consumer->update();
            $this->commit();
            return responseMsg(true,"Consumer Connection Update","");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    
    public function testAddExistingConsumer(RequestAddExistingConsumer $request){
        return responseMsg(true,"Valid Request","");
    }

    public function addExistingConsumer(RequestAddExistingConsumer $request){
        try{
            $user = Auth::user();
            $additionData = [];
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }elseif($user){
                $additionData["citizenId"]=$user->id;
            }
            if($request->holdingNo){
                $property = (new PropertyDetail())->where("new_holding_no",$request->holdingNo)->first();
                $additionData["propertyDetailId"] = $property->id ?? null;
            }
            if($request->safNo){
                $saf = (new ActiveSafDetail())->where("saf_no",$request->safNo)->first();
                if(!$saf){
                    $saf = (new SafDetail())->where("saf_no",$request->safNo)->first();
                }
                $additionData["safDetailId"] = $saf->id ?? null;
            }
            if(!$request->areaSqft){
                // area_sqft is NOT NULL in the DB
                $additionData["areaSqft"] = 0;
            }
            $additionData["consumerNo"] = $this->generateConsumerNoByWard($request->wardMstrId,$request->ulbId,$request->connectionTypeId);

            $request->merge($additionData);

            $this->begin();
            $consumerId = $this->_Consumer->store($request);

            foreach($request->ownerDtl as $owner){
                $ownerRequest = new Request($owner);
                $ownerRequest->merge(["consumerId"=>$consumerId]);
                $this->_ConsumerOwner->store($ownerRequest);
            }

            // Existing Connection Details are optional — record them now only if the
            if($request->meterTypeId && $request->connectionDate){
                $docPath = null;
                if($request->document){
                    $relativePath = "Uploads/WaterMeterConnection";
                    $imageName = $consumerId."_".((string) Str::uuid()).".".$request->document->getClientOriginalExtension();
                    $docPath = $request->document->storeAs($relativePath,$imageName, $this->disk);
                }
                $meterStatusRequest = new Request([
                    "consumerId"=>$consumerId,
                    "meterTypeId"=>$request->meterTypeId,
                    "propertyTypeId"=>$request->propertyTypeId,
                    "connectionDate"=>$request->connectionDate,
                    "meterNo"=>$request->meterNo,
                    "docPath"=>$docPath,
                    "userId"=>$user?->id,
                ]);
                $meterId = $this->_MeterStatus->store($meterStatusRequest);
                if($request->meterTypeId == 1){
                    $meterReadingRequest = new Request([
                        "meterStatusId"=>$meterId,
                        "reading"=>$request->initialReading,
                        "userId"=>$user?->id,
                    ]);
                    $this->_MeterReading->store($meterReadingRequest);
                }
                $consumer = $this->_Consumer->find($consumerId);
                $consumer->meter_status_id = $meterId;
                $consumer->update();

                // Fixed (flat-rate) connections have no meter reading to wait on, so back-bill
                // the demand now from the given Effect From date up to today.
                if($request->meterTypeId == 2){
                    $demandRequest = new Request([
                        "id"=>$consumerId,
                        "currentDate"=>Carbon::now()->format("Y-m-d"),
                    ]);
                    $objGenerateDemand = new BhilaiConsumerDemandGenerateBll($demandRequest);
                    $objGenerateDemand->generateDemand();
                }
            }

            $this->commit();
            return responseMsg(true,"Consumer Added",remove_null(camelCase(["id"=>$consumerId,"consumerNo"=>$additionData["consumerNo"]])));
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    public function generateDemand(Request $request)
    {
        try {
            // Define the validation rules.
            $rules = [
                "id" => "required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                "currentDate" => "nullable|date|date_format:Y-m-d|before_or_equal:today",
                "lastReading" => "nullable|numeric",
                "meterImg" => "nullable|file|mimes:bmp,jpeg,jpg,png|max:5120",
            ];

            // Retrieve the consumer and their connection once to avoid repeated queries.
            $consumer = $this->_Consumer->find($request->id);
            
            // Handle the case where the consumer or their connection doesn't exist.
            if (!$consumer || !$consumer->getCurrentConnection) {
                throw new CustomException("Please Update Connection Type First");
            }
            $lastReadingRules = explode('|', $rules['lastReading']);
            $meterImgRules = explode('|', $rules['meterImg']);

            $lastConnection = $consumer->getCurrentConnection;

            // Conditionally apply rules based on the meter type.
            if ($lastConnection->meter_type_id == 1) {
                $lastReadingRules = array_diff($lastReadingRules, ['nullable']);

                $rules['lastReading'] = array_merge((array)$lastReadingRules, [
                    'required',
                    // Custom validation for lastReading.
                    function ($attribute, $value, $fail) use ($lastConnection) {
                        $previousReadingModel = $lastConnection->getLastReading();
                        $previousReading = optional($previousReadingModel)->reading;
                        if ($previousReading !== null && $value < $previousReading) {
                            $fail("The :attribute must be greater than or equal to the previous reading of " . $previousReading);
                        }
                    }
                ]);
                $meterImgRules = array_diff($meterImgRules, ['nullable']);
                $rules['meterImg'] = array_merge((array)$meterImgRules, ['required']);
            }elseif($lastConnection->meter_type_id == 2){
                list($from,$upto)=FyearFromUptoDate(getFy());                
                $rules['currentDate'] = "nullable|date|date_format:Y-m-d|before_or_equal:".$upto;
            }
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return validationError($validator);
            }

            $user = Auth::user();
            $request->merge(["userId" => $user->id]);

            $relativePath = "Uploads/WaterMeterReading";
            if ($request->hasFile('meterImg')) {
                $imageName = $consumer->id . "_" . Str::uuid() . "." . $request->meterImg->getClientOriginalExtension();
                // $request->file('meterImg')->move(public_path($relativePath), $imageName);
                $path = $request->meterImg->storeAs($relativePath,$imageName, $this->disk);
                $request->merge([
                    "docPath" => $path,
                ]);
            }
            
            $this->begin();

            $objGenerateDemand = new BhilaiConsumerDemandGenerateBll($request);
            $objGenerateDemand->generateDemand();

            $response = [
                "taxId" => $objGenerateDemand->_taxId
            ];
            
            $this->commit();

            return responseMsg(true, "Demand Generated", camelCase(remove_null($response)));
        } catch (CustomException $e) {
            $this->rollback();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            $this->rollback();
            return responseMsg(false, "Server Error", "");
        }
    }

    public function consumerDue(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                "demandUpto"=>"nullable|date|date_format:Y-m-d|before_or_equal:today",
            ];
            
            $validator = Validator::make($request->all(), $rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $currentDate = Carbon::now()->format("Y-m-d");
            $demandUpto = $request->demandUpto??$currentDate;
            $objConsumerDueBll = new ConsumerDueBll($request->id,$currentDate,$demandUpto);
            $objConsumerDueBll->getConsumerDue();
            return responseMsg(true,"Consumer Due",camelCase(remove_null($objConsumerDueBll->_GRID)));
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error","");
        }
    }

    public function offlinePayment(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                "paymentType"=>"required|in:FULL,PART",
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

            $water = $this->_Consumer->find($request->id);
            $currentDate = Carbon::now()->format("Y-m-d");
            $demandUpto = $request->demandUpto??$currentDate;

            $objConsumerDueBll = new ConsumerDueBll($request->id,$currentDate,$demandUpto);
            $objConsumerDueBll->getConsumerDue();
            $demandPayableAmount = $objConsumerDueBll->_GRID["payableAmount"];
            if($demandPayableAmount <=0){
                throw new CustomException("All Demand Are Clear");
            } 
            $applicationPaymentBll = new ConsumerPaymentBll($request);

            $this->begin();           
            $responseData = ($applicationPaymentBll->payNow());
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

    public function citizenConsumer(Request $request){
        try{
            $user = Auth::user();
            $consumer = $this->_Consumer->select("id","ulb_id","consumer_no","category","property_detail_id","saf_detail_id",DB::raw("'consumer' as app_type, consumer_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get()
                    ->map(function($item){
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
                        $objConsumerDueBll = new ConsumerDueBll($item->id);
                        $objConsumerDueBll->getConsumerDue();
                        $item->bueAmount = $objConsumerDueBll->_GRID["payableAmount"]??0;
                        return $item;
                    });
            return responseMsg(true,"Water Consumer",remove_null(camelCase($consumer)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }
}
