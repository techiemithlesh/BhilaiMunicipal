<?php

namespace App\Pipelines\Otp;

use Closure;

class SearchByEmail
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('email')) {
            return $next($request);
        }
        return $next($request)
            ->where('email', request()->input('email'));
    }
}
