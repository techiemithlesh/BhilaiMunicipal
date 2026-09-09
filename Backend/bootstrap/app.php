<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        using: function () {

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('api')
                ->prefix("api/property")
                ->name("property.")
                ->group(base_path("routes/property.php"));

            Route::middleware('api')
                ->prefix("api/water")
                ->name("water.")
                ->group(base_path("routes/water.php"));

            Route::middleware('api')
                ->prefix("api/trade")
                ->name("trade.")
                ->group(base_path("routes/trade.php"));

            Route::middleware('api')
                ->prefix("api/account")
                ->name("account.")
                ->group(base_path("routes/account.php"));

            Route::middleware('api')
                ->prefix("api/dashboard")
                ->name("dashboard.")
                ->group(base_path("routes/dashboard.php"));
     
            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {

        // MIDDLEWARE FOR MAINTENANCE MODE
        // ✅ ADD THIS LINE (GLOBAL MIDDLEWARE)
        $middleware->append(\App\Http\Middleware\ForceMaintenance::class);
        // 1. Apply the middleware to the global 'api' group
        // It's best practice to add logging after all other API-specific middleware run.
        $middleware->web(prepend: [
            "corsSite", // ✅ Apply CORS to web routes
        ]);
        $middleware->api(append: [
            "atomic.lock",
            "logResponse", // <-- ADDED HERE to apply to all API routes
        ])->prepend([
            // Use prepend for middleware that must run very early in the API request cycle
            \App\Http\Middleware\SetUlbDatabaseConnections::class,
        ]);
        //
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            "expireBearerToken" => \App\Http\Middleware\ExpireBearerToken::class,
            "setUlb"=>\App\Http\Middleware\SetUlbDatabaseConnections::class,
            "logResponse"=>\App\Http\Middleware\LogApiResponse::class,
            "corsSite"=>\App\Http\Middleware\CorsMiddleware::class,
            'atomic.lock' => \App\Http\Middleware\PreventConcurrentRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
