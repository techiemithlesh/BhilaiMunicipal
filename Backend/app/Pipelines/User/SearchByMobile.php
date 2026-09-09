<?php

namespace App\Pipelines\User;

use Closure;

class SearchByMobile
{
    public function handle($request, Closure $next)
    {
        if ((!request()->has('mobile')) || (request()->input('mobile')=="")) {
            return $next($request);
        }
        if (request()->has("strict") == true) {
            return $next($request)->where("users.phone_no", request()->input('mobile'));
        }
        return $next($request)
            ->where('users.phone_no', 'ilike', '%' . request()->input('mobile') . '%');
    }
}
