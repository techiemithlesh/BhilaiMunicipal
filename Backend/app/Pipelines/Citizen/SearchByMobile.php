<?php

namespace App\Pipelines\Citizen;

use Closure;

class SearchByMobile
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('phoneNo')) {
            return $next($request);
        }
        if (request()->has("strict") == true) {
            return $next($request)->where("phone_no", request()->input('phoneNo'));
        }
        return $next($request)
            ->where('phone_no', 'ilike', '%' . request()->input('phoneNo') . '%');
    }
}
