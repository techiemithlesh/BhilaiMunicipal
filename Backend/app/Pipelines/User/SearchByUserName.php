<?php

namespace App\Pipelines\User;

use Closure;

class SearchByUserName
{
    public function handle($request, Closure $next)
    {        
        if ((!request()->has('userName')) || (request()->input('userName')=="")) {
            return $next($request);
        }
        if (request()->has("strict") == true) {
            return $next($request)->where("users.user_name", request()->input('userName'));
        }
        return $next($request)
            ->where('users.user_name', 'ilike', '%' . request()->input('userName') . '%');
    }
}
