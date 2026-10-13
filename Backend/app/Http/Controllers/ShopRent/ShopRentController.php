<?php

namespace App\Http\Controllers\ShopRent;

use App\BLL\ShopRent\ShopDemandGenerateBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\ShopRent\AddShopRentRequest;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\PropertyDetail;
use App\Models\ShopRent\AreaMaster;
use App\Models\ShopRent\ParamModel;
use App\Models\ShopRent\SamitiMaster;
use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopOwner;
use App\Models\ShopRent\ShopRent;
use App\Models\ShopRent\ShopTypeMaster;
use App\Models\ShopRent\YojnaMaster;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ShopRentController extends Controller
{

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

    // private $_ConsumerWastCollectionLog;
    // private $_ConsumerDeactivation;
    // private $_ConsumerConnection;
    // private $_ConnectionDetail;

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

        // $this->_ConsumerTransaction = new ConsumerTransaction();
        // $this->_ConsumerWastCollectionLog = new ConsumerWastCollectionLog();
        // $this->_ConsumerDeactivation = new ConsumerDeactivation();
        // $this->_ConsumerConnection = new ConsumerConnection();
        // $this->_ConnectionDetail = new ConnectionDetail();

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
            $consumerNo = $shop->consumer_no??"";dd($_REQUEST);
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
}
