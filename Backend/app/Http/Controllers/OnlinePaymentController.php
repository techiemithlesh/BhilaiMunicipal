<?php

namespace App\Http\Controllers;

use App\Bll\Payment\NttData;
use App\Http\Controllers\Property\PropertyController;
use App\Models\DBSystem\OnlinePaymentRequest;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OnlinePaymentController extends Controller
{
    //

    private $_OnlinePaymentRequest;
    private $_ObjNttData;
    private $_SYSTEM_CONST;
    private $_PropertyController;

    public function __construct()
    {
        $this->_OnlinePaymentRequest = new OnlinePaymentRequest();
        $this->_ObjNttData = new NttData();
        $this->_SYSTEM_CONST = Config::get("SystemConstant");

        $this->_PropertyController = new PropertyController();

    }

    public function NttDataCallback(Request $request)
    {
        try{
            $data = $request->encData;
            $decData = $this->_ObjNttData->decryptResponse($data);
            $jsonData = json_decode($decData, true);
            $merchTxnId = $jsonData["payInstrument"]["merchDetails"]["merchTxnId"]??"";
            $fileName = "payment_responses/response_" . $merchTxnId . "_" . time() . ".json";
            Storage::disk('local')->put($fileName, json_encode($jsonData, JSON_PRETTY_PRINT));
            $onlineRequestData = $this->_OnlinePaymentRequest
                            ->where("gateway_type",$this->_ObjNttData->_GatewayType)
                            ->where("order_id",$merchTxnId)
                            ->first();
            $updateDataRequest = new Request();
            $isSuccess = $jsonData['payInstrument']['responseDetails']['statusCode'] == 'OTS0000';
            $updateDataRequest->merge([
            "id"=>$onlineRequestData->id,
            "status"=>$isSuccess?"SUCCESS":"FAILED",
            "response"=>json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            "response_hash_value"=>$request->encData,
            ]);
            $this->_OnlinePaymentRequest->edit($updateDataRequest);
            $collectionRequest = json_decode($onlineRequestData->request_data,true);
            $collectionRequest = array_merge($collectionRequest,
            [
            "status"=>$isSuccess?"SUCCESS":"FAILED",
            "amount"=>$jsonData['payInstrument']['payDetails']["amount"],
            "orderId"=>$merchTxnId,
            "response"=>json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            "response_hash_value"=>$request->encData,
            ]);             
            $collectionRequest = new Request($collectionRequest);
    
            if($isSuccess){
    
                switch($onlineRequestData->module_id){
                    case $this->_SYSTEM_CONST["MODULE"]["PROPERTY"] : 
                        $response = $this->_PropertyController->propOnlineNttDataHandelPayment($collectionRequest);
                        break;
                    case $this->_SYSTEM_CONST["MODULE"]["WATER"] : dd("water");
                                                                        break;
                    case $this->_SYSTEM_CONST["MODULE"]["TRADE"] : dd("trade");
                                                                        break;
                }
                $updateDataRequest->merge(["module_response"=>json_encode($response->original,JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
                $this->_OnlinePaymentRequest->edit($updateDataRequest);
                
            }
            return responseMsg(true, "Data Received Successfully", []);
        }catch (Exception $e) {
            return responseMsg(false,$e->getMessage(),"",400);
        }
    }

    public function NttDataHandelResponse(Request $request){
        $data = $request->encData;
        $decData = $this->_ObjNttData->decryptResponse($data);
        $jsonData = json_decode($decData, true);
        $merchTxnId = $jsonData["payInstrument"]["merchDetails"]["merchTxnId"]??"";
        #SUCCESS
        $onlineRequestData = $this->_OnlinePaymentRequest
                        ->where("gateway_type",$this->_ObjNttData->_GatewayType)
                        ->where("order_id",$merchTxnId)
                        ->first();
        $isSuccess = $jsonData['payInstrument']['responseDetails']['statusCode'] == 'OTS0000';
        

        if($isSuccess){
            $responseData=[
                "UniqueRefNumber"=>$merchTxnId,
                "PaymentMode"=>"",
                "callBack"=>$onlineRequestData->success_url,
            ];
            return view('NttData.paymentSuccess',$responseData);
        }else{
            $responseData=[
                "UniqueRefNumber"=>$merchTxnId,
                "PaymentMode"=>"",
                "callBack"=>$onlineRequestData->fail_url,
            ];
            return view('NttData.paymentFail',$responseData);
        }
    }

    public function decryptNttDataResponse(Request $request){
        try{
            $data = $request->encData;
            $decData = $this->_ObjNttData->decryptResponse($data);
            $jsonData = json_decode($decData, true);
            return responseMsg(true,"data Decrypt",$jsonData);
        }
        catch (Exception $e) {
            return responseMsg(false,$e->getMessage(),"");
        }
    }

    public function testSignature(Request $request){
        try{
            $signatureStr = $request->signatureStr;
            $rsignatureStr = $this->_ObjNttData->verifyPaymentSignature($signatureStr);
            return responseMsg(true,"signature",['signature' =>$rsignatureStr]);
        }catch (Exception $e) {
            return responseMsg(false,$e->getMessage(),"");
        }
    }
}
