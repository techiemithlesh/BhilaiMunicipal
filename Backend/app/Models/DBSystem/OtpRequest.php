<?php

namespace App\Models\DBSystem;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class OtpRequest extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "mobile_no",
        "email",
        "otp",
        "otp_time",
        "otp_type",
        "user_id",
        "user_type",
        "expires_at",
    ];

    /**
     * | Save the Otp for Checking Validatin
     * | @param 
     */
    public function store(Request $request){
        $request->merge(["otpDateTime"=> Carbon::now(),"expiresAt"=>$request->expiresAt ? $request->expiresAt : Carbon::now()->addMinutes(10)]);
        $inputs = snakeCase($request);
        $user= self::create($inputs->all());
        return $user->id;
    }

    /**
     * | Check the OTP in the data base 
     * | @param 
     */
    public function checkOtp($request)
    {
        return OtpRequest::where('otp', $request->otp)
            ->where('mobile_no', $request->mobileNo)
            ->orderByDesc('id')
            ->first();
    }

    public function checkOtpViaEmail($request)
    {
        return OtpRequest::where('otp', $request->otp)
            ->where('email', $request->email)
            ->orderByDesc('id')
            ->first();
    }
}
