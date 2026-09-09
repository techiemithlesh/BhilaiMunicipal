<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetUlbDatabaseConnections
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    { 
        $user = Auth::user();
        $ulbId = null;
        $key = "gust";
        if($user){
            $token = $user->currentAccessToken();
            $userType = $user->getTable();
            $key = "ulb_id:" . $userType . ":" . $user->id . ":" . $token->id;
        }
        // 1. Check if header is set (allows overriding)
        if ($request->hasHeader('X-ULB-ID')) {
            $ulbId = $request->header('X-ULB-ID');
            if($key!="gust")
            Redis::set($key,$ulbId);  
        }

        // 2. Else use session
        if (!$ulbId && Redis::get($key)) {
            $ulbId = Redis::get($key);
        }

        // 3. Else use authenticated user's ULB ID
        if (!$ulbId && $user && isset($user->ulb_id)) {
            $ulbId = $user->ulb_id;
        }   
        // Apply DB connection switching
        if ($ulbId) {     
            App::instance('CurrentUlbId', $ulbId);
            if($user){
                $user->ulb_id = $ulbId;
            }
        }

        return $next($request);
    }

}
