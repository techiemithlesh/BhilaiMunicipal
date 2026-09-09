<?php

namespace App\Pipelines\Citizen;

use Closure;

class SearchByEmail
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('email')) {
            return $next($request);
        }
        if (request()->has("strict") == true) {
            return $next($request)->where("email", request()->input('email'));
        }
        return $next($request)
            ->where('email', 'ilike', '%' . request()->input('email') . '%');
    }
}
