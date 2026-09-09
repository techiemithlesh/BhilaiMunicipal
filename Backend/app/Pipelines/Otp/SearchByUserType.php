<?php

namespace App\Pipelines\Otp;

use Closure;

class SearchByUserType
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('userType')) {
            return $next($request);
        }
        return $next($request)
            ->where('user_type', request()->input('userType'));
    }
}
