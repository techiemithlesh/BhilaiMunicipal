<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\RequestChangePssByToken;
use App\Http\Requests\Common\RequestOtpVerify;
use App\Http\Requests\Common\RequestSendOtpUpdate;
use App\Mail\ForgotPassword;
use App\Models\Citizen;
use App\Models\DBSystem\OtpRequest;
use App\Models\DBSystem\PasswordResetOtpToken;
use App\Models\DBSystem\UlbNotice;
use App\Models\User;
use App\Pipelines\Citizen\SearchByEmail as CitizenSearchByEmail;
use App\Pipelines\Citizen\SearchByMobile as CitizenSearchByMobile;
use App\Pipelines\Otp\SearchByEmail as OtpSearchByEmail;
use App\Pipelines\Otp\SearchByMobile as OtpSearchByMobile;
use App\Pipelines\Otp\SearchByOtp;
use App\Pipelines\Otp\SearchByOtpType;
use App\Pipelines\Otp\SearchByUserType;
use App\Pipelines\User\SearchByEmail;
use App\Pipelines\User\SearchByMobile;
use App\Pipelines\User\SearchByUserName;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    /**
     *       created by: Sandeep Bara
     *       Date       : 2024-07-17
             status     : open
            📖         : read data (read connection use)
            ✍️          : write data (write connection use)
     */

    private $_modelOtpRequest;
    private $_modelUser;
    private $_modelCitizen;
    private $_modelPasswordResetOptToken;
    private $_modelUlbNotice;
    public function __construct()
    {
        $this->_modelOtpRequest = new OtpRequest();
        $this->_modelUser = new User();
        $this->_modelCitizen = new Citizen();        
        $this->_modelPasswordResetOptToken = new PasswordResetOtpToken();
        $this->_modelUlbNotice = new UlbNotice();
    }

     /**
     * ||================✍Send Otp On Register Email Or Mobile ✍=============================
     * ||                   Created By: Sandeep 
     * ||                   Date      : 13-01-2024
     */
    public function forgatPasswordSendOtp(RequestSendOtpUpdate $request)
    {
        try {
            $email = $request->email;
            $mobileNo  = $request->mobile;
            $userName = $request->userName;
            $userType = $request->userType;
            $otpType = 'Forgot Password';
            $request->merge(["strict" => true]);
            if (!$email && !$mobileNo && !$userName) {
                throw new CustomException("Invalid Data Given");
            }
            $userData = $this->_modelUser->where('lock_status', false)
                ->orderBy('id', 'DESC');
            $userData = app(Pipeline::class)
                ->send(
                    $userData
                )
                ->through([
                    SearchByEmail::class,
                    SearchByMobile::class,
                    SearchByUserName::class
                ])
                ->thenReturn()
                ->first();
            if ($userType == "Citizen") {
                $userData = $this->_modelCitizen->orderBy('id', 'DESC');
                $userData = app(Pipeline::class)
                    ->send(
                        $userData
                    )
                    ->through([
                        CitizenSearchByEmail::class,
                        CitizenSearchByMobile::class
                    ])
                    ->thenReturn()
                    ->first();
            }
            if (!$userData && $email) {
                throw new CustomException("Email doesn't exist");
            }
            elseif(!$userData && $mobileNo)
            {
                throw new CustomException("Mobile doesn't exist");
            }
            elseif(!$userData)
            {
                throw new CustomException("Data Not Found");
            }
            $generateOtp = generateOtp();
            $request->merge([
                "mobileNo" => $request->mobile,
                "type" => $otpType,
                "otpType" => $otpType,
                "Otp" => $generateOtp,
                "userId" => $userData->id,
                "userType" => $userData->gettable(),
            ]);
            $smsDta = OTP($request->all());
            if ($mobileNo &&  !$smsDta["status"]) {
                throw new CustomException("Some Error Occurs Server On Otp Sending");
            }
            $sms = $smsDta["sms"] ?? "";
            $temp_id = $smsDta["temp_id"] ?? "";
            $sendsOn = [];
            if ($mobileNo) {
                $response = send_sms($mobileNo, $sms, $temp_id);
                $sendsOn[] = "mobile No.";
            }
            if ($email || $userName) {
                $sendsOn[] = "Email";
                $details = [
                    "title" => "Password reset information",
                    "name"  => $userData->getTable() != "users" ? $userData->user_name : $userData->name,
                    "Otp" => $request->Otp
                ];
                try {
                    Mail::to($userData->email)->send(new ForgotPassword($details));
                } catch (Exception $e) {
                    throw new CustomException("Currently Email Service is stopped Please try another way");
                }
            }
            $responseSms = "";
            foreach ($sendsOn as $val) {
                $responseSms .= ($val . " & ");
            }
            $responseSms = trim($responseSms, "& ");
            $responseSms = "OTP send to your " . $responseSms;
            $this->_modelOtpRequest->store($request);

            return responseMsg(true, $responseSms, "");
        }catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        }catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }
    
    # log 
    public function verifyOtp(RequestOtpVerify $request)
    {
        try {
            $checkOtp = $this->_modelOtpRequest::orderBy("id", "DESC");
            $checkOtp = app(Pipeline::class)
                ->send(
                    $checkOtp
                )
                ->through([
                    OtpSearchByEmail::class,
                    OtpSearchByMobile::class,
                    SearchByOtpType::class,
                    SearchByUserType::class,
                    SearchByOtp::class,
                ])
                ->thenReturn()
                ->first();

            if (!$checkOtp) {
                throw new CustomException("Invalid OTP !");
            }
            if ($checkOtp->expires_at < Carbon::now()) {
                $this->transferLog($checkOtp);
                throw new CustomException("OTP is expired");
            }
            $checkOtp->use_date_time = Carbon::now();
            $request->merge([
                "tokenableType"  => $checkOtp->gettable(),
                "tokenableId"  => $checkOtp->id,
                "userType"     => $checkOtp->user_type,
                "userId"     => $checkOtp->user_id,
            ]);

            DB::beginTransaction();
            $checkOtp->update();
            $this->transferLog($checkOtp);

            $sms = "OTP Validated!";
            $response = [];
            if ($checkOtp->otp_type == "Forgot Password") {
                $sms = "OTP Verify Proceed For Password Update. Token Is Valid Only 10 minutes";
                $response["token"] = $this->_modelPasswordResetOptToken->store($request);
            }
            DB::commit();

            return responseMsg(true, $sms, $response, "", "01", ".ms", "POST", "");
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    protected function transferLog(OtpRequest $checkOtp)
    {
        $OldOtps =  OtpRequest::where("expires_at", Carbon::now())
            ->whereNotNull("expires_at")
            ->where(DB::raw("CAST(created_at AS Date)"), Carbon::now()->format("Y-m-d"))
            ->get();
        foreach ($OldOtps as $val) {
            $otpLog = $val->replicate();
            $otpLog->setTable('log_otp_requests');
            $otpLog->id = $val->id;
            $otpLog->save();
            $checkOtp->delete();
        }
        if ($checkOtp) {
            $otpLog = $checkOtp->replicate();
            $otpLog->setTable('log_otp_requests');
            $otpLog->id = $checkOtp->id;
            $otpLog->save();
            $checkOtp->delete();
        }
    }

    public function changePassword(RequestChangePssByToken $request)
    {
        try {
            # logi 
            $requestToken = $this->_modelPasswordResetOptToken
                ->where("token", $request->token)
                ->where("status", 0)
                ->whereNotNull("user_type")
                ->whereNotNull("user_id")
                ->first();
            if (!$requestToken) {
                throw new CustomException("Invalid Token");
            }
            if ($requestToken->expires_at < Carbon::now()) {
                throw new CustomException("Token Is Expired");
            }
            $users = $requestToken->user_type == $this->_modelCitizen->gettable() ? $this->_modelCitizen->find($requestToken->user_id) : $this->_modelUser->find($requestToken->user_id);
            if (!$users || (!in_array($requestToken->user_type, [$this->_modelCitizen->gettable(), $this->_modelUser->gettable()]))) {
                throw new CustomException("Invalid Password Update Request Apply");
            }
            $requestToken->status = 1;
            $users->password = Hash::make($request->newPassword);

            DB::beginTransaction();
            $users->tokens->each(function ($token, $key) {
                $token->expires_at = Carbon::now();
                $token->update();
                $token->delete();
            });
            $requestToken->update();
            $users->update();
            DB::commit();

            return responseMsg(true, "Password Updated Successfully", "");
        } catch (CustomException $e) {
            DB::rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            DB::rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function addUlbNotice(Request $request){
        try{
            $rules = [
                "noticeDate"=>"required|date|before_or_equal:" . Carbon::now()->format("Y-m-d"),
                "subject"=>"required|min:10",
                "doc"=>"nullable|file|mimes:bmp,jpeg,jpg,png,pdf|max:10240",                
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $user = Auth()->user();
            $request->merge(["ulbId"=>$user->ulb_id,"user_id"=>$user->id]);
            $relativePath = "Uploads/UlbNotice";
            if ($request->hasFile('doc')) {
                $imageName = $user->ulb_id . "_" . Str::uuid() . "." . $request->doc->getClientOriginalExtension();
                // $request->file('doc')->move(public_path($relativePath), $imageName);
                $path = $request->doc->storeAs($relativePath,$imageName, $this->disk);
                $request->merge([
                    "docPath" => $path,
                ]);
            }

            $id = $this->_modelUlbNotice->store($request);
            return responseMsg(true,"Notice Publish","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function editUlbNotice(Request $request){
        try{
            $rules = [
                "id"=>"required|exists:".$this->_modelUlbNotice->getConnectionName().".".$this->_modelUlbNotice->getTable().",id",
                "noticeDate"=>"required|date|before_or_equal:" . Carbon::now()->format("Y-m-d"),
                "subject"=>"required|min:10",
                "doc"=>"nullable|file|mimes:bmp,jpeg,jpg,png,pdf|max:10240",                
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $user = Auth()->user();
            $request->merge(["ulbId"=>$user->ulb_id,"user_id"=>$user->id]);
            $relativePath = "Uploads/UlbNotice";
            $notice = $this->_modelUlbNotice->find($request->id);
            $request->merge(["docPath"=>$notice->doc_path]);
            if ($request->hasFile('doc')) {
                // $filePath = public_path( $notice->doc_path);
                // if (file_exists($filePath)) {
                //     // Delete the file
                //     @unlink($filePath);
                // }
                if (!empty($notice->doc_path) && Storage::disk($this->disk)->exists($notice->doc_path)) {
                    Storage::disk($this->disk)->delete($notice->doc_path);
                }
                $imageName = $user->ulb_id . "_" . Str::uuid() . "." . $request->doc->getClientOriginalExtension();
                // $request->file('doc')->move(public_path($relativePath), $imageName);
                $path = $request->doc->storeAs($relativePath,$imageName, $this->disk);
                $request->merge([
                    "docPath" => $path,
                ]);
            }

            $id = $this->_modelUlbNotice->edit($request);
            return responseMsg(true,"Notice Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function lockUnlockUlbNotice(Request $request){
        try{
            $rules = [
                "id"=>"required|exists:".$this->_modelUlbNotice->getConnectionName().".".$this->_modelUlbNotice->getTable().",id",
                "lockStatus"=>"required|bool",               
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $user = Auth()->user();
            $id = $this->_modelUlbNotice->edit($request);
            return responseMsg(true,"Notice Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function getNoticeList(Request $request){
        try{ 
            $user = Auth()->user();
            if($user?->ulb_id && !$request?->ulbId){
                $request->merge(["ulbId"=>$user->ulb_id]);
            }
            $data = $this->_modelUlbNotice
                    ->readConnection()
                    ->select("ulb_notices.*","ulb_masters.ulb_name","users.name")
                    ->join("ulb_masters","ulb_masters.id","ulb_notices.ulb_id")
                    ->join("users","users.id","ulb_notices.user_id")
                    ->where("ulb_notices.lock_status",false)
                    ->where("ulb_notices.lock_status",false);
            if($request->ulbId){
                $data->where("ulb_notices.ulb_id",$request->ulbId);
            }
            if($request->fromDate && $request->uptoDate){
                $data->whereBetween("ulb_notices.notice_date",[$request->fromDate,$request->uptoDate]);
            }elseif($request->fromDate){
                $data->where("ulb_notices.notice_date",">=",$request->fromDate);
            }elseif($request->uptoDate){
                $data->where("ulb_notices.notice_date","<=",$request->uptoDate);
            }
            if($request->key){
                $data->where(function($where)use($request){
                    $where->orWhere("ulb_notices.subject","ILIKE","%".$request->key."%");
                });
            }

            if($request->currentFy){
                $data->whereBetween("ulb_notices.notice_date",FyearFromUptoDate());
            }

            if($request->all){
                $data = $data->get()->map(function($val){
                    $val->doc_path = $val->doc_path ? url("/documents")."/".$val->doc_path : null;              
                    return $val;
                });
                return responseMsg(true,"All Notice List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All Notice List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $val->doc_path = $val->doc_path ? url("/documents")."/".$val->doc_path : null;              
                return $val;
            });
            return responseMsg(true,"Notice Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        } 
    }

    public function dtlUlbNotice(Request $request){
        try{ 
            $rules = [
                "id"=>"required|exists:".$this->_modelUlbNotice->getConnectionName().".".$this->_modelUlbNotice->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            
            $data = $this->_modelUlbNotice->find($request->id);
            $data->doc_path = $data->doc_path ? url("/documents")."/".$data->doc_path : null; 
           
            return responseMsg(true,"Notice Dtl",camelCase(remove_null($data)));
            
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        } 
    }
}
