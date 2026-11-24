<?php

use App\Http\Controllers\DashBoardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('dashboard', function (Request $request) {
    $request->merge(["dashboard"=>"dashboard"]);
    return($request->all());
});

// Modular Dashboard APIs (Fast & Decoupled - Public / Fallback access)
Route::match(['get', 'post'], 'all-modules/periods', [DashBoardController::class, 'getAllModulesPeriods']);
Route::match(['get', 'post'], 'all-modules/chart', [DashBoardController::class, 'getAllModulesChart']);
Route::match(['get', 'post'], 'module/overview', [DashBoardController::class, 'getModuleOverview']);
Route::match(['get', 'post'], 'module/dcb', [DashBoardController::class, 'getModuleDcb']);
Route::match(['get', 'post'], 'summary', [DashBoardController::class, 'getDashboardSummary']);

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    // Authenticated Modular Dashboard APIs (Switches tenant ULB connection)
    Route::match(['get', 'post'], 'auth/all-modules/periods', [DashBoardController::class, 'getAllModulesPeriods']);
    Route::match(['get', 'post'], 'auth/all-modules/chart', [DashBoardController::class, 'getAllModulesChart']);
    Route::match(['get', 'post'], 'auth/module/overview', [DashBoardController::class, 'getModuleOverview']);
    Route::match(['get', 'post'], 'auth/module/dcb', [DashBoardController::class, 'getModuleDcb']);
    Route::match(['get', 'post'], 'auth-summary', [DashBoardController::class, 'getDashboardSummary']);

    Route::prefix("/property")->group(function(){
        Route::controller(DashBoardController::class)->group(function(){
            Route::post("demand-collection-due","holdingDemandCollectionCurrentYear");
            Route::post("applied-saf","appliedSafCurrentYear");
        });
    });
});
