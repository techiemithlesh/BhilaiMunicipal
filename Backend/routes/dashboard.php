<?php

use App\Http\Controllers\DashBoardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('dashboard', function (Request $request) {
    $request->merge(["dashboard"=>"dashboard"]);
    return($request->all());
});

// Comprehensive Dashboard Overview (public/anonymous access fallback)
Route::match(['get', 'post'], 'summary', [DashBoardController::class, 'getDashboardSummary']);

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    // Authenticated Comprehensive Dashboard Overview
    Route::match(['get', 'post'], 'auth-summary', [DashBoardController::class, 'getDashboardSummary']);

    Route::prefix("/property")->group(function(){
        Route::controller(DashBoardController::class)->group(function(){
            Route::post("demand-collection-due","holdingDemandCollectionCurrentYear");
            Route::post("applied-saf","appliedSafCurrentYear");
        });
    });
});

