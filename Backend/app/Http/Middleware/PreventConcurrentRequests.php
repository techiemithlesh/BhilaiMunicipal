<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class PreventConcurrentRequests
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Get the identifying data
        $url = $request->fullUrl();
        $ip = $request->ip();
        
        // 2. Capture the payload (all input data)
        // json_encode converts the array of data into a string for hashing
        $payload = json_encode($request->all());

        // 3. Create a unique key based on URL + IP + Data
        // If any of these change, the key changes.
        $lockKey = 'global_lock_' . md5($url . $ip . $payload);

        // 4. Define the lock (10-second safety timeout)
        $lock = Cache::lock($lockKey, 30);

        // 5. Attempt to acquire the lock
        if ($lock->get()) {
            try {
                return $next($request);
            } finally {
                // Release the lock after the request is finished
                $lock->release();
            }
        }

        // 6. If lock fails, return 429
        return response()->json([
            'status' => 429,
            'message' => 'A duplicate request with the same data is already being processed.'
        ], 429);
    }
}