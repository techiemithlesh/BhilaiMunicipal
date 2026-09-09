<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\Citizen;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Validator;

class SocialAuthController extends Controller
{
    public $_currentDateTime;
    public $_redis;
    private $_modelUser;
    private $_GoogleClientId;
    private $_FacebookClientId;
    private $_GitClientId;
    public function __construct()
    {
        $this->_currentDateTime = Carbon::now();
        $this->_modelUser = new Citizen();

        $this->_GoogleClientId = Config::get("SystemConstant.SOCIALIST-CLIENT-IDS.google");
        $this->_FacebookClientId =Config::get("SystemConstant.SOCIALIST-CLIENT-IDS.facebook");
        $this->_GitClientId = Config::get("SystemConstant.SOCIALIST-CLIENT-IDS.git");

    }
    public function handleGoogleLogin1(Request $request)
    {
        $token = $request->input('token');

        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromIdToken($token);dd($googleUser);

            $user = $this->_modelUser::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'password' => Hash::make(uniqid()) // placeholder password
                ]
            );

            // Issue access token using Laravel Sanctum
            $accessToken = $user->createToken('google-token')->plainTextToken;

            return response()->json([
                'token' => $accessToken,
                'user' => $user
            ]);
        } catch (Exception $e) {dd($e);
            return response()->json(['error' => 'Invalid token or unable to fetch user',$e], 401);
        }
    }

    public function getClintId(Request $request){
        try{
            $data["client_id"] = Config::get("SystemConstant.SOCIALIST-CLIENT-IDS.".$request->client);
            return responseMsg(true,$request->client,remove_null(camelCase($data)));
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        }catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function handleGoogleLogin(Request $request)
    {
        try{
            $rules = [
                "token"=>"required|string",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $idToken = $request->input('token');
            $client = new \Google_Client(['client_id' => $this->_GoogleClientId]);
        
            $payload = $client->verifyIdToken($idToken);
            if(!$payload){
                throw new CustomException("Invalid ID token");
            }

            $email = $payload['email'];
            $name = $payload['name'] ?? 'Google User';
            $names = explode(" ",$name);
            $firstName = $names[0]??null;
            $middleName = $names[1]??null;
            $lastName = $names[2]??null;
            if(!$lastName){
                $lastName = $middleName;
                $middleName=null;
            }

            $user = $this->_modelUser::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    "first_name"=>$firstName,
                    "middle_name"=>$middleName,
                    "last_name"=>$lastName,
                    'password' => Hash::make(uniqid()),
                    'google_id' => $payload['sub'] ?? null,
                ]
            );

            $muser = $this->_modelUser->find($user->id);

            $maAllow = $muser->max_login_allow;
            $remain = ($muser->tokens->count("id")??0) - $maAllow;
            $c = 0;
            foreach($muser->tokens->sortBy("id")->values() as  $key =>$token){                  
                if($remain<$key)
                {
                    break;
                }
                $c+=1;                
                $userType = $muser->getTable();
                $redisKey  = "ulb_id:" . $userType . ":" . $muser->id . ":" . $token->id;
                Redis::del($redisKey );
                $token->expires_at = Carbon::now();
                $token->update();
                $token->forceDelete();
            }

            $tockenDtl = $user->createToken('google-token');

            $ipAddress = getClientIpAddress(); #$req->userAgent()
            $bousuerInfo = [
                "login_type"=>$request->type,
                "latitude" => $request->browserInfo["latitude"] ?? $request->latitude ??"",
                "longitude" => $request->browserInfo["longitude"] ?? $request->longitude ?? "",
                "machine" => $request->browserInfo["machine"] ?? $request->machine ?? "",
                "browser_name" => $request->browserInfo["browserName"]?? $request->browserName ?? $request->userAgent(),
                "ip" => $ipAddress ?? "",
            ];
            DB::table('personal_access_tokens')
                ->where('id', $tockenDtl->accessToken->id)
                ->update($bousuerInfo);
            $token = $tockenDtl->plainTextToken;
            $muser = $this->_modelUser->find($user->id);
            $muser->user_img = $muser->user_img ? url("/")."/".$muser->user_img : null;
            getProfileProgress($muser);
            $data['token'] = $token;
            $data['userDetails'] = $muser;
            $key = 'last_activity_' . $user->id."_".$tockenDtl->accessToken->id;
            Redis::set($key, $this->_currentDateTime);            // Caching 
            
            return responseMsg(true, "You have Logged In Successfully", camelCase($data));

        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        }catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
        
    }

}
