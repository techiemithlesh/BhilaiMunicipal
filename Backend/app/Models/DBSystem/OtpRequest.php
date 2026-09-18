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
        
        $now = Carbon::now();

        $request->merge([
            'otpDateTime' => $now->format('Y-m-d H:i:s'),
            'expiresAt' => ($request->expiresAt ? Carbon::parse($request->expiresAt)->format('Y-m-d H:i:s') : $now->copy()->addMinutes(10))->format('Y-m-d H:i:s'),
        ]);
        $inputs = snakeCase($request);//dd($inputs->all());
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
