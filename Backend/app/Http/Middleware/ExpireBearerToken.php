<?php

namespace App\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ExpireBearerToken
{
    private $_user;
    private $_currentTime;
    private $_token;
    private $_lastActivity;
    private $_key;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
         $citizenUserType = "Citizen";
        $this->_user = auth()->user();
        
        
        $this->_token = $request->bearerToken();
        $token = PersonalAccessToken::findToken($this->_token);
        $tokeId = $token ? $token->id:0;
        $this->_currentTime = Carbon::now();

        if ($this->_user && $this->_token) {
            if ($this->_user->user_type == $citizenUserType) {                             // If the User type is citizen
                $this->_key = 'last_activity_citizen_' . $this->_user->id."_".$tokeId;
                $this->_lastActivity = Redis::get($this->_key);                                   // Function (1.1)
                $this->validateToken();
            } else {                                                                       // If the User type is not a Citizen
                $this->_key = 'last_activity_' . $this->_user->id."_".$tokeId;
                $this->_lastActivity = Redis::get($this->_key);
                $this->validateToken();                                                     // Function (1.1)
            }

            if (!$request->has('key') && !$request->input('heartbeat'))
                Redis::set($this->_key, $this->_currentTime);            // Caching
        }
        return $next($request);
    }


    /**
     * | Validate Token (1.1)
     */
    public function validateToken()
    {
        $timeDiff = (new Carbon($this->_lastActivity))->diffInMinutes($this->_currentTime);
        #$this->_currentTime->diffInMinutes($this->_lastActivity);
        $isDebug = filter_var(getenv("APP_DEBUG"), FILTER_VALIDATE_BOOLEAN);
        if ($this->_lastActivity && ($timeDiff > ($isDebug ? 600 : 60))) {            // for 60 Minutes
            Redis::del($this->_key);
            $token = $this->_user->currentAccessToken();
            $userType = $this->_user->getTable();
            $key = "ulb_id:" . $userType . ":" . $this->_user->id . ":" . $token->id;
            Redis::del($key);
            $this->_user->currentAccessToken()->delete();
            abort(response()->json(
                [
                    'status' => true,
                    'authenticated' => false,
                    'sessionTime' => $timeDiff
                ]
            ));
        }
    }
}
