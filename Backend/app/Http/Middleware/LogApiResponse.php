<?php

namespace App\Http\Middleware;

use App\Models\ModelLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
            
        if ($response->isSuccessful() && $request->isJson() && $request->route()) {
            $action = $request->route()->getActionName();
            $content = json_decode($response->getContent(), true);            
            $requestToken = app('requestToken');
            $logModel = (new ModelLog());
            $jsonContent = $content;
            if (is_array($content) || is_object($content)) {
                $jsonContent = json_encode($content);                
            }
            $logModel->where("token", $requestToken)->update([
                "response_body" => $jsonContent
            ]);
        }
    }

}
