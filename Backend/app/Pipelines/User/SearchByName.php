<?php

namespace App\Pipelines\User;

use Closure;

class SearchByName
{
    public function handle($request, Closure $next)
    {
        if (!request()->has('name')) {
            return $next($request);
        }
        return $next($request)
            ->where('users.name', 'ilike', '%' . request()->input('name') . '%');
    }
}
