<?php

use App\Http\Controllers\DashBoardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('dashboard', function (Request $request) {
    $request->merge(["dashboard"=>"dashboard"]);
    return($request->all());
});

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::prefix("/property")->group(function(){
        Route::controller(DashBoardController::class)->group(function(){
            Route::post("demand-collection-due","holdingDemandCollectionCurrentYear");
            Route::post("applied-saf","appliedSafCurrentYear");
        });
    });
});

