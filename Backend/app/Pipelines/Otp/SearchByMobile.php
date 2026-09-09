<?php

namespace App\Pipelines\Otp;

use Closure;

class SearchByMobile
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('mobile')) {
            return $next($request);
        }
        return $next($request)
            ->where('mobile_no', request()->input('mobile') );
    }
}
