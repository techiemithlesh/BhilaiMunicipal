<?php

namespace App\Pipelines\User;

use Closure;

class SearchByEmail
{
    public function handle($request, Closure $next)
    {        
        if ((!request()->has('email')) || (request()->input('email')=="")) {
            return $next($request);
        }
        if (request()->has("strict") == true) {
            return $next($request)->where("users.email", request()->input('email'));
        }
        return $next($request)
            ->where('users.email', 'ilike', '%' . request()->input('email') . '%');
    }
}
