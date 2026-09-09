<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceMaintenance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle($request, Closure $next)
    {
        if (app()->isDownForMaintenance()) {
            return response()->json([
                'status' => 'maintenance',
                'message' => 'System under maintenance'
            ], 503);
        }

        return $next($request);
    }
}
