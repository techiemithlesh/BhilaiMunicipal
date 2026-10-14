<?php

namespace App\Http\Controllers\ShopRent;

use App\BLL\ShopRent\ShopDemandGenerateBll;
use App\Bll\ShopRent\ShopDueBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\ShopRent\AddShopRentRequest;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\ShopRent\AreaMaster;
use App\Models\ShopRent\ParamModel;
use App\Models\ShopRent\SamitiMaster;
use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopDemand;
use App\Models\ShopRent\ShopOwner;
use App\Models\ShopRent\ShopRent;
use App\Models\ShopRent\ShopTypeMaster;
use App\Models\ShopRent\YojnaMaster;
use App\Trait\ShopRent\ShopTrait;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ShopRentController extends Controller
{
    use ShopTrait;

    private $_MODULE_ID;
    private $_Conn;
    private $_UlbWardMaster;
    private $_PropertyDetail;
    private $_AreaMaster;
    private $_SamitiMaster;
    private $_ShopTypeMaster;
    private $_YojnaMaster;
    private $_Shop;
    private $_ShopOwner;
    private $_ShopRent;
    private $_ShopDemand;

    function __construct()
    {
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();
        $this->_UlbWardMaster = new UlbWardMaster();

        $this->_PropertyDetail = new PropertyDetail();

        $this->_AreaMaster = new AreaMaster();
        $this->_SamitiMaster = new SamitiMaster();
        $this->_ShopTypeMaster = new ShopTypeMaster();  
        $this->_YojnaMaster = new YojnaMaster();
        $this->_Shop = new Shop();
        $this->_ShopOwner = new ShopOwner();
        $this->_ShopRent = new ShopRent();
        $this->_ShopDemand = new ShopDemand();

        $this->_MODULE_ID = Config::get("SystemConstant.MODULE.SHOP");
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
    
    public function getShopRentMasterData(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $request->ulbId ? $request->ulbId : ($user->ulb_id??0);

            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            $areaTypeMaster = $this->_AreaMaster->getAreaList()->filter(fn($value, $key) => $value->ulb_id==$ulbId);
            $samitiMaster = $this->_SamitiMaster->getSamitiList()->filter(fn($value, $key) => $value->ulb_id==$ulbId);
            $shopTypeMaster = $this->_ShopTypeMaster->getShopTypeList()->filter(fn($value, $key) => $value->ulb_id==$ulbId);
            $yojnaMaster = $this->_YojnaMaster->getYojnaList()->filter(fn($value, $key) => $value->ulb_id==$ulbId);


            $data=[
                "wardList"=>$ulbWardMaster,
                "areaType"=>$areaTypeMaster,
                "samiti"=>$samitiMaster,
                "shopType"=>$shopTypeMaster,
                "yojna"=>$yojnaMaster,
            ];
            return responseMsg(true,"Shop Rent Master Data",camelCase(remove_null($data)));
        }
        catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function addShopRent(AddShopRentRequest $request){
        try{
            $user = Auth()->user(); 
            $additionData = [
                "allotmentDate"=>Carbon::now()->format("Y-m-d"),
            ]; 
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

            $shopId = $this->_Shop->store($request);
            foreach($request->ownerDtl as $owner){
                $newOwnerRequest = new Request($owner);
                $newOwnerRequest->merge(["shopId"=>$shopId]);
                $this->_ShopOwner->store($newOwnerRequest);
            }
            $connectionArr = [
                "shopId"=>$shopId,
                "monthlyRate"=>$request->monthlyRate,
                // "isPenaltyAdd"=>$request->isPenaltyAdd,
                // "penaltyAmount"=>$request->penaltyAmount,
                "effectiveDate"=>$request->effectiveDate."-01",
                "userId"=>$request->userId,
            ];

            if($request->document){
                $relativePath = "Uploads/ShopRentRate";
                $imageName = $shopId."_Existing".".".$request->document->getClientOriginalExtension();
                // $request->document->move($relativePath, $imageName);
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $connectionArr["docPath"] = $path;
            }
            
            $connectionRequest = new Request($connectionArr);
            $rateId = $this->_ShopRent->store($connectionRequest);

            list($curentFyearFromDate,$curentFyearLastDate) = FyearFromUptoDate(getFy());
            $request->merge(["id"=>$shopId,"currentDate"=>$curentFyearLastDate]);
            $objDemandBll = new ShopDemandGenerateBll($request);
            $objDemandBll->generateDemand();
            
            $shop = $this->_Shop->find($shopId);
            $consumerNo = $shop->consumer_no??"";
            $this->commit();
            return responseMsg(true,"Application Submitted ",remove_null(camelCase(["shopId"=>$shopId,"consumerNo"=>$consumerNo])));
            
        }
        catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }   
    
    public function searchShop(Request $request){
        try{
            $shop = $this->_Shop->readConnection()->select(
                "shops.id",  
                "shops.consumer_no",
                "shops.shop_no",
                "shops.reg_no",
                "shops.holding_no",
                "shops.address",
                "shops.pin_code",
                "shops.apply_date",
                "shops.allotment_date",
                "wm.ward_no",
                "yo.yojna_name",
                "am.area_name",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
            )
            ->join(DB::raw("(
                SELECT shop_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM shop_owners
                WHERE lock_status = false
                GROUP BY shop_id
            ) AS w"), "w.shop_id", "=", "shops.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "shops.ward_mstr_id")
            ->leftJoin("yojna_masters AS yo","yo.id","=","shops.yojna_id")
            ->leftJoin("area_masters AS am","am.id","=","shops.area_id")
            ->where("shops.lock_status", false);

            if($request->keyWord){
                $shop->where(function($where)use($request){
                    $where->where("shops.consumer_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("shops.shop_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("shops.holding_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $shop->whereIn("wm.id",$request->wardId);
            }
            $list = $shop;
            $data = paginator($list,$request);
            return responseMsg(true,"Shop Fetched",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function shopDtl(Request $request){
        try{
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $shop = $this->_Shop->find($request->id);            
            if(!$shop){
                throw new CustomException("Property Not Found");
            }
            $this->adjustShopValue($shop);

            $shop->owners = $shop->getOwners();
            $shop->tran_dtls = $shop->getTrans();
            $shop->shop_rents = $shop->getAllRent()->each(fn($item,$index)=>$item->is_current = $shop->current_rate_id==$item->id);

            $user = Auth()->user();
            if($user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                $shop->UserPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();             
            }
            return responseMsg(true,"Shop Detail",camelCase(remove_null($shop)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function generateDemand(Request $request)
    {
        try {
            $rules = [
                "id" => "required|digits_between:1,9223372036854775807|exists:".$this->_Shop->getConnectionName().".".$this->_Shop->getTable().",id,lock_status,false",             
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
            
            $objDemandBll = new ShopDemandGenerateBll($request);
            $objDemandBll->generateDemand();
            $this->commit();

            return responseMsg(true, "Demand Generated", "");
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
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Shop->getConnectionName().".".$this->_Shop->getTable().",id"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $allDemand = $this->_ShopDemand->readConnection()
                    ->where("shop_id",$request->id)
                    ->where("lock_status",false)
                    ->orderBy("demand_from","DESC"); 
            $summaryOrm = clone $allDemand;
            $summary = $summaryOrm->get();
            $data = paginator($allDemand,$request);
            $data["summary"]=[
                "totalDue"=>$summary->sum("balance"),
            ];
            return responseMsg(true,"Shop Demand History",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }
    
    public function shopDue(Request $request){
        try{
            list($from,$upto) = FyearFromUptoDate(getFy());
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Shop->getConnectionName().".".$this->_Shop->getTable().",id,lock_status,false",
                "demandUpto"=>"nullable|date|date_format:Y-m-d|before_or_equal:".$upto,
            ];
            
            $validator = Validator::make($request->all(), $rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $currentDate = Carbon::now()->format("Y-m-d");
            $demandUpto = Carbon::parse($request->demandUpto??$upto)->endOfMonth()->format("Y-m-d");
            $objConsumerDueBll = new ShopDueBll($request->id,$currentDate,$demandUpto);
            $objConsumerDueBll->getConsumerDue();
            return responseMsg(true,"Consumer Due",camelCase(remove_null($objConsumerDueBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    // public function offlinePayment(Request $request){
    //     try{
    //         list($from,$upto) = FyearFromUptoDate(getFy());
    //         $rule=[
    //             "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Shop->getConnectionName().".".$this->_Shop->getTable().",id,lock_status,false",
    //             "demandUpto"=>"nullable|date|date_format:Y-m-d|before_or_equal:".$upto,
    //             "paymentType"=>"required|in:FULL,PART",
    //             "paymentMode" => "required|in:ONLINE,CASH,CHEQUE,DD,NEFT,RTGS",
    //             "amount"=>"nullable|required_if:paymentType,==,PART|numeric|min:0",
    //             "chequeNo"=>"required_unless:paymentMode,ONLINE,CASH",
    //             "chequeDate"=>"required_unless:paymentMode,ONLINE,CASH",                
    //             "bankName"=>"required_unless:paymentMode,ONLINE,CASH",
    //             "branchName"=>"required_unless:paymentMode,ONLINE,CASH",
    //         ];
    //         $validator = Validator::make($request->all(),$rule);
    //         if($validator->fails()){
    //             return validationError($validator);
    //         }
    //         $currentDate = Carbon::now()->format("Y-m-d");
    //         $demandUpto = Carbon::parse($request->demandUpto??$upto)->endOfMonth()->format("Y-m-d");

    //         $objConsumerDueBll = new ShopDueBll($request->id,$currentDate,$demandUpto);
    //         $objConsumerDueBll->getConsumerDue();
    //         $demandPayableAmount = $objConsumerDueBll->_GRID["payableAmount"];
    //         if($demandPayableAmount <=0){
    //             throw new CustomException("All Demand Are Clear");
    //         } 
    //         $applicationPaymentBll = new ConsumerPaymentBll($request);

    //         $this->begin();           
    //         $responseData = ($applicationPaymentBll->payNow());
    //         $tran = ConsumerTransaction::find($responseData["tranId"]);
    //         $coll = ConsumerDemandsCollection::where("transaction_id",$responseData["tranId"])->get();
    //         $this->commit();
    //         return responseMsg(true,"Payment Successfully Done",$responseData);
    //     }catch(CustomException $e){
    //         $this->rollBack();
    //         return responseMsg(false,$e->getMessage(),"");
    //     }
    //     catch(Exception $e){
    //         $this->rollBack();
    //         return responseMsg(false,"Internal Server Error","");
    //     }
    // }

}
