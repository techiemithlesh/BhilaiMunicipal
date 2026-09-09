<?php

namespace App\Pipelines\Otp;

use Closure;

class SearchByOtpType
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('OtpType')) {
            return $next($request);
        }
        return $next($request)
            ->where('otp_type', request()->input('OtpType'));
    }
}
