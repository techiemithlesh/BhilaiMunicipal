<?php

namespace App\Http\Controllers\Property;

use App\Bll\Common;
use App\Bll\Property\BiharTaxCalculator;
use App\Bll\Property\GenerateMemoBll;
use App\Bll\Property\MemoReceiptBll;
use App\Bll\Property\PaymentReceiptBll;
use App\Bll\Property\SafApproval;
use App\Bll\Property\SafApprovalBll;
use App\Bll\Property\SafDemandBll;
use App\Bll\Property\SafPaymentBll;
use App\Bll\Property\TaxCalculator;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RequestFieldVerification;
use App\Http\Requests\Property\RequestAddSaf;
use App\Http\Requests\Property\RequestPostNextLevel;
use App\Http\Requests\Property\RequestTaxReview;
use App\Models\DBSystem\OldWardNewWardMap;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\DBSystem\WorkflowUlbRoleMap;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ActiveSafFloorDetail;
use App\Models\Property\ActiveSafOwnerDetail;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\DocTypeMaster;
use App\Models\Property\FieldVerificationDetail;
use App\Models\Property\FieldVerificationFloorDetail;
use App\Models\Property\FloorMaster;
use App\Models\Property\GeotagDetail;
use App\Models\Property\LevelRemark;
use App\Models\Property\MemoDetail;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\PropTransaction;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\SafAutoApprovedLog;
use App\Models\Property\SafDemand;
use App\Models\Property\SafDetail;
use App\Models\Property\SafDocDetail;
use App\Models\Property\SafFloorDetail;
use App\Models\Property\SafOwnerDetail;
use App\Models\Property\SafTax;
use App\Models\Property\SwmActiveConsumer;
use App\Models\Property\SwmActiveConsumerOwner;
use App\Models\Property\SwmCategoryTypeMaster;
use App\Models\Property\SwmRateMaster;
use App\Models\Property\SwmSubCategoryTypeMaster;
use App\Models\Property\TransferModeMaster;
use App\Models\Property\UsageTypeMaster;
use App\Models\Property\WaterConnectionFacilityType;
use App\Models\Property\WaterTaxType;
use App\Models\Property\ZoneMaster;
use App\Models\User;
use App\Trait\Property\PropertyTrait;
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
use Illuminate\Validation\Rule;

class SafController extends Controller
{
    use PropertyTrait;

    private $_SystemConstant;
    private $_OccupancyTypeMaster;
    private $_ConstructionTypeMaster;
    private $_ApartmentDetail;
    private $_FloorMaster;
    private $_OwnershipTypeMaster;
    private $_PropertyTypeMaster;
    private $_RoadTypeMaster;
    private $_TransferModeMaster;
    private $_UsageTypeMaster;
    private $_UlbWardMaster;
    private $_ZoneMaster;
    private $_OldWardNewWardMap;
    private $_UlbMaster;
    private $_MODULE_ID;
    private $_WorkflowMaster;

    private $_ActiveSafDetail;
    private $_RejectedSafDetail;
    private $_PropertyDetail;
    private $_ActiveSafOwnerDetail;
    private $_ActiveSafFloorDetail;
    private $_PropTransaction;
    private $_SafDetail;
    private $_SafOwnerDetail;
    private $_SafFloorDetail;
    private $_SafTax;
    private $_SafDemand;
    private $_SafDocDetail;
    private $_LevelRemark;
    private $_RoleTypeMstr;
    private $_CommonClass ;
    private $_GeotagDetail;
    private $_FieldVerificationDetail;
    private $_FieldVerificationFloorDetail;
    private $_SafAutoApprovedLog;

    private $_WaterConnectionFacilityType;
    private $_WaterTaxType;

    //========== swm=================
    private $_SwmCategoryTypeMaster;
    private $_SwmSubCategoryTypeMaster;
    private $_SwmRateMaster;
    private $_SwmActiveConsumer;
    private $_SwmActiveConsumerOwner;

    function __construct()
    {
        $this->_SystemConstant = Config::get("SystemConstant");
        $this->_MODULE_ID = $this->_SystemConstant["MODULE"]["PROPERTY"];
        $this->_OccupancyTypeMaster = new OccupancyTypeMaster();
        $this->_ConstructionTypeMaster= new ConstructionTypeMaster();
        $this->_ApartmentDetail = new ApartmentDetail();
        $this->_FloorMaster = new FloorMaster();
        $this->_OwnershipTypeMaster = new OwnershipTypeMaster();
        $this->_PropertyTypeMaster = new PropertyTypeMaster();
        $this->_RoadTypeMaster = new RoadTypeMaster();
        $this->_TransferModeMaster = new TransferModeMaster();
        $this->_UsageTypeMaster = new UsageTypeMaster();
        $this->_ZoneMaster = new ZoneMaster();
        $this->_UlbWardMaster = new UlbWardMaster();
        $this->_OldWardNewWardMap = new OldWardNewWardMap();
        $this->_UlbMaster = new UlbMaster();
        $this->_RoleTypeMstr = new RoleTypeMstr();
        $this->_WorkflowMaster = new WorkflowMaster();

        $this->_CommonClass = new Common();

        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_RejectedSafDetail = new RejectedSafDetail();
        $this->_PropertyDetail = new PropertyDetail();
        $this->_ActiveSafOwnerDetail = new ActiveSafOwnerDetail();
        $this->_ActiveSafFloorDetail = new ActiveSafFloorDetail();
        $this->_SafDetail = new SafDetail();
        $this->_SafOwnerDetail = new SafOwnerDetail();
        $this->_SafFloorDetail = new SafFloorDetail();
        $this->_SafTax = new SafTax();
        $this->_SafDemand = new SafDemand();
        $this->_PropTransaction = new PropTransaction();
        $this->_SafDocDetail = new SafDocDetail();
        $this->_LevelRemark = new LevelRemark();
        $this->_GeotagDetail = new GeotagDetail();
        $this->_FieldVerificationDetail = new FieldVerificationDetail();
        $this->_FieldVerificationFloorDetail = new FieldVerificationFloorDetail();
        $this->_SafAutoApprovedLog = new SafAutoApprovedLog();

        $this->_WaterConnectionFacilityType = new WaterConnectionFacilityType();
        $this->_WaterTaxType = new WaterTaxType();

        $this->_SwmCategoryTypeMaster = new SwmCategoryTypeMaster();
        $this->_SwmSubCategoryTypeMaster = new SwmSubCategoryTypeMaster();
        $this->_SwmRateMaster = new SwmRateMaster();
        $this->_SwmActiveConsumer = new SwmActiveConsumer();
        $this->_SwmActiveConsumerOwner = new SwmActiveConsumerOwner();
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

    public function getSafMasterData(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $request->ulbId ? $request->ulbId : ($user->ulb_id??0);
            $occupancyTypeMaster = $this->_OccupancyTypeMaster->getOccupancyTypeList();
            $constructionTypeMaster = $this->_ConstructionTypeMaster->getConstructionTypeList();
            $floorMaster = $this->_FloorMaster->getFloorList();
            $ownershipTypeMaster = $this->_OwnershipTypeMaster->getOwnershipTypeList();
            $propertyTypeMaster = $this->_PropertyTypeMaster->getPropertyTypeList();
            $roadTypeMaster = $this->_RoadTypeMaster->getRoadTypeList();
            $transferModeMaster = $this->_TransferModeMaster->getTransferModeList();
            $usageTypeMaster  = $this->_UsageTypeMaster->getUsageTypeList();
            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            $electricityType = Config::get('PropertyConstant.ELECTRIC_CATEGORY');
            $zoneType = $this->_ZoneMaster->getZoneList();
            $swmConsumerType = $this->_SwmCategoryTypeMaster->getCategoryTypeList();
            $fyearList = collect(FyListdesc(null,"1986"))->map(function($item){
                return ["fromDate"=>Carbon::parse(FyearQutFromDate($item,1))->format("Y-m"),"uptoDate"=>Carbon::parse(FyearQutUptoDate($item,4))->format("Y-m"),"fyear"=>$item];
            });

            $waterFacility = $this->_WaterConnectionFacilityType->getWaterFacilityList();
            $waterTax = $this->_WaterTaxType->getWaterTaxList()->map(function($item){
                $item->tax_type = $item->tax_type." @ ".$item->amount;
                return $item;
            });

            $data=[
                "wardList"=>$ulbWardMaster,
                "ownershipType"=>$ownershipTypeMaster,
                "propertyType"=>$propertyTypeMaster,
                "roadType"=>$roadTypeMaster,
                "transferMode"=>$transferModeMaster,
                "occupancyType"=>$occupancyTypeMaster,
                "constructionType"=>$constructionTypeMaster,
                "floorType"=>$floorMaster,
                "usageType"=>$usageTypeMaster,
                "electricityType"=>$electricityType,
                "zoneType"=>$zoneType,
                "swmConsumerType"=>$swmConsumerType,
                "fyearList"=>$fyearList,
                "waterFacility"=>$waterFacility,
                "waterTax"=>$waterTax,
            ];
            return responseMsg(true,"Property Master Data",camelCase(remove_null($data)));
        }
        catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getNewWardByOldWard(Request $request){
        try{
            $rule=[
                "oldWardId"=>"required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $oldWard = $this->_UlbWardMaster->readConnection()->find($request->oldWardId);
            $newWards = $oldWard->getNewWardByOldWard();
            return responseMsg(true,"new Wards Of ".$oldWard->ward_no,camelCase(remove_null($newWards)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getSwmSubCategoryList(Request $request){
        try{
            $rule=[
                "categoryTypeMasterId"=>"required|exists:".$this->_SwmCategoryTypeMaster->getConnectionName().".".$this->_SwmCategoryTypeMaster->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $categoryTypeMaster = $this->_SwmCategoryTypeMaster->readConnection()->find($request->categoryTypeMasterId);
            $subCategoryTypeMaster = $categoryTypeMaster->getSubCategoryList();
            return responseMsg(true,"Sub Category Type List Of ".$categoryTypeMaster->category_type,camelCase(remove_null($subCategoryTypeMaster)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getSwmRate(Request $request){
        try{
            $rule=[
                "subCategoryTypeMasterId"=>"required|exists:".$this->_SwmSubCategoryTypeMaster->getConnectionName().".".$this->_SwmSubCategoryTypeMaster->getTable().",id",
                "category"=>"required|in:APL,BPL",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $rate = $this->_SwmRateMaster
                    ->where("sub_category_type_master_id",$request->subCategoryTypeMasterId)
                    ->where("category",$request->category)
                    ->orderBy("effective_from","DESC")
                    ->first();
            return responseMsg(true,"Sub Category Type Rate ",camelCase(remove_null($rate)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getApartmentListByOldWard(Request $request){
        try{
            $rule=[
                "oldWardId"=>"required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $apartments = collect($this->_ApartmentDetail->getApartmentDetailByWardList($request->oldWardId))->sortBy("apartment_name")->values();
            return responseMsg(true,"Apartment List",camelCase(remove_null($apartments)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
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

    public function testAddRequest(RequestAddSaf $request){
        $user = Auth()->user(); 
        if($user->getTable()=="users"){
            $role = $user->getRoleDetailsByUserId()->first();
            if($role && in_array($role->id,[5])){
                $request->merge(["skip_tc_level"=>true]);
                $rules=[
                    "geoTag"=>"required|array|min:3",
                    "geoTag.*.direction"=>"required|in:right side,left side,front side,Water Harvesting",
                    "geoTag.*.document"=>"required|mimes:bmp,jpeg,jpg,png",
                    "geoTag.*.latitude"=>"required",
                    "geoTag.*.longitude"=>"required"
                ];
                $validator = Validator::make($request->all(),$rules);
                if($validator->fails()){
                    return validationError($validator);
                }
            }

        }
        return responseMsg(true,"Valid Request",""); 
    }

    public function AddSaf(RequestAddSaf $request){
        try{
            $user = Auth()->user(); 
            if($user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                if($role && in_array($role->id,[5])){
                    $request->merge(["skip_tc_level"=>true]);
                    $rules=[
                        "geoTag"=>"required|array|min:3",
                        "geoTag.*.direction"=>"required|in:right side,left side,front side,Water Harvesting",
                        "geoTag.*.document"=>"required|mimes:bmp,jpeg,jpg,png",
                        "geoTag.*.latitude"=>"required",
                        "geoTag.*.longitude"=>"required"
                    ];
                    $validator = Validator::make($request->all(),$rules);
                    if($validator->fails()){
                        return validationError($validator);
                    }
                }

            }
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
            $additionData = []; 
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }elseif($user){
                $additionData["citizenId"]=$user->id;
            }
            if(in_array($request->assessmentType,["Reassessment","Mutation"])){
                $property = $this->_PropertyDetail->where("lock_status",false)->find($request->previousHoldingId);                
                if(!$property){
                    throw new CustomException("Previous Holding Not Found!!!");
                }
                $testPendingSaf = $this->_ActiveSafDetail->where("previous_holding_id",$request->previousHoldingId)->first();
                if($testPendingSaf && in_array($request->assessmentType,["Reassessment"])){
                    throw new CustomException("You Have Already Apply A Saf (".$testPendingSaf->saf_no.") That Is Not Approve. Please Wait For Approval...");
                }
                $isCurrentSafPending = $this->_ActiveSafDetail->find($property->saf_detail_id);
                if($isCurrentSafPending){
                    throw new CustomException("Your Saf (".$isCurrentSafPending->saf_no.") Application Is Not Approve. Please Wait For Approval...");
                }
                $additionData["citizenId"] = $property->citizen_id ? $property->citizen_id : $additionData["citizenId"]??null;
                $additionData["holdingNo"] = $property->new_holding_no ? $property->new_holding_no : $property->holding_no;
            }elseif(in_array($request->assessmentType,["New Assessment"])){
                $additionData["previousHoldingId"]= null;
                $additionData["holdingNo"] = null;
            } 
            $holdingType = $this->getHoldingType($request);
            $additionData["holdingType"]=$holdingType;
            $calCulator = new BiharTaxCalculator($request);
            $calCulator->calculateTax();
            $tax = collect($calCulator->_GRID);
            $propertyTypeMaster = $this->_PropertyTypeMaster->getPropertyTypeList();
            
            $workflowMater = $this->_WorkflowMaster->where("module_id",$this->_MODULE_ID )
                ->where("workflow_name",$request->assessmentType)
                ->where("lock_status",false)
                ->first();
            if(!$workflowMater){
                throw new CustomException("their is no Workflow");
            }
            $initFinishRole = $this->_CommonClass->initiatorFinisher($request->ulbId,$workflowMater->id);
            $initiator = $initFinishRole["initiator"]??[];
            $finisher = $initFinishRole["finisher"]??[];
            if(!($initiator["role_id"]??false)){
                throw new CustomException("Initiator Not Found");
            }
            if(!($finisher["role_id"]??false)){
                throw new CustomException("Finisher Not Found");
            }
            $additionData["currentRoleId"]=$initiator["role_id"];
            $additionData["initiatorRoleId"]=$initiator["role_id"];
            $additionData["finisherRoleId"]=$finisher["role_id"];
            $additionData["workflowId"]=$workflowMater->id;

            $request->merge($additionData);
            
            $this->begin();
            $safId = $this->_ActiveSafDetail->store($request);
            
            foreach($tax["RuleSetVersionTax"] as $key=>$safTax){  
                if($safTax["Fyearlytax"]) {
                    $taxRequest = new Request($safTax);  
                    $taxRequest->merge(["safDetailId"=>$safId]);
                    $minFyear = collect($safTax["Fyearlytax"]??[])->min("fyear");
                    $minYearTax = collect($safTax["Fyearlytax"]??[])->where("fyear",$minFyear)->first();
                    $minQtr = collect($minYearTax["quarterly"]??[])->min("qtr");
                    $taxRequest->merge(["Fyear"=>$minFyear,"Qtr"=>$minQtr]);
                    $taxId = $this->_SafTax->store($taxRequest);
                    // foreach($safTax["Fyearlytax"] as $yearTax){
                    //     foreach($yearTax["quarterly"] as $quarterlyTax){
                    //         $newDemandRequest = new Request($quarterlyTax);
                    //         $newDemandRequest->merge(["safDetailId"=>$safId,"safTaxId"=>$taxId,"wardMstrId"=>$request->wardMstrId]);                        
                    //         $demandId = $this->_SafDemand->store($newDemandRequest);
                            
                    //     }    
                    // }
                }          
                
            }
            foreach($request->ownerDtl as $owners){
                $newRequest = new Request($owners);
                $newRequest->merge(["safDetailId"=>$safId]);
                $this->_ActiveSafOwnerDetail->store($newRequest);
                
            }
            $vacantLand = collect($propertyTypeMaster)->where("property_type","VACANT LAND")->first();
            if($request->propTypeMstrId!=($vacantLand->id??"")){
                foreach($request->floorDtl as $floor){
                    $newRequest = new Request($floor);
                    $newRequest->merge(["dateFrom"=>$newRequest->dateFrom."-01"]);
                    if($newRequest->dateUpto){
                        $newRequest->merge(["dateUpto"=>$newRequest->dateUpto."-01"]);
                    }
                    $newRequest->merge(["safDetailId"=>$safId]);
                    $this->_ActiveSafFloorDetail->store($newRequest);
                    
                }
            }
            if($request->swmConsumer && $request->propTypeMstrId!=($vacantLand->id??"")){
                foreach($request->swmConsumer as $swm){
                    $swmNewRequest = new Request($swm);
                    $swmNewRequest->merge(["safDetailId"=>$safId,"dateOfEffective"=>$swmNewRequest->dateOfEffective."-01"]);
                    $consumerId = $this->_SwmActiveConsumer->store($swmNewRequest);
                    $swmNewRequest->merge(["consumerId"=>$consumerId]);
                    $swmConsumerOwnerId = $this->_SwmActiveConsumerOwner->store($swmNewRequest);
                }
            }
            $saf = $this->_ActiveSafDetail->find($safId);
            $saf->payment_status =1;
            $saf->update();
            $safNo = $saf->saf_no??"";

            if($request->skip_tc_level){
                $safRequest = camelCase($saf)->toArray();
                $safRequest["safDetailId"]=$saf->id;
                $safRequest["floorDtl"] = camelCase($saf->getFloors()->map(function($item){
                    $item->safFloorDetailId = $item->id;
                    $item->date_from = $item->date_from ? Carbon::parse($item->date_from)->format("Y-m"):$item->date_from;
                    $item->date_upto = $item->date_upto ? Carbon::parse($item->date_upto)->format("Y-m"):$item->date_upto;
                    return $item;
                }))->toArray();

                // 1️⃣ Create a base Illuminate Request
                $baseRequest = Request::create(
                    uri: '',
                    method: 'POST',
                    parameters: $safRequest
                );

                // 2️⃣ Convert to FormRequest
                $formRequest = RequestFieldVerification::createFrom($baseRequest);

                // 3️⃣ REQUIRED bindings
                $formRequest->setContainer(app())
                            ->setRedirector(app('redirect'))
                            ->setUserResolver(fn () => auth()->user());

                // // 4️⃣ Trigger validation + authorize()
                $formRequest->validateResolved();

                // 5️⃣ Call destination method
                $res = $this->fieldVerification($formRequest);
                if(!$res->original["status"]){
                    throw new CustomException("Field Verification Not Done Pleas Contact Admin");
                }
                $geoTagRequest = new Request();
                $geoTagRequest->merge(["geoTag"=>$request->geoTag,"id"=>$saf->id]);
                $geoTagRes = $this->uploadGeoTag($geoTagRequest);
                if(!$geoTagRes->original["status"]){
                    return $geoTagRes;
                }
                $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
                $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role->id)->first();
                $saf->current_role_id = $WfPermission->forward_role_id;
                $saf->update();
            }
            $this->commit();
            return responseMsg(true,"Application Submitted ",remove_null(camelCase(["safId"=>$safId,"safNo"=>$safNo])));
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){ 
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function editBasicsSaf(Request $request){
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
            $rules = [
                "id"=>"required|int|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable().",id",                
                "khataNo"=>"nullable",
                "plotNo"=>"nullable",
                "villageMaujaName"=>"required",
                "areaOfPlot"=>"required|numeric|min:0.1",
                "builtupArea"=>"required|numeric|min:0".($request->areaOfPlot ? "|max:".($request->areaOfPlot) : ""),
                "propAddress"=>"required",
                "propCity"=>"required",
                "propDist"=>"required",
                "propPinCode"=>"required|int",
                "propState"=>"required",
                "isCorrAddDiffer"=>"bool",
                "corrAddress"=>"required_if:isCorrAddDiffer,true",
                "corrCity"=>"required_if:isCorrAddDiffer,true",
                "corrDist"=>"required_if:isCorrAddDiffer,true",
                "corrPinCode"=>"required_if:isCorrAddDiffer,true",
                "corrState"=>"required_if:isCorrAddDiffer,true",   
                "ownerDtl"=>"nullable|array",
                "ownerDtl.*.id"=>"required|int|exists:".$this->_ActiveSafOwnerDetail->getConnectionName().".".$this->_ActiveSafOwnerDetail->getTable().",id",                
                "ownerDtl.*.ownerName"=>"required",
                "ownerDtl.*.guardianName"=>"nullable",
                "ownerDtl.*.relationType"=>"nullable|required_with:ownerDtl.*.guardianName|in:S/O,D/O,W/O,C/O",
                "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
                "ownerDtl.*.email"=>"nullable|email",
                "ownerDtl.*.panNo"=>"nullable|string|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/",
                "ownerDtl.*.aadharNo"=>"nullable|digits:12|regex:/[0-9]{12}/",
                "ownerDtl.*.gender"=>"required|in:Male,Female,Other",
                "ownerDtl.*.dob"=>"required|date|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format("Y-m-d"),
                "ownerDtl.*.isArmedForce"=>"required|bool",
                "ownerDtl.*.isSpeciallyAbled"=>"required|bool",  
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth::user();
            $saf = $this->_ActiveSafDetail->find($request->id);
            $role = $user->getRoleDetailsByUserId()->first();
            $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role?->id)->first();
            if((!$WfPermission) && $user->getTable()=="users"){
                throw new CustomException("You Have No Any Permission On This WorkFlow");
            }
            $canEdit = $WfPermission && ($WfPermission->has_full_permission || $WfPermission->can_app_edit);
            if(!$canEdit && $user->getTable()=="users"){
                throw new CustomException("You do not have permission to edit");
            }
            if($saf->payment_status!=0 && (!$saf->is_btc) && $saf->current_role_id!=$saf->initiator_role_id){
                throw new CustomException("Saf is on Wf pending. You can not edit now");
            }
            
            $saf->khata_no = $request->khataNo;
            $saf->plot_no = $request->plotNo;
            $saf->village_mauja_name = $request->villageMaujaName;
            $saf->area_of_plot = $request->areaOfPlot;
            $saf->builtup_area = $request->builtupArea;
            $saf->prop_address = $request->propAddress;
            $saf->prop_city = $request->propCity;
            $saf->prop_dist = $request->propDist;
            $saf->prop_pin_code = $request->propPinCode;
            $saf->prop_state = $request->propState;
            $saf->is_corr_add_differ = $request->isCorrAddDiffer;
            $saf->corr_address = $request->corrAddress;
            $saf->corr_city = $request->corrCity;
            $saf->corr_dist = $request->corrDist;
            $saf->corr_pin_code = $request->corrPinCode;
            $saf->corr_state = $request->corrState;            
            $this->begin();
            $saf->update();
            if($request->ownerDtl){
                foreach($request->ownerDtl as $owners){
                    $newRequest = new Request($owners);
                    $this->_ActiveSafOwnerDetail->edit($newRequest);
                }
            }
            $this->commit();
            return responseMsg(true,"Application Basic Update Successfully ","");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){ 
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function searchSaf(Request $request){
        try{
            $activeSaf = $this->_ActiveSafDetail->select(
                "active_saf_details.id",                
                DB::raw("active_saf_details.id as saf_dtl_id"),
                DB::raw("'active' as type"),
                "saf_no",
                "holding_no",
                "assessment_type",
                "prop_address",
                "apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "pm.property_type",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "saf_pending_status",
                "is_btc",
                "current_role_id",
                "payment_status",
                "is_doc_upload",
            )
            ->join("property_type_masters as pm","pm.id","active_saf_details.prop_type_mstr_id")
            ->join(DB::raw("(
                SELECT saf_detail_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM active_saf_owner_details
                WHERE lock_status = false
                GROUP BY saf_detail_id
            ) AS w"), "w.saf_detail_id", "=", "active_saf_details.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "active_saf_details.ward_mstr_id")
            ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "active_saf_details.new_ward_mstr_id")
            ->where("active_saf_details.lock_status", false);

            $saf = $this->_SafDetail->select(
                "saf_details.id",
                DB::raw("saf_details.id as saf_dtl_id"),
                DB::raw("'approved' as type"),
                "saf_no",
                "holding_no",
                "assessment_type",
                "prop_address",
                "apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",                
                "pm.property_type",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "saf_pending_status",
                "is_btc",
                "current_role_id",
                "payment_status",
                "is_doc_upload",
            )
            ->join("property_type_masters as pm","pm.id","saf_details.prop_type_mstr_id")
            ->join(DB::raw("(
                SELECT saf_detail_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM saf_owner_details
                WHERE lock_status = false
                GROUP BY saf_detail_id
            ) AS w"), "w.saf_detail_id", "=", "saf_details.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "saf_details.ward_mstr_id")
            ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "saf_details.new_ward_mstr_id")
            ->where("saf_details.lock_status", false);


            if($request->keyWord){
                $activeSaf->where(function($where)use($request){
                    $where->where("saf_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("saf_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
                $saf->where(function($where)use($request){
                    $where->where("saf_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("saf_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $activeSaf->whereIn("wm.id",$request->wardId);

                $saf->whereIn("wm.id",$request->wardId);
            }
            if($request->applyDate){
                $activeSaf->where("apply_date",Carbon::parse($request->applyDate)->format("Y-m-d"));

                $saf->where("apply_date",Carbon::parse($request->applyDate)->format("Y-m-d"));
            }
            $list = $activeSaf->union($saf)->orderBy("apply_date","DESC");
            $data = paginator($list,$request);
            $data["data"] = collect($data["data"])->map(function($item){
                $item->appStatus = $this->getSafStatus($item->id);
                return $item;
            });
            return responseMsg(true,"User Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getSafDtl(Request $request){
        try{
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $saf = $this->_ActiveSafDetail->find($request->id);
            if(!$saf){
                $saf = $this->_SafDetail->readConnection()->find($request->id);
            }
            if(!$saf){
                throw new Exception("Saf Not Found");
            }
            $this->adjustSafValue($saf);
            $saf->is_approved = $saf->getTable()=="saf_details";
            $saf->appStatus = $this->getSafStatus($saf->id);
            $saf->floors = $this->adjustFloorValue($saf->getFloors());
            $saf->owners = $saf->getOwners();
            $saf->swm_consumer = $saf->getSwmConsumer()->map(function($val){
                $val=$this->adjustSWMConsumer($val);
                $val->owners = $val->getOwners();
                $val->tran_dtls = $val->getTrans();
                return $val;
            });
            $saf->tran_dtls = $saf->getTrans();
            $saf->memo_dtls = $saf->getMemo()->get()->map(function($item){
                $user = User::find($item->user_id);
                $item->user_name = $user ? $user->name : null;
                return $item;
            });
            $saf->tc_verifications=$saf->getVerification()->get()->map(function($item){
                $user = User::find($item->user_id);
                $item->user_name = $user ? $user->name : null;
                return $item;
            });
            $levelRemarks = $saf->getLevelRemarks()->orderBy("id","ASC")->get();
            $autoForwardDoc  = $this->_SafAutoApprovedLog->where("saf_detail_id",$saf->id)->where("lock_status",false)->orderBy("id","desc")->first();
            
            $saf->level_remarks = collect($levelRemarks)->map(function($val)use($autoForwardDoc){
                if($autoForwardDoc && $val->sender_remarks=="Auto Approved"){
                    $val->doc_path = $autoForwardDoc->doc_path ? url("/documents")."/".$autoForwardDoc->doc_path:"";
                }
                $val->senderRole = $val->getSenderRole()->first()->role_name??"";
                $val->senderUserName = $val->getSenderUser()->first()->name??"";
                $val->receiverRole = $val->getReceiverRole()->first()->role_name??""; 
                $val->actions = flipConstants(Config::get("PropertyConstant.ACTION_TYPE"))[$val->verification_status]??"";
                return $val;  
            });
            $user = Auth()->user();
            if($user){
                $currentToken = $user->currentAccessToken();
                $saf->taxDtl = $saf->getAllTaxDetail()->get();
                // if($currentToken->login_type !="mobile"){
                // }
            }
            return responseMsg(true,"Saf Detail",camelCase(remove_null($saf)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getSafDue(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $saf = $this->_ActiveSafDetail->find($request->id);
            if(!$saf){
                $saf = $this->_SafDetail->readConnection()->find($request->id);
            }
            if(!$saf){
                throw new CustomException("Saf Not Found");
            }
            $safDemandBLL = new SafDemandBll($saf->id);
            $safDemandBLL->getSafDue();
            return responseMsg(true,"saf Demand",camelCase(remove_null($safDemandBLL->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function safOfflinePayment(Request $request){
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

            $saf = $this->_ActiveSafDetail->find($request->id);
            if(!$saf){
                $saf = $this->_SafDetail->readConnection()->find($request->id);
            }
            if(!$saf){
                throw new CustomException("Saf Not Found");
            }
            $safDemandBLL = new SafDemandBll($saf->id);
            $safDemandBLL->getSafDue();
            $demandPayableAmount = $safDemandBLL->_GRID["payableAmount"];
            if($demandPayableAmount <=0){
                throw new CustomException("All Demand Are Clear");
            } 
            $safPaymentBll = new SafPaymentBll($request);
            $this->begin();           
            $responseData = ($safPaymentBll->payNow());
            $saf->payment_status = 1;
            $saf->update();
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

    public function getSafPaymentReceipt(Request $request){
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
            // dd($receiptBll);
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
                    ->whereIn("active_saf_details.ward_mstr_id",$waredId)
                    ->where("active_saf_details.ulb_id",$user->ulb_id)
                    ->where("active_saf_details.is_btc",false)
                    ->where("active_saf_details.payment_status",1)
                    ->where("active_saf_details.current_role_id",$role->id);
            if($request->key){
                $data->where(function($where)use($request){
                    $where->where("active_saf_details.saf_no","ILIKE","%".$request->key."%")
                    ->orWhere("active_saf_details.saf_no","ILIKE","%".$request->key."%")
                    ->orWhere("owners.owner_name","ILIKE","%".$request->key."%")
                    ->orWhere("owners.mobile_no","ILIKE","%".$request->key."%");

                });                
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("active_saf_details.ward_mstr_id",$request->wardId);
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $data->whereBetween("active_saf_details.apply_date",[Carbon::parse($request->fromDate)->format("Y-m-d"),Carbon::parse($request->uptoDate)->format("Y-m-d")]);
                }elseif($request->fromDate){
                    $data->where("active_saf_details.apply_date",Carbon::parse($request->fromDate)->format("Y-m-d"));
                }elseif($request->uptoDate){
                    $data->where("active_saf_details.apply_date",Carbon::parse($request->uptoDate)->format("Y-m-d"));
                }
            }

            
            $list = paginator($data,$request);
            $list["data"] = collect($list["data"])->map(function($item){                
                $lastRemarks = LevelRemark::where("saf_detail_id",$item["id"])->orderBy("id","DESC")->first();
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
                    ->join("level_remarks","level_remarks.saf_detail_id","active_saf_details.id")
                    ->whereIn("active_saf_details.ward_mstr_id",$waredId)
                    ->where("active_saf_details.ulb_id",$user->ulb_id)
                    ->where("level_remarks.sender_user_id",$user->id)
                    ->where("active_saf_details.payment_status",1)
                    ->where("active_saf_details.current_role_id","<>",$role->id);

            $list = paginator($data,$request);
            return responseMsg(true,($role->role_name??"")." Outbox",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){dd($e);
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function postNextLevel(RequestPostNextLevel $request){
        try{
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first();
            if($request->roleId){
                $role = $this->_RoleTypeMstr->find($request->roleId);
            }
            $saf = ActiveSafDetail::find($request->id);
            if(!$saf){
                throw new CustomException("Data Not Find");
            }
            if(!$saf->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($saf->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }
            $forWardBackWordRole = $this->_CommonClass->getForwordBackwordRoll($user->ulb_id,$saf->workflow_id,$role->id);
            $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
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
            if($saf->current_role_id != $role->id && !$saf->is_btc){
                throw new CustomException("This Application Not Pending At You");
            }
            if($saf->is_btc && $saf->initiator_role_id != $role->id){
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
                $testWoke = $this->testWorks($saf->id,$request->roleId);
                $flag = $testWoke["is_work_complied"];
                $message = $testWoke["message"];
                if(!$flag){                    
                    throw new CustomException($message ? $message :"Some Work Is Pending");
                }
                else{
                    if($WfPermission->can_doc_upload){
                        $saf->is_doc_upload = true;
                        $saf->is_doc_upload = true;
                    }
                    if($WfPermission->can_doc_verify){
                        $saf->is_doc_verify = true;
                        $saf->doc_verify_date = Carbon::now();
                    }                    
                }
            }
            #============================
            $sms = "Application Forward To";
            if($request->status=="FORWARD"){
                #=========forward===============
                if(!$saf->is_btc){
                    $saf->current_role_id = $WfPermission->forward_role_id;
                    $saf->max_level_attempt = $saf->max_level_attempt< $WfPermission->serial_no ? $WfPermission->serial_no : $saf->max_level_attempt;
                    if($saf->skip_tc_level && $role->id==$saf->initiator_role_id){
                        #tc
                        $newWfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$WfPermission->forward_role_id)->first();
                        #ulb TC
                        $newWfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$newWfPermission->forward_role_id)->first();
                        $saf->skip_tc_level = false;
                        $saf->current_role_id = $newWfPermission->forward_role_id;
                    }
                    elseif($saf->skip_tc_level && $role->id==7){
                        // $newWfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$saf->initiator_role_id)->first();
                        $saf->current_role_id = $saf->initiator_role_id;
                    }
                }else{
                    $saf->is_btc = false;
                }
            }
            elseif($request->status=="BACKWARD"){
                #===========backward=========
                $sms = "Application Back To";
                if($WfPermission->backward_role_id==$saf->initiator_role_id){
                    $saf->is_btc = true;
                    $sms = "Application Back From";
                }else{
                    $saf->current_role_id = $WfPermission->backward_role_id;
                }
            } 
            $currentRole = $this->_RoleTypeMstr->find($saf->current_role_id);
            $sms .= " " .$currentRole->role_name??"";
            $lastLevel = $this->_LevelRemark->where("saf_detail_id",$saf->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_PropTransaction->where("saf_detail_id",$saf->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $saf->apply_date;
            }
            $levelData=[
                "saf_detail_id"=>$saf->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$saf->current_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData);
            
            $this->begin();
            if($request->status=="FORWARD"){
                if($WfPermission->can_sam_generate){
                    $objMemo = new GenerateMemoBll($saf->id,"SAM");
                    $objMemo->generateMemo();
                }
                if($WfPermission->can_fam_generate){
                    $objMemo = new GenerateMemoBll($saf->id,"FAM");
                    $objMemo->generateMemo();
                }
                
            }
            $saf->update();
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
            $saf = ActiveSafDetail::find($request->id);
            if(!$saf){
                throw new CustomException("Data Not Find");
            }
            

            $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
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
            $saf->is_btc = true;
            $currentRole = $this->_RoleTypeMstr->find($saf->current_role_id);
            $sms .= " " .$currentRole->role_name??"";
            $lastLevel = $this->_LevelRemark->where("saf_detail_id",$saf->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_PropTransaction->where("saf_detail_id",$saf->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $saf->apply_date;
            }
            $levelData=[
                "saf_detail_id"=>$saf->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$saf->initiator_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 
            $this->begin();
            $saf->update();
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
            if($request->roleId){
                $role = $this->_RoleTypeMstr->find($request->roleId);
            }
            $saf = ActiveSafDetail::find($request->id);
            if(!$saf){
                throw new CustomException("Data Not Find");
            }
            if(!$saf->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($saf->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }

            $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
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
            $currentRole = $this->_RoleTypeMstr->find($saf->current_role_id);
            $lastLevel = $this->_LevelRemark->where("saf_detail_id",$saf->id)->orderBy("id","desc")->first();
            $lastPayment = $this->_PropTransaction->where("saf_detail_id",$saf->id)->orderBy("id","desc")->first();
            $receiving_date = null;
            if($lastLevel){
                $receiving_date = $lastLevel->created_at;
            }elseif($lastPayment){
                $receiving_date = $lastPayment->created_at;
            }else{
                $receiving_date = $saf->apply_date;
            }
            $levelData=[
                "saf_detail_id"=>$saf->id,
                "sender_role_id"=>$role->id,
                "sender_user_id"=>$user->id,
                "sender_remarks"=>$request->remarks,
                "receiver_role_id"=>$saf->current_role_id,
                "receiving_date"=>$receiving_date,
                "verification_status"=>Config::get("PropertyConstant.ACTION_TYPE.".$request->status),
            ]; 
            $request->merge($levelData); 
            $this->begin();
            if($request->status=="APPROVED"){
                if($WfPermission->can_sam_generate){
                    $objMemo = new GenerateMemoBll($saf->id,"SAM");
                    $objMemo->generateMemo();
                }
                if($WfPermission->can_fam_generate){
                    $objMemo = new GenerateMemoBll($saf->id,"FAM");
                    $objMemo->generateMemo();
                }
                $saf = $this->_SafDetail->find($saf->id);
                // dd($saf);
                // dd(Carbon::now());
                $saf->saf_approved_date = Carbon::now();
                $saf->saf_approved_user_id = $user->id;
                $saf->save();
            }
            
            if($request->status=="REJECT"){
                dd("REJECT");
            }
            $id=$this->_LevelRemark->store($request);
            $this->commit();
            return responseMsg(true,"Saf Approved","");

        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function safListForAutoApprove (Request $request){
        try{
            $user = Auth()->user();
            if($user->getTable()!="users"){
                throw new CustomException("Another User Are Not Allow");
            }
            $data = $this->metaDataList()
                    ->where("active_saf_details.ulb_id",$user->ulb_id)
                    ->where("active_saf_details.is_btc",false)
                    ->where("active_saf_details.payment_status",1);
            if($request->key){
                $data->where(function($where)use($request){
                    $where->where("active_saf_details.saf_no","ILIKE","%".$request->key."%")
                    ->orWhere("active_saf_details.saf_no","ILIKE","%".$request->key."%")
                    ->orWhere("owners.owner_name","ILIKE","%".$request->key."%")
                    ->orWhere("owners.mobile_no","ILIKE","%".$request->key."%");

                });                
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId"=>[$request->wardId]]);
                }
                $data->whereIn("active_saf_details.ward_mstr_id",$request->wardId);
            }
            if($request->fromDate || $request->uptoDate){
                if($request->fromDate && $request->uptoDate){
                    $data->whereBetween("active_saf_details.apply_date",[Carbon::parse($request->fromDate)->format("Y-m-d"),Carbon::parse($request->uptoDate)->format("Y-m-d")]);
                }elseif($request->fromDate){
                    $data->where("active_saf_details.apply_date",Carbon::parse($request->fromDate)->format("Y-m-d"));
                }elseif($request->uptoDate){
                    $data->where("active_saf_details.apply_date",Carbon::parse($request->uptoDate)->format("Y-m-d"));
                }
            }

            
            $list = paginator($data,$request);
            $list["data"] = collect($list["data"])->map(function($item){   
                $item->appStatus = $this->getSafStatus($item->id);
                return $item;
            });
            return responseMsg(true,"Saf List",camelCase(remove_null($list)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function addAutoForwardAssistant(Request $request){
        try{
            $user = Auth::user();
            $rules =[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable().",id",
                "remarks"=>"required|min:10",
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
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $saf = $this->_ActiveSafDetail->find($request->id);
            if(!$saf){
                throw new CustomException("Data Not Find");
            }
            if(!$saf->payment_status){
                throw new CustomException("Please Make Payment First");
            }
            if($saf->payment_status!=1){
                throw new CustomException("Please Wait For Payment Clarence");
            }
            $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            if(!$this->testAllDocUpload($saf) && ($saf->current_role_id==$saf->initiator_role_id || $saf->skip_tc_level)){                
                throw new CustomException("All Mandatory Document Not Upload");
            }
            $allRoles = $this->_CommonClass->getWorkFlowAllRoles($saf->ulb_id, $workflowMater->id);
            $collection = collect($allRoles);

            // 1. Sort the hierarchy from Initiator to Finisher
            $ordered = collect();
            $current = $collection->where('is_initiator', true)->first();

            while ($current) {
                $ordered->push($current);
                $nextRoleId = $current['forward_role_id'];
                $current = $nextRoleId ? $collection->where('role_id', $nextRoleId)->first() : null;
            }
          
            $relativePath = "Uploads/SafAutoApproveLog";

            $imageName = $saf->id."_".Str::uuid().".".$request->document->getClientOriginalExtension();
            $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
            $request->merge(["docPath"=>$path,"safDetailId"=>$saf->id]);

            $this->begin();

            $this->_SafAutoApprovedLog->store($request);
            $maxIterations = 20; // Safety cap
            $count = 0;
            while (true) {
                
                $testSaf=$this->_ActiveSafDetail->find($request->id);
                
                if(!$testSaf){ // after approve data move on aprroved table
                    break;
                }
                $saf->refresh();
                $role = $ordered->where('role_id', $saf->current_role_id)->first();
                // print_var($role);
                if (!$role) {
                    break; 
                }
                if ($count++ > $maxIterations) {
                    throw new CustomException("Auto-forwarding limit reached. Potential workflow loop detected.");
                }
                
                if ($role["role_id"] != $saf->current_role_id) {
                    continue;
                }
                
                $data = [
                    "id" => $saf->id,
                    "remarks" => "Auto Approved",
                    "status" => "FORWARD",
                    "roleId"=>$role["role_id"],
                ];

                // Handle Document Verification logic if applicable
                if ($role["can_doc_verify"]) {
                    // Assuming you want to verify all unverified docs
                    $testUnverifiedDocList = $saf->getDocList()->where("verified_status", 0)->get();
                    foreach ($testUnverifiedDocList as $doc) {
                        $doc->verified_status = 1;
                        $doc->update();
                    }
                    $saf->is_doc_verify = true;
                    $saf->doc_verify_date = Carbon::now()->format("Y-m-d");
                    $saf->doc_verify_user_id = $user->id;
                    $saf->update();
                }
                $testVerification = $saf->getVerification()->where("verified_by","AGENCY TC")->orderBy("id","DESC")->first();
                $shortName = $this->_SystemConstant["USER-TYPE-SHORT-NAME"][strtoupper($role["role_name"])]??"";
                if(in_array($shortName,["UTC","AMN"])){
                    $testVerification = $saf->getVerification()->where("verified_by","ULB TC")->where("id",">",$testVerification->id)->orderBy("id","DESC")->first();
                } 
                // Handle Field Verification
                if($role["can_field_verify"] && !$testVerification){
                    $safFloor = $saf->getFloors();
                    $verificationData = camelCase($saf);
                    if(in_array($shortName,["UTC","AMN"])){
                        $tcData = $saf->getVerification()->where("verified_by","AGENCY TC")->orderBy("id","DESC")->first();
                        $safFloor = $tcData->getVerificationFloorDtl()->get();
                        $verificationData = camelCase($tcData);
                        // dd($safFloor,$tcData);
                    }
                    $verificationData["safDetailId"] = $saf->id;
                    $verificationData["newWardMstrId"] = null;
                    $verificationData["roleId"] = $role["role_id"];
                    if($safFloor ){
                        $floorVerification =[];
                        foreach($safFloor as $key=>$floor){
                            $floor = camelCase($floor);
                            if(!in_array($shortName,["UTC","AMN"])){
                                $floor["safFloorDetailId"]=$floor["id"]; 
                            }
                            $floor["dateFrom"]=$floor["dateFrom"] ? Carbon::parse($floor["dateFrom"])->format("Y-m") : null;
                            $floor["dateUpto"]=$floor["dateUpto"] ? Carbon::parse($floor["dateUpto"])->format("Y-m") : null;
                            $floorVerification[] = $floor->toArray();                            
                        }
                        $verificationData["floorDtl"]=$floorVerification;
                    }
                    $verificationData = $verificationData->toArray();
                    // dd($verificationData);
                    $verificationRequest = RequestFieldVerification::createFrom($request); 
                    $verificationRequest->replace($verificationData);
                    $verificationRequest->setContainer(app())->setRedirector(app()->make('redirect'));
                    if (method_exists($verificationRequest, 'validateResolved')) {
                        $verificationRequest->validateResolved();
                    }
                    $response = $this->fieldVerification($verificationRequest);
                    $resData = $response->getData(true); 
                    if (!$resData['status']) {
                        throw new CustomException($resData['message'] ?? "Forwarding failed at " . $role['role_name']);
                    }
                }

                // Handle Post Next
                $formRequest = RequestPostNextLevel::createFrom($request); 
                $formRequest->replace($data);
                $formRequest->setContainer(app())->setRedirector(app()->make('redirect'));
                if (method_exists($formRequest, 'validateResolved')) {
                    $formRequest->validateResolved();
                }
                $response = $this->postNextLevel($formRequest);
                $resData = $response->getData(true);
                // print_var($resData); 
                if (!$resData['status']) {
                    throw new CustomException($resData['message'] ?? "Forwarding failed at " . $role['role_name']);
                }
            }
            // dd($ordered);
            $this->commit();
            return responseMsg(true,"Saf Approved","");

        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            dd($e);
            $this->rollBack();
            return responseMsg(false,"Internal Server Error",$e);
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
            $saf = $this->_ActiveSafDetail->find($request->id);
            if(!$saf){
                $saf = $this->_SafDetail->find($request->id);
            }
            if(!$saf){
                $saf = RejectedSafDetail::find($request->id);
            }
            if(!$saf){
                throw new CustomException("Data Not Found");
            }
            $docList= $this->getRequiredDocList($saf);
            return responseMsg(true,"Saf Required Doc List",camelCase(remove_null($docList)));
            
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
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable(),
                "ownerId"=>"nullable|digits_between:1,9223372036854775807",
                "docCode"=>"required",
                "docName"=>"required",
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

                ]
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $saf = $this->_ActiveSafDetail->find($request->id);
            $requiredDocList = $this->getDocList($request);
            $requiredDocList = $requiredDocList->original["data"];
            $appDocCode = collect($requiredDocList["appDoc"])->pluck("docCode");
            $ownerDoc = collect($requiredDocList["ownerDoc"]);
            $ownerDocCode = collect();
            $doc_type_id = null;

            $role = $user->getRoleDetailsByUserId()->first();
            $workflowMater = $this->_WorkflowMaster->find($saf->workflow_id);
            if(!$workflowMater){
                throw new CustomException("Invalid Workflow Assign");
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role->id)->first();
            if((!$WfPermission)){
                throw new CustomException("You Have No Any Permission On This WorkFlow");
            }
            if($user->getTable()=="users" && (!$WfPermission->has_full_permission && !$WfPermission->can_doc_upload)){
                throw new CustomException("You do not have permission to edit");
            }

            $canDocUpload = $saf->is_btc || ($saf->current_role_id == $saf->initiator_role_id) || $saf->skip_tc_level;
            if(!$canDocUpload){
                throw new CustomException("Currently Not Update Doc"); 
            }
            
            $relativePath = "Uploads/SafDoc";
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
            $oldDoc = $saf->getDocList()
                    ->where("doc_type_id",$doc_type_id)
                    ->where("saf_owner_detail_id",$request->ownerId)
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

                $imageName = $saf->id."_".$request->docCode.".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $request->merge(["docPath"=>$path]);
                       
                $oldDoc->doc_name = $request->docName;          
                $oldDoc->doc_path = $request->docPath;
                $oldDoc->user_id = $user->id;
                $oldDoc->update();
                $sms ="Document Updated";
            }else{
                $imageName = $saf->id."_".$request->docCode.".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $request->merge(["docPath"=>$path]);

                $this->_SafDocDetail->saf_detail_id = $saf->id;                
                $this->_SafDocDetail->saf_owner_detail_id = $request->ownerId;             
                $this->_SafDocDetail->doc_type_id = $doc_type_id;          
                $this->_SafDocDetail->doc_name = $request->docName;          
                $this->_SafDocDetail->doc_path = $request->docPath;
                $this->_SafDocDetail->user_id = $user->id;
                $this->_SafDocDetail->save();
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
            $saf = $this->_ActiveSafDetail->find($request->id);
            if(!$saf){
                $saf = $this->_SafDetail->find($request->id);
            }
            if(!$saf){
                $saf = RejectedSafDetail::find($request->id);
            }
            if(!$saf){
                throw new CustomException("Data Not Found");
            }
            $owner = $saf->getOwners();
            $docList = $saf->getDocList()->get();
            $docList = $docList->map(function($val)use($owner){
                $verifyUser = User::find($val->verified_by_user_id);
                $uploadedUser = User::find($val->user_id);
                $docMaster = DocTypeMaster::find($val->doc_type_id);
                $val->docCode =$docMaster ? Str::title(implode(" ",explode("_",$docMaster->doc_type))) : "";
                $cOwner = $owner->where("id",$val->saf_owner_detail_id)->first();
                $val->owner_name = $cOwner ? $cOwner->owner_name : "";
                $val->doc_path = $val->doc_path ? url("/documents")."/".$val->doc_path:"";
                $val->uploaded_by = $uploadedUser ? $uploadedUser->name : "";
                $val->verify_by = $verifyUser ? $verifyUser->name : "";
                return $val;
            });
            return responseMsg(true,"Saf Doc List",camelCase(remove_null($docList)));
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
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_SafDocDetail->getConnectionName().".".$this->_SafDocDetail->getTable().",id",
                "verificationStatus"=>"required|in:VERIFY,REJECT",
                "remarks"=>"required_if:verificationStatus,REJECT",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $doc = $this->_SafDocDetail->find($request->id);
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

    public function uploadGeoTag(Request $request){
        try{
            $rules=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable().",id",
                "geoTag"=>"required|array|min:3",
                "geoTag.*.direction"=>"required|in:right side,left side,front side,Water Harvesting",
                "geoTag.*.document"=>"required|mimes:bmp,jpeg,jpg,png",
                "geoTag.*.latitude"=>"required",
                "geoTag.*.longitude"=>"required"
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $user = Auth()->user();
            $saf = $this->_ActiveSafDetail->find($request->id);
            $relativePath = "Uploads/GeoTag";

            $this->begin();

            foreach($request->geoTag as $val){ 
                $oldDoc = $this->_GeotagDetail->where("saf_detail_id",$request->id)->where("direction_type",$val["direction"])->where("lock_status",false)->first();
                if($oldDoc){
                    // $filePath = public_path($oldDoc->image_path);
                    // if (file_exists($filePath)) {
                    //     // Delete the file
                    //     @unlink($filePath);
                    // }

                    if (!empty($oldDoc->image_path) && Storage::disk($this->disk)->exists($oldDoc->image_path)) {
                        Storage::disk($this->disk)->delete($oldDoc->image_path);
                    }
    
                    $imageName = $request->id."_".$val["direction"].".".$val["document"]->getClientOriginalExtension();
                    // $val["document"]->move($relativePath, $imageName);
                    $path = $val["document"]->storeAs($relativePath,$imageName, $this->disk);
                    $request->merge(["docPath"=>$path]);
                           
                    $oldDoc->direction_type = $val["direction"];          
                    $oldDoc->image_path = $request->docPath;
                    $oldDoc->latitude = $val["latitude"]; 
                    $oldDoc->longitude = $val["longitude"]; 
                    $oldDoc->user_id = $user->id;
                    $oldDoc->update();
                    $sms ="Document Updated";
                }else{
                    $imageName =  $request->id."_".$val["direction"].".".$val["document"]->getClientOriginalExtension();
                    // $val["document"]->move($relativePath, $imageName);
                    $path = $val["document"]->storeAs($relativePath,$imageName, $this->disk);
                    $request->merge(["docPath"=>$path]);  
                    $doc = new GeotagDetail();
                    $doc->saf_detail_id = $request->id;             
                    $doc->direction_type = $val["direction"];          
                    $doc->image_path = $request->docPath;
                    $doc->latitude = $val["latitude"]; 
                    $doc->longitude = $val["longitude"]; 

                    $doc->user_id = $user->id;
                    $doc->save();
                }
            }

            $this->commit();
            return responseMsg(true,"Geo tag Don","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function getSafForVerification(Request $request ){
        try{
            $user = Auth()->user();
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            
            $role = $user->getRoleDetailsByUserId()->first();
            $saf = $this->_ActiveSafDetail->find($request->id);
            $saf = $this->adjustSafValue($saf);
            $saf->floor = $this->adjustFloorValue($saf->getFloors())->map(function($item){
                $item->date_from = $item->date_from ? Carbon::parse($item->date_from)->format("Y-m"):null;
                $item->date_upto = $item->date_upto ? Carbon::parse($item->date_upto)->format("Y-m"):null;
                return $item;
            });

            if($role->id==7){
                $tcVerifiedData = $saf->getVerification()->where("verified_by","AGENCY TC")->orderBy("id","DESC")->first();
                if($tcVerifiedData){
                    $verifiedFloor = $this->adjustFloorValue($tcVerifiedData->getVerificationFloorDtl()->get());
                    $saf->floor=collect($saf->floor)->map(function($floor) use($verifiedFloor){
                        $floor->tcVerifiedData = collect($verifiedFloor)->where("saf_floor_detail_id",$floor->id)->first();
                        if($floor->tcVerifiedData){
                            $floor->tcVerifiedData->date_from = $floor->tcVerifiedData->date_from ? Carbon::parse($floor->tcVerifiedData->date_from)->format("Y-m"):null;
                            $floor->tcVerifiedData->date_upto = $floor->tcVerifiedData->date_upto ? Carbon::parse($floor->tcVerifiedData->date_upto)->format("Y-m"):null;
                        }
                        return $floor;
                    });
                    $saf->extraFloorAdded = collect($verifiedFloor)->whereNotIn("saf_floor_detail_id",collect($saf->floor)->pluck("id")->unique())->map(function($item){
                        $item->v_id = $item->id;
                        $item->id = null;
                        $item->date_from = $item->date_from ? Carbon::parse($item->date_from)->format("Y-m"):null;
                        $item->date_upto = $item->date_upto ? Carbon::parse($item->date_upto)->format("Y-m"):null;
                        return $item;
                    });
                }
                $saf->tcVerifiedData = $this->adjustSafValue($tcVerifiedData);                
            }
            return responseMsgs(true,"Data Fetched",camelCase($saf));
        }catch(CustomException $e){
            return responseMsgs(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsgs(false,"Server Error","");
        }
    }

    public function fieldVerification(RequestFieldVerification $request){
        try{
            $user = Auth()->user();
            $role = $user->getRoleDetailsByUserId()->first(); 
            if($request->roleId){
                $role = $this->_RoleTypeMstr->find($request->roleId);
            }          
            $saf = $this->_ActiveSafDetail->find($request->safDetailId);
            $shortName = $this->_SystemConstant["USER-TYPE-SHORT-NAME"][strtoupper($role->role_name)]??"";
            if($shortName=="TC"){
                $request->merge(["verified_by"=>"AGENCY TC"]);
                $saf->is_field_verify =true;
                $saf->field_verify_date =Carbon::now();
                $saf->field_verify_user_id =$user->id;
            }
            if(in_array($shortName,["UTC","AMN"])){
                $request->merge(["verified_by"=>"ULB TC"]);
                $saf->is_utc_field_verify =true;
                $saf->utc_field_verify_date =Carbon::now();
                $saf->utc_field_verify_user_id =$user->id;
            }
            $request->merge(["user_id"=>$user->id]);
            $this->begin();
            $verificationId = $this->_FieldVerificationDetail->store($request);
            if($request->floorDtl){
                foreach($request->floorDtl as $floor){
                    $newRequest = new Request($floor);
                    $newRequest->merge(["dateFrom"=>$newRequest->dateFrom."-01"]);
                    if($newRequest->dateUpto){
                        $newRequest->merge(["dateUpto"=>$newRequest->dateUpto."-01"]);
                    }
                    $newRequest->merge(["safDetailId"=>$request->safDetailId]);
                    $newRequest->merge(["field_verification_id"=>$verificationId]);
                    $this->_FieldVerificationFloorDetail->store($newRequest);
                }
            }
            $saf->update();
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
            $verificationDtl = $this->_FieldVerificationDetail->find($request->id);
            if(!$verificationDtl){
                throw new CustomException("Data Not Found");
            }
            $saf = $this->_ActiveSafDetail->find($verificationDtl->saf_detail_id);
            if(!$saf){
                $saf = $this->_SafDetail->find($verificationDtl->saf_detail_id);
            }if(!$saf){
                $saf = RejectedSafDetail::find($request->id);
            }
            if(!$saf){
                throw new CustomException("Data Not Found");
            }
            $verificationDtl = $this->adjustSafValue($verificationDtl);
            $saf = $this->adjustSafValue($saf);
            $user = User::find($verificationDtl->user_id);
            $getGeoTag = $saf->getGeoTag()->get()->map(function($item){
                $item->image_path = $item->image_path?(url("/documents")."/".$item->image_path):$item->image_path;
                return $item;
            });
            $owner = $saf->getOwners();
            $safFloor = $this->adjustFloorValue($saf->getFloors());
            $verifiedFloor = $this->adjustFloorValue($verificationDtl->getVerificationFloorDtl()->get());
            
            $safComp = [
                [
                    "key"=>"Ward No",
                    "self"=>$saf->ward_no,
                    "verify"=>$verificationDtl->ward_no??"",
                    "test"=>$saf->ward_mstr_id==($verificationDtl->ward_mstr_id??false),
                ],
                [
                    "key"=>"New Ward No",
                    "self"=>$saf->new_ward_no,
                    "verify"=>$verificationDtl->new_ward_no??"",
                    "test"=>$saf->new_ward_mstr_id==($verificationDtl->new_ward_mstr_id??false),
                ],
                [
                    "key"=>"Property Type",
                    "self"=>$saf->property_type,
                    "verify"=>$verificationDtl->property_type??"",
                    "test"=>$saf->prop_type_mstr_id==($verificationDtl->prop_type_mstr_id??false),
                ],
                [
                    "key"=>"Area of Plot",
                    "self"=>$saf->area_of_plot,
                    "verify"=>$verificationDtl->area_of_plot??"",
                    "test"=>$saf->area_of_plot==($verificationDtl->area_of_plot??false),
                ],
                [
                    "key"=>"Road",
                    "self"=>$saf->road_width,
                    "verify"=>$verificationDtl->road_width??"",
                    "test"=>$saf->road_width==($verificationDtl->road_width??false),
                ],
                [
                    "key"=>"No. of floors",
                    "self"=>"N/A",
                    "verify"=>"N/A",
                    "test"=>null,
                ],
                [
                    "key"=>"Mobile Tower(s) ?",
                    "self"=>$saf->is_mobile_tower?"Yes":"No",
                    "verify"=>$verificationDtl->is_mobile_tower?"Yes":"No",
                    "test"=>$saf->is_mobile_tower==($verificationDtl->is_mobile_tower??false),
                ],
                [
                    "key"=>"Hoarding Board(s) ?",
                    "self"=>$saf->is_hoarding_board?"Yes":"No",
                    "verify"=>$verificationDtl->is_hoarding_board?"Yes":"No",
                    "test"=>$saf->is_hoarding_board==($verificationDtl->is_hoarding_board??false),
                ],
                [
                    "key"=>"Is Petrol Pump ?",
                    "self"=>$saf->is_petrol_pump?"Yes":"No",
                    "verify"=>$verificationDtl->is_petrol_pump?"Yes":"No",
                    "test"=>$saf->is_petrol_pump==($verificationDtl->is_petrol_pump??false),
                ],
                [
                    "key"=>"Water Harvesting Provision ?",
                    "self"=>$saf->is_water_harvesting?"Yes":"No",
                    "verify"=>$verificationDtl->is_water_harvesting?"Yes":"No",
                    "test"=>$saf->is_water_harvesting==($verificationDtl->is_water_harvesting??false),
                ],
            ];
            $floorCom = $safFloor->map(function($item)use($verifiedFloor){
                $verification = $verifiedFloor->where("saf_floor_detail_id",$item->id)->first();
                return[
                    "floorName"=>$item->floor_name,
                    "usage_type"=>[
                            "self"=>$item->usage_type,
                            "verify"=>$verification->usage_type??"",
                            "test"=>$item->usage_type_master_id==($verification->usage_type_master_id??false),
                        ],
                    "occupancy_name"=>[
                            "self"=>$item->occupancy_name,
                            "verify"=>$verification->occupancy_name??"",
                            "test"=>$item->occupancy_type_master_id==($verification->occupancy_type_master_id??false),
                        ],
                    "construction_type"=>[
                            "self"=>$item->construction_type,
                            "verify"=>$verification->construction_type??"",
                            "test"=>$item->construction_type_master_id==($verification->construction_type_master_id??false),
                        ],
                    "builtup_area"=>[
                            "self"=>$item->builtup_area,
                            "verify"=>$verification->builtup_area??"",
                            "test"=>$item->builtup_area==($verification->builtup_area??false),
                        ],
                    "carpet_area"=>[
                            "self"=>$item->carpet_area,
                            "verify"=>$verification->carpet_area??"",
                            "test"=>$item->carpet_area==($verification->carpet_area??false),
                        ],
                    "date_from"=>[
                            "self"=>$item->date_from,
                            "verify"=>$verification->date_from??"",
                            "test"=>$item->date_from==($verification->date_from??false),
                        ],
                    "date_upto"=>[
                            "self"=>$item->date_upto,
                            "verify"=>$verification->date_upto??"",
                            "test"=>$item->date_upto==($verification->date_upto??false),
                        ],
                ];
            });
            $extraFloor = $verifiedFloor->whereNotIn("saf_floor_detail_id",$safFloor->pluck("id"));
            $response = [
                "tcDtl"=>[
                    "user_name"=>$user->name??"",
                    "verified_by"=>$verificationDtl->verified_by??"",
                    "verification_date"=>Carbon::parse($verificationDtl->created_at)->format("Y-m-d H:i:s:v"),
                ],
                "safDtl"=>[
                    "saf_no"=>$saf->saf_no,
                    "apply_date"=>$saf->apply_date,
                    "assessment_type"=>$saf->assessment_type,
                    "property_transfer"=>$saf->percentage_of_property_transfer,
                    "ward_no"=>$saf->ward_no,
                    "new_ward_no"=>$saf->new_ward_no,
                    "holding_no"=>$saf->holding_no,
                    "ownership_type"=>$saf->ownership_type,
                ],
                "ownerDtl"=>$owner,
                "safComp"=>$safComp,
                "floorCom"=>$floorCom,
                "extraFloor"=>$extraFloor,
                "getGeoTag"=>$getGeoTag
            ];

            return responseMsgs(true,"Verification Dtl",camelCase($response));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsgs(false,"Server Error!!","");
        }
    }

    public function memoReceipt(Request $request){
        try{
            $proTran = new MemoDetail();
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$proTran->getConnectionName().".".$proTran->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new MemoReceiptBll($request->id); 
            $receiptBll->generateReceipt();
            return responseMsg(true,"Payment Receipt",camelCase(remove_null($receiptBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function validateSafNo(Request $request){
        try{
            $rules =[
                "safNo"=>"required|string|exists:".$this->_ActiveSafDetail->getConnectionName().".".$this->_ActiveSafDetail->getTable().",saf_no,lock_status,false",             
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }           
            
            $property = $this->_ActiveSafDetail->where("saf_no",$request->safNo)->where("lock_status",false)->first(); 
            $this->adjustSafValue($property);
            $owners = $property->getOwners(); 
            $property = $property->only(["id","ulb_id","assessment_type","holding_type","holding_no","saf_no",
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

    public function citizenSaf(Request $request){
        try{
            $user = Auth::user();
            $activeSaf=$this->_ActiveSafDetail->select("id","saf_no","apply_date","ulb_id","assessment_type",DB::raw("'pending' as app_type, saf_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $approvedSaf=$this->_SafDetail->select("id","saf_no","apply_date","ulb_id","assessment_type",DB::raw("'approved' as app_type, saf_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $rejectedSaf=$this->_RejectedSafDetail->select("id","saf_no","apply_date","ulb_id","assessment_type",DB::raw("'rejected' as app_type, saf_no as app_no"))
                    ->where("lock_status",false)
                    ->where("citizen_id",$user->id)
                    ->get();
            $saf = $activeSaf->merge($rejectedSaf)->merge($approvedSaf)->map(function($item){
                $item->appStatus = $this->getSafStatus($item->id);
                $item->ulbName = $this->_UlbMaster->find($item->ulb_id)->ulb_name??"";
                $item->lastTran = $item->getLastTran();
                $safDemandBLL = new SafDemandBll($item->id);
                $safDemandBLL->getSafDue();
                $item->bueAmount = $safDemandBLL->_GRID["payableAmount"]??0;
                return $item;
            });
            return responseMsg(true,"saf",remove_null(camelCase($saf)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

}
