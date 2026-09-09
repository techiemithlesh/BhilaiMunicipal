<?php

namespace App\Bll\Payment;

use App\Models\DBSystem\OnlinePaymentRequest;
use Carbon\Carbon;
use Google\Service\WorkflowExecutions\Callback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Validator;

class NttData
{
    /**
     * Create a new class instance.
     */
    private $_OnlinePaymentRequest;
    public $_GatewayType;
    private $_Return_url ;
    private $_LoginUser;
    private $_LoginPass;
    private $_ProdId;
    private $_Api;
    private $_NttMode;
    private $_encRequestKey;
    private $_decResponseKey;
    private $_hashRequestKey;
    private $_hashResponseKey;
    private $_hashValue;
    public function __construct()
    {
        $this->_GatewayType = "NTTDATA";
        $this->_OnlinePaymentRequest = new OnlinePaymentRequest();
        $this->_Return_url = url("/")."/"."api/payment/ntt/response";
        $this->_LoginUser = Config::get("paymentConstraint.NTT_ID");
        $this->_LoginPass = Config::get("paymentConstraint.NTT_PASS");
        $this->_ProdId = Config::get("paymentConstraint.NTT_PROD_ID");
        $this->_NttMode = Config::get("paymentConstraint.NTT_MODE");
        // $this->_Api = Config::get("paymentConstraint.NTT_API");

        $this->_encRequestKey = "A4476C2062FFA58980DC8F79EB6A799E";
        $this->_decResponseKey ="75AEF0FA1B94B3C10D4F5B268F757F11";
        $this->_hashRequestKey = "KEY123657234";
        $this->_hashResponseKey = "KEYRESP123657234";
        $this->setApi();
        
    }

    private function setApi(){
        $this->_Api = $this->_NttMode == "uat" ? "https://caller.atomtech.in/ots/aipay/auth" : "https://paynetzuat.atomtech.in/ots/aipay/auth";
    }

    private function getOderId(int $modeuleId=0)
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';        
        for ($i = 0; $i < 10; $i++) 
        {
            $index = rand(0, strlen($characters) - 1);
            $randomString .= $characters[$index];
        }
        $orderId = (("Order_".$modeuleId.date('dmyhism').$randomString));
        return $orderId = explode("=",chunk_split($orderId,30,"="))[0]; 
    }

    public function initiatePayment(Request $request)
    {
        $validated = Validator::make(
        $request->all(),
            [
                "amount"        => "required|min:1",
                "successUrl"   => "required",
                "failUrl"   => "required",
                "moduleId"      => "required"
            ]
        );
        if ($validated->fails()) {
            $response = ['status' => false, "message" => 'Validation Error', "errors" => $validated->errors()];
            return $response;
        }
        $merchTxnId = $this->getOderId($request->moduleId);
        $amount = $request->amount;
        $date = date('Y-m-d H:i:s'); 
        $user_email = $request->email ?? "xyz@abc.com";
        $mobile = $request->mobile ?? "8888888888";
        $payData = $request->all();
        $payData = array_merge($payData,array(
                    'login'=>$this->_LoginUser,
                    'password'=>$this->_LoginPass,
                    'amount'=>$amount,
                    'prod_id'=>$this->_ProdId,
                    'txnId'=>$merchTxnId,
                    'date'=>$date,
                    'encKey'=>$this->_encRequestKey,
                    'decKey'=>$this->_decResponseKey,
                    'payUrl'=>$this->_Api,
                    'email'=>$user_email,
                    'mobile'=>$mobile,
                    'txnCurrency'=>'INR',
                    'return_url'=>$this->_Return_url,
                    'udf1'=>"",  // optional
                    'udf2'=>"",  // optional 
                    'udf3'=>"",  // optional
                    'udf4'=>"",  // optional
                    'udf5'=>""   // optional
                    ));
    
        $atomTokenId = $this->createTokenId($payData);
        $newRequest = new Request();
        $newRequest->merge(
            [
               "gatewayType"=>$this->_GatewayType,
               "atomTokenId"=> $atomTokenId,
               "merchId"=>$payData['login'],
               "order_id"=>$payData['txnId'],
               "status"=>"PENDING",
               "moduleId"=>$request->moduleId,
               "subModuleId"=>$request->subModuleId,
               "amount"=>$request->amount,
               "successUrl"=>$request->successUrl,
               "failUrl"=>$request->failUrl,
               "payUrl"=>$this->_Api,
               "request_data"=>json_encode($request->all(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
               "payload"=>$payData,
               "payload_hash_value"=>$this->_hashValue,
            ]
        );
        $id=$this->_OnlinePaymentRequest->store($newRequest);
        return[
            'status' => true,
            "requestId"=>$id,
            "atomTokenId"=>$atomTokenId,
            "merchId"=>$payData['login'],
            "custEmail"=> $payData['email'],
            "custMobile"=> $payData['mobile'],
            "returnUrl"=> $payData['return_url'],
            "amount"=>$payData["amount"],
            "orderId"=>$payData['txnId'],
            "payload"=>$payData,
            "payload_hash_value"=>$this->_hashValue,
            "mode"=>$this->_NttMode,
        ];
    }

    public function createTokenId($data)
    {
           $jsondata = '{
                "payInstrument": {
                    "headDetails": {
                        "version": "OTSv1.1",      
                        "api": "AUTH",  
                        "platform": "FLASH"	
                    },
                    "merchDetails": {
                        "merchId": "'.$data['login'].'",
                        "userId": "",
                        "password": "'.$data['password'].'",
                        "merchTxnId": "'.$data['txnId'].'",      
                        "merchTxnDate": "'.$data['date'].'"
                    },
                    "payDetails": {
                        "amount": "'.$data['amount'].'",
                        "product": "'.$data['prod_id'].'",
                        "custAccNo": "213232323",
                        "txnCurrency": "'.$data['txnCurrency'].'"
                    },	
                    "custDetails": {
                        "custEmail": "'.$data['email'].'",
                        "custMobile": "'.$data['mobile'].'"
                    },
                    "extras": {
                        "udf1": "'.$data['udf1'].'",  
                        "udf2": "'.$data['udf2'].'",  
                        "udf3": "'.$data['udf3'].'", 
                        "udf4": "'.$data['udf4'].'",  
                        "udf5": "'.$data['udf5'].'" 
                    }
                }  
            }';
        
             $encData = $this->encrypt($jsondata, $data['encKey'], $data['encKey']);
             $this->_hashValue = $encData;
             $curl = curl_init();
             curl_setopt_array($curl, array(
                  CURLOPT_URL => $data['payUrl'],
                  CURLOPT_RETURNTRANSFER => true,
                  CURLOPT_ENCODING => "",
                  CURLOPT_MAXREDIRS => 10,
                  CURLOPT_TIMEOUT => 0,
                  CURLOPT_FOLLOWLOCATION => true,
                  CURLOPT_SSL_VERIFYHOST => 2,
                  CURLOPT_SSL_VERIFYPEER => 1,
                  CURLOPT_CAINFO => dirname(__FILE__).'/cacert.pem', //added in Controllers folder
                  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                  CURLOPT_CUSTOMREQUEST => "POST",
                  CURLOPT_POSTFIELDS => "encData=".$encData."&merchId=".$data['login'],
                  CURLOPT_HTTPHEADER => array(
                    "Content-Type: application/x-www-form-urlencoded"
                  ),
            ));
            $atomTokenId = null;
            $response = curl_exec($curl);
            $getresp = explode("&", $response); 
            $encresp = substr($getresp[1], strpos($getresp[1], "=") + 1);
            $decData = $this->decrypt($encresp, $data['decKey'], $data['decKey']);
            if(curl_errno($curl)) {
                $error_msg = curl_error($curl);
                echo "error = ".$error_msg;
            }      
            if(isset($error_msg)) {
                echo "error = ".$error_msg;
            }   
            curl_close($curl);
            $res = json_decode($decData, true);
            if($res){
                if($res['responseDetails']['txnStatusCode'] == 'OTS0000'){
                $atomTokenId = $res['atomTokenId'];
                }else{
                echo "Error getting data";
                    $atomTokenId = null;
                }
            }
            return $atomTokenId;
    }

    public function encrypt($data, $salt, $key)
    { 
            $method = "AES-256-CBC";
            $iv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
            $chars = array_map("chr", $iv);
            $IVbytes = join($chars);
            $salt1 = mb_convert_encoding($salt, "UTF-8"); //Encoding to UTF-8
            $key1 = mb_convert_encoding($key, "UTF-8"); //Encoding to UTF-8
            $hash = openssl_pbkdf2($key1,$salt1,'256','65536', 'sha512'); 
            $encrypted = openssl_encrypt($data, $method, $hash, OPENSSL_RAW_DATA, $IVbytes);
            return strtoupper(bin2hex($encrypted));
    }

    public function decrypt($data, $salt, $key)
    {
            $dataEncypted = hex2bin($data);
            $method = "AES-256-CBC";
            $iv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
            $chars = array_map("chr", $iv);
            $IVbytes = join($chars);
            $salt1 = mb_convert_encoding($salt, "UTF-8");//Encoding to UTF-8
            $key1 = mb_convert_encoding($key, "UTF-8");//Encoding to UTF-8
            $hash = openssl_pbkdf2($key1,$salt1,'256','65536', 'sha512'); 
            $decrypted = openssl_decrypt($dataEncypted, $method, $hash, OPENSSL_RAW_DATA, $IVbytes);
            return $decrypted;
    }

    public function decryptResponse($data){
        return $this->decrypt($data,$this->_decResponseKey,$this->_decResponseKey);
    }

    public function verifyPaymentSignature($signatureStr){
        return hash_hmac('sha512', $signatureStr, $this->_hashResponseKey);
    }
}
