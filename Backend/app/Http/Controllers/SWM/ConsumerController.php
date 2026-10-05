<?php

namespace App\Http\Controllers\SWM;

use App\Bll\SWM\ConsumerDemandGenerateBll;
use App\Bll\SWM\ConsumerDueBll;
use App\Bll\SWM\ConsumerPaymentBll;
use App\Bll\SWM\DemandReceiptBll;
use App\Bll\SWM\PaymentReceiptBll;
use App\Bll\SWM\TaxCalculator;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\SWM\AddConsumerRequest;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\SWM\CategoryTypeMaster;
use App\Models\SWM\ConnectionDetail;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerConnection;
use App\Models\SWM\ConsumerDeactivation;
use App\Models\SWM\ConsumerDemand;
use App\Models\SWM\ConsumerDemandsCollection;
use App\Models\SWM\ConsumerOwner;
use App\Models\SWM\ConsumerTransaction;
use App\Models\SWM\ConsumerWastCollectionLog;
use App\Models\SWM\ParamModel;
use App\Models\SWM\RateMaster;
use App\Models\SWM\SubCategoryTypeMaster;
use App\Trait\SWM\ConsumerTrait;
use Carbon\Carbon;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Promise;
use GuzzleHttp\Promise\PromiseInterface;
use GuzzleHttp\Promise\Utils;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class ConsumerController extends Controller
{
    //

    use ConsumerTrait;

    private $_MODULE_ID;
    private $_Conn;
    private $_UlbWardMaster;
    private $_PropertyDetail;
    private $_CategoryTypeMaster;
    private $_SubCategoryTypeMaster;
    private $_RateMaster;
    private $_Consumer;
    private $_ConsumerOwner;
    private $_ConsumerDemand;
    private $_ConsumerTransaction;
    private $_ConsumerWastCollectionLog;
    private $_ConsumerDeactivation;
    private $_ConsumerConnection;
    private $_ConnectionDetail;

    function __construct()
    {
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_CategoryTypeMaster = new CategoryTypeMaster();
        $this->_SubCategoryTypeMaster = new SubCategoryTypeMaster();  
        $this->_RateMaster = new RateMaster();
        $this->_Consumer = new Consumer();
        $this->_ConsumerOwner = new ConsumerOwner();
        $this->_ConsumerDemand = new ConsumerDemand();
        $this->_ConsumerTransaction = new ConsumerTransaction();
        $this->_ConsumerWastCollectionLog = new ConsumerWastCollectionLog();
        $this->_ConsumerDeactivation = new ConsumerDeactivation();
        $this->_ConsumerConnection = new ConsumerConnection();
        $this->_ConnectionDetail = new ConnectionDetail();
        $this->_MODULE_ID = config::get("SystemConstant.MODULE.SWM");
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
            $user = Auth()->user();
            $ulbId = $request->ulbId ? $request->ulbId : ($user->ulb_id??0);
            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            $categoryTypeMaster = $this->_CategoryTypeMaster->getCategoryTypeList();
            $fyearList=collect(FyListasoc(Carbon::now()->subYears(10)))->reverse()->values();
            $minDate = FyearFromUptoDate($fyearList[count($fyearList)-1])[0];
            $maxDate = FyearFromUptoDate($fyearList[0])[1];;
            $data=[
                "wardList"=>$ulbWardMaster,
                "categoryType"=>$categoryTypeMaster,
                "fyearList"=>$fyearList,
                "minDate"=>$minDate,
                "maxDate"=>$maxDate,
            ];
            return responseMsg(true,"SWM Master Data",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function getRate(Request $request){
        try{
            $rule=[
                "subCategoryTypeMasterId"=>"required|exists:".$this->_SubCategoryTypeMaster->getConnectionName().".".$this->_SubCategoryTypeMaster->getTable().",id",
                // "dateOfEffective"=>"required|date",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $rate = $this->_RateMaster
                    ->where("sub_category_type_master_id",$request->subCategoryTypeMasterId)
                    ->orderBy("effective_from","DESC")
                    ->first();
            $houseRate = (($rate->rate_per_month??0) * ($request->totalNoOfHouseAreaRoomTruck??0));
            $restaurantRate = (($rate->restaurant_rate_per_month??0) * ($request->totalNoOfRestaurant??0));
            $gardenRate = (($rate->garden_rate_per_month??0) * ($request->totalNoOfGarden??0));
            $banquetHallRate = (($rate->banquet_hall_rate_per_month??0) * ($request->totalNoOfBanquetHall??0));
            $currentRate = roundFigure($houseRate + $restaurantRate + $gardenRate + $banquetHallRate);
            $rate->currentRate = $currentRate;
            return responseMsg(true,"Monthly Rate ",camelCase(remove_null($rate)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function validateHoldingNo(Request $request){
        try{
            $client = new Client();
            $url = Config::get("SystemConstant.HOLDING_VALIDATE");
            $promise =$client->post(
                $url,
                [
                    'json' => $request->all(),
                    [
                        'headers' => $request->header()                         // Attach all headers
                    ]
                ]
            );
            // Create an async HTTP POST request
            $promises[] = $promise;
            // Wait for the promise to complete
            $responses = Utils::settle($promises)->wait();
            // Process the response
            $response = $responses[0];

            if ($response['state'] === PromiseInterface::FULFILLED) {
                $apiResponse = $response['value']->getBody()->getContents();    // Process the response body as needed
                return json_decode($apiResponse, true);
            } else {
                $apiResponse = $response['reason']->getMessage();            // Handle the error message as needed
                throw new Exception($apiResponse);
            }
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function reviewTax(Request $request){
        try{
            $rules = [
                "categoryTypeMasterId" => "required|exists:" .
                    $this->_CategoryTypeMaster->getConnectionName() . "." .
                    $this->_CategoryTypeMaster->getTable() . ",id,lock_status,false",

                "subCategoryTypeMasterId" => "required|exists:" .
                    $this->_SubCategoryTypeMaster->getConnectionName() . "." .
                    $this->_SubCategoryTypeMaster->getTable() . ",id,lock_status,false" .
                    ($request->categoryTypeMasterId ? (",category_type_master_id," . $request->categoryTypeMasterId) : ""),

                "hasCompostingMachineProvision" => "nullable|boolean",
                "dateOfEffective" => "nullable|date|date_format:Y-m",
            ];

            
            $validator = Validator::make($request->all(), $rules);
            if ($request->dateOfEffective) {
                $request->merge([
                    "dateOfEffective" => $request->dateOfEffective . "-01",
                ]);
            }
            if ($validator->fails()) {
                return validationError($validator);
            }
            $calCulator = new TaxCalculator($request);
            $calCulator->getCharge();
            return responseMsg(true,"Tax Review",camelCase(remove_null($calCulator->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }

    }

    public function testAddRequest(AddConsumerRequest $request){
        return responseMsg(true,"Valid Request",""); 
    }

    public function addConsumer(AddConsumerRequest $request){
        try{
            
            $user = Auth()->user(); 
            $additionData = []; 
            if ($request->dateOfEffective) {
                $additionData["dateOfEffective"]=($request->dateOfEffective . "-01");
            }
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }elseif($user){
                $additionData["citizenId"]=$user->id;
            }
            if($request->holdingNo){
                $property = $this->_PropertyDetail->where("new_holding_no", $request->holdingNo)->where("lock_status",false)->first();
                $additionData["propertyDetailId"]=$property?->id;
            }
            $request->merge($additionData);
            $this->begin();
            $consumerId = $this->_Consumer->store($request);
            $consumer = $this->_Consumer->find($consumerId);
            foreach($request->ownerDtl as $owner){
                $newOwnerRequest = new Request($owner);
                $newOwnerRequest->merge(["consumerId"=>$consumerId]);
                $this->_ConsumerOwner->store($newOwnerRequest);
            }
            $connectionRequest = new Request(["consumerId"=>$consumerId,"dateOfEffective"=>$request->dateOfEffective,"userId"=>$request->userId]);
            $connectionId = $this->_ConsumerConnection->store($connectionRequest);

            foreach($request->connectionDtl as $connectionDtl){
                $newConnectionDtlRequest = new Request($connectionDtl);
                $newConnectionDtlRequest->merge(["consumerConnectionId"=>$connectionId]);
                $this->_ConnectionDetail->store($newConnectionDtlRequest);
            }
            list($curentFyearFromDate,$curentFyearLastDate) = FyearFromUptoDate(getFy());
            $request->merge(["id"=>$consumerId,"currentDate"=>$curentFyearLastDate]);
            $objDemandBll = new ConsumerDemandGenerateBll($request);
            $objDemandBll->generateDemand();

            $consumerNo = $consumer->consumer_no??"";
            // $this->commit();
            return responseMsg(true,"Application Submitted ",remove_null(camelCase(["consumerId"=>$consumerId,"consumerNo"=>$consumerNo])));
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function editConsumer(Request $request){
        try{
            $rules=[
                "id"=>"required|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id",
                "wardMstrId"=>"required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
                "holdingNo"=>"required",
                "houseNo"=>"required",
                "address"=>"required|min:5",
                "pinCode"=>"required|int|regex:/[0-9]{6}/",
                
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $this->begin();
            $consumerId = $this->_Consumer->edit($request);            
            $this->commit();
            return responseMsg(true,"Application Edit ","");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollBack();dd($e);
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function editOwners(Request $request){
        try{
            $rules=[
                "consumerId"=>"required|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id",
                "ownerDtl"=>"required|array",
                "ownerDtl.*.id"=>[
                    "nullable",
                    "integer",
                    function ($attribute, $value, $fail) {
                        if($value){
                            if (!$this->_ConsumerOwner->where("id",$value)->exists()) {
                                $fail('The ' . $attribute . ' is invalid.');
                            }
                        }
                    },
                ],
                "ownerDtl.*.ownerName"=>"required",
                "ownerDtl.*.guardianName"=>"nullable",
                "ownerDtl.*.relationType"=>"nullable|required_with:ownerDtl.*.guardianName|in:S/O,D/O,W/O,C/O",
                "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
                "ownerDtl.*.email"=>"nullable|email",
                "ownerDtl.*.lockStatus"=>"required|bool",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $this->begin();
            foreach($request->ownerDtl as $owner){
                $newOwnerRequest = new Request($owner);
                if($newOwnerRequest->id){
                    $this->_ConsumerOwner->edit($newOwnerRequest);
                }else{
                    $newOwnerRequest->merge(["consumerId"=>$request->consumerId]);
                    $this->_ConsumerOwner->store($newOwnerRequest);
                }
            }
            $this->commit();
            return responseMsg(true,"Application Edit ","");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function editConsumerRange(Request $request){
        try{
            $rules=[                
                "consumerId"=>"required|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id",
                "categoryTypeMasterId" => "required|exists:" .
                    $this->_CategoryTypeMaster->getConnectionName() . "." .
                    $this->_CategoryTypeMaster->getTable() . ",id,lock_status,false",

                "subCategoryTypeMasterId" => "required|exists:" .
                    $this->_SubCategoryTypeMaster->getConnectionName() . "." .
                    $this->_SubCategoryTypeMaster->getTable() . ",id,lock_status,false" .
                    ($request->categoryTypeMasterId ? (",category_type_master_id," . $request->categoryTypeMasterId) : ""),

                "hasCompostingMachineProvision" => "nullable|boolean",
                "dateOfEffective" => "required|date|date_format:Y-m",
            ];
            $consumer = $this->_Consumer->find($request->consumerId);
            
            // Handle the case where the consumer or their connection doesn't exist.
            if (!$consumer) {
                throw new CustomException("Invalid Consumer Id");
            }

            $lastDemand = $consumer->getDemand()->orderBy("demand_upto","DESC")->first();
            if($lastDemand){
                $rules['dateOfEffective'] = $rules['dateOfEffective']."|after_or_equal:".Carbon::parse($lastDemand->demand_upto)->format("Y-m");
            }

            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            if ($request->dateOfEffective) {
                $request->merge(["dateOfEffective"=>($request->dateOfEffective . "-01")]);
            }
            $this->begin();
            // old demand generate upto $request->dateOfEffective
            if($lastDemand && ($request->dateOfEffective>Carbon::parse($lastDemand->demand_upto)->format("Y-m"))){
                $newRequest = new Request($request->all());
                $newRequest->merge(["id"=>$request->consumerId]);
                $objDemandBll = new ConsumerDemandGenerateBll($newRequest);
                $objDemandBll->generateDemand();
            }
            $consumer->category_type_master_id = $request->categoryTypeMasterId;
            $consumer->sub_category_type_master_id = $request->subCategoryTypeMasterId;
            $consumer->total_no_of_flat = $request->totalNoOfFlat;
            $consumer->actual_no_of_flat = $request->actualNoOfFlat;
            $consumer->type_of_multi_storey_building = $request->typeOfMultiStoreyBuilding;
            $consumer->date_of_effective = $request->dateOfEffective;
            $consumer->has_composting_machine_provision = $request->hasCompostingMachineProvision;
            $consumer->update();

            if($request->dateOfEffective<Carbon::now()->format("Y-m-d")){
                $newRequest = new Request($request->all());
                $newRequest->merge(["id"=>$request->consumerId]);
                $objDemandBll = new ConsumerDemandGenerateBll($newRequest);
                $objDemandBll->generateDemand();
            }
            $this->commit();
            return responseMsg(true,"Consumer Edit ","");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error!!!","");
        }
    }

    public function validateConsumer(Request $request){
        try {
            $connection = $this->_Consumer->getConnectionName();
            $table = $this->_Consumer->getTable();

            $rules = [
                "consumerNo" => [
                    "required",
                    Rule::exists("$connection.$table", "consumer_no")->where(function ($query) {
                        $query->where("lock_status", false);
                    }),
                ],
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return validationError($validator);
            }

            $consumer = $this->_Consumer->where("consumer_no",$request->consumerNo)->first();

            if ($consumer->lock_status) {
                throw new CustomException("Consumer is deactivated");
            }
            $consumer->name = $this->_Consumer->getOwners()->pluck("owner_name")->implode(",");
            return responseMsg(true, "Valid Consumer", camelCase(remove_null($consumer)));

        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error!!!", "");
        }
    }

    public function installRFID(Request $request) {
        try {
            $connection = $this->_Consumer->getConnectionName();
            $table = $this->_Consumer->getTable();

            $rules = [
                "id"        => "required|exists:$connection.$table,id",
                "rfId"      => "required|unique:$connection.$table,rf_id," . $request->id,
                "latitude"  => "required|numeric",
                "longitude" => "required|numeric",
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return validationError($validator);
            }
            $user = Auth()->user();
            $consumer = $this->_Consumer->find($request->id);

            if ($consumer->lock_status) {
                throw new CustomException("Consumer is deactivated");
            }

            $this->begin();

            $consumer->rf_id = $request->rfId;
            $consumer->latitude = $request->latitude;
            $consumer->longitude = $request->longitude;
            $consumer->rf_id_install_by = $user->id;
            $consumer->rf_id_install_date = Carbon::now()->format("Y-m-d");
            $consumer->save(); 

            $this->commit();

            return responseMsg(true, "RFID Mapped Successfully", "");

        } catch (CustomException $e) {
            $this->rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            $this->rollBack();
            return responseMsg(false, "Internal Server Error!!!", "");
        }
    }

    public function dailyWastCollectionLog(Request $request){
        try {
            $rules = [
                "rfId"          => "required|exists:" . $this->_Consumer->getConnectionName() . "." . $this->_Consumer->getTable() . ",rf_id",
                // "visitingDateTime"  => "required|date|before_or_equal:" . Carbon::now()->format("Y-m-d:H:i:s"),
                // "visitingTime"  => "required|date_format:H:i:s",
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return validationError($validator);
            }
            $request->merge(["visitingDate"=>Carbon::now()->format("Y-m-d"),"visitingTime"=>Carbon::now()->format("H:i:s")]);

            $user = Auth()->user();

            // FIX: Typo → fist() → first()
            $consumer = $this->_Consumer->where('rf_id', $request->rfId)->first();

            if (!$consumer) {
                throw new CustomException("Consumer Not Found");
            }

            if ($consumer->lock_status) {
                throw new CustomException("Consumer Is Deactivated");
            }

            $request->merge([
                "consumerId" => $consumer->id,
                "user_id"    => $user?->id,
            ]);

            $this->begin();

            // Check if entry already exists for same date
            $existing = $this->_ConsumerWastCollectionLog
                ->where("consumer_id", $request->consumerId)
                ->where("visiting_date", $request->visitingDate)
                ->where("lock_status", false)
                ->first();

            if ($existing) {
                $request->merge(["id" => $existing->id]);
                $this->_ConsumerWastCollectionLog->edit($request);
            } else {
                $this->_ConsumerWastCollectionLog->store($request);
            }

            $this->commit();

            return responseMsg(true, "Visiting Details Updated", camelCase(remove_null($consumer)));

        } catch (CustomException $e) {
            $this->rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            $this->rollBack();
            return responseMsg(false, "Internal Server Error!!!", "");
        }
    }


    public function searchConsumer(Request $request){
        try{
            $data = $this->consumerMetaDataList();
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
            $list = paginator($data,$request);
            return responseMsg(true,"data Fetched",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
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
            
            // 2. Eager load all historical connections & details onto the existing $application model
            $application->load([
                'connections' => function ($query) {
                    $query->orderBy('date_of_effective', 'desc'); // Sort newest connection first
                },
                'connections.connectionDetails.category:id,category_type',
                'connections.connectionDetails.subCategory:id,sub_category_type',
            ]);

            $application->connections->each(function ($connection) use ($application) {
                $connection->isCurrent = ($connection->id == $application->current_connection_id);
                
                $connection->connectionDetails->each(function ($detail) {
                    $detail->category_type = $detail->category?->category_type;
                    $detail->sub_category_type = $detail->subCategory?->sub_category_type;
                    
                });
            });
            $application->monthly_charges = $this->getRateCharges($application->id);

            $application->tran_dtls = $application->getTrans()->map(function($val){
                $val->balance = $val->request_demand_amount - $val->demand_amt;
                return $val;
            });
            $objConsumerDueBll = new ConsumerDueBll($application->id);
            $objConsumerDueBll->getConsumerDue();
            $application->dueAmount = $objConsumerDueBll->_GRID["payableAmount"];
            $application->demandFrom = $objConsumerDueBll->_GRID["fromDate"];
            $application->demandUpto = $objConsumerDueBll->_GRID["uptoDate"];
            if($user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                $application->UserPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();
            }
            return responseMsg(true,"Consumer Detail",camelCase(remove_null($application)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error","");
        }
    }

    public function consumerVisitingLog1(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $fyear = getFY();
            if($request->fyear){
                $fyear = $request->fyear;
            }
            list($fromDate,$uptoDate) = FyearFromUptoDate($fyear);
            if($request->fromDate){
                $fromDate=$request->fromDate;
            }
            if($request->uptoDate){
                $uptoDate=$request->uptoDate;
            }
            $rawData = $this->_ConsumerWastCollectionLog
                ->where("lock_status",false)
                ->where("consumer_id",$request->id)
                ->whereBetween("visiting_date",[$fromDate,$uptoDate])
                ->orderBy("visiting_date","ASC")
                ->get();

            $grouped = $rawData->groupBy(function ($item) {
                return Carbon::parse($item->visiting_date)->format('Y-m');
            });
            $result = collect();
            $start = Carbon::parse($fromDate)->startOfMonth();
            $end   = Carbon::parse($uptoDate)->endOfMonth();


            $current = $start->copy();

            while ($current->lte($end)) {

                $monthKey = $current->format('Y-m');

                $records = $grouped->get($monthKey, collect()); // empty if no data

                $result->push([
                    "month"            => $monthKey,
                    "total_no_of_day"  => $current->daysInMonth,
                    "data"             => $records->values()
                ]);

                $current->addMonth();
            }
            return responseMsg(true,"Consumer Detail",camelCase(remove_null($result)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function consumerVisitingLog(Request $request){
        try {
            $rule = [
                "id" => "required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id"
            ];

            $validator = Validator::make($request->all(), $rule);
            if ($validator->fails()) {
                return validationError($validator);
            }

            // Get FY or override
            $fyear = $request->fyear ?? getFY();
            list($fromDate, $uptoDate) = FyearFromUptoDate($fyear);
            $uptoDate = Carbon::now()->endOfMonth()->format("Y-m-d");

            if ($request->fromDate) $fromDate = $request->fromDate;
            if ($request->uptoDate) $uptoDate = $request->uptoDate;

            // Fetch logs
            $rawData = $this->_ConsumerWastCollectionLog
                ->where("lock_status", false)
                ->where("consumer_id", $request->id)
                ->whereBetween("visiting_date", [$fromDate, $uptoDate])
                ->orderBy("visiting_date", "ASC")
                ->get();

            // Create lookup (date => full row record)
            $lookup = $rawData->mapWithKeys(function ($row) {
                return [Carbon::parse($row->visiting_date)->format('Y-m-d') => $row];
            });

            $result = collect();

            $start  = Carbon::parse($fromDate)->startOfMonth();
            $end    = Carbon::parse($uptoDate)->endOfMonth();
            $current = $start->copy();

            while ($current->lte($end)) {

                $monthKey = $current->format('Y-m');
                $daysInMonth = $current->daysInMonth;

                $daysList = [];

                for ($day = 1; $day <= $daysInMonth; $day++) {

                    $dateObj = Carbon::createFromDate(
                        $current->year,
                        $current->month,
                        $day
                    );

                    $date = $dateObj->format('Y-m-d');

                    // If record exists, return entire record
                    $record = $lookup[$date] ?? null;

                    $daysList[] = [
                        "date"   => $date,
                        "visit"  => $record ? true : false,
                        "record" => $record ? $record : null
                    ];
                }

                $result->push([
                    "month" => $monthKey,
                    "totalNoOfDay"  => $daysInMonth,
                    "totalVisitDay"=> collect($daysList)->where("visit",true)->count(),
                    "data" => $daysList
                ]);

                $current->addMonth();
            }

            return responseMsg(true, "Consumer Detail", camelCase(remove_null($result)));

        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Server Error", "");
        }
    }



    public function generateDemand(Request $request)
    {
        try {
            $rules = [
                "id" => "required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                // "currentDate" => "nullable|date|date_format:Y-m-d|before_or_equal:today",               
            ];
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return validationError($validator);
            }

            $user = Auth()->user();
            $request->merge(["userId" => $user->id]);
            list($curentFyearFromDate,$curentFyearLastDate) = FyearFromUptoDate(getFy());
            $request->merge(["currentDate"=>$curentFyearLastDate]);
            
            $this->begin();

            $objGenerateDemand = new ConsumerDemandGenerateBll($request);
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
            return responseMsg(true,"Consumer Demand History",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function consumerDue(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                // "demandUpto"=>"nullable|date|date_format:Y-m-d|before_or_equal:today",
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
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
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
            $tran = ConsumerTransaction::find($responseData["tranId"]);
            $coll = ConsumerDemandsCollection::where("transaction_id",$responseData["tranId"])->get();
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
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ConsumerTransaction->getConnectionName().".".$this->_ConsumerTransaction->getTable().",id",
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

    public function bulkPaymentReceipt(Request $request){
        try{
            $rules = [
                "fromDate"=>"required|date",
                "uptoDate"=>"required|date|before_or_equal:".date('Y-m-d'),
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $tran = $this->_ConsumerTransaction->select("id")
                ->where("lock_status",false)
                ->whereIn("payment_status",[1,2])
                ->whereBetween("tran_date",[$request->fromDate,$request->uptoDate]);
            
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $tran->whereIn("consumer_transactions.ward_mstr_id",$request->wardId);
            }
            if($request->paymentMode){
                if(!is_array($request->paymentMode)){
                    $request->merge(["paymentMode"=>[$request->paymentMode]]);
                }
                $tran->whereIn("consumer_transactions.payment_mode",$request->paymentMode);
            }
            if($request->userId){
                $userIds = is_array($request->userId) ? $request->userId : [$request->userId];
                foreach ([$tran] as $q) {
                    $q->where("consumer_transactions.user_type", "<>", "ONLINE");
                    $q->whereIn("consumer_transactions.user_id", $userIds);
                }
            }

            $data = $tran;
            $data = paginator($data,$request);
            $data["data"] = collect($data["data"])->map(function($item){
                $receiptBll = new PaymentReceiptBll($item->id); 
                $receiptBll->generateReceipt();
                $item->receipt = $receiptBll->_GRID;
                return $item;
            });
            
            return responseMsg(true,"bulk Print Receipt",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getDemandReceipt(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new DemandReceiptBll($request->id); 
            $receiptBll->generateReceipt();
            return responseMsg(true,"Demand Receipt",camelCase(remove_null($receiptBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }


    public function deactivateConsumer(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
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
            if(!$userPermission || !$userPermission->can_app_lock){
                throw new CustomException("Permission Denial");
            }
            $relativePath="Uploads/SwmDeactivation";            
            $consumer = $this->_Consumer->find($request->id);
            $imageName = (string) Str::uuid().".".$request->document->getClientOriginalExtension();
            $request->document->move($relativePath, $imageName);
            $request->merge([
                "consumerId"=>$request->id,
                "docPath"=>$relativePath."/".$imageName,
                "userId"=>$user->id
            ]);
            $consumer->lock_status=true;

            $this->begin();
            $consumer->update();
            $this->_ConsumerDeactivation->store($request);
            $this->commit();
            return responseMsg(true,"Consumer Deactivated","");

        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }
        
    }


    
}
