<?php

use App\Http\Controllers\Lease\LeaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    
    Route::controller(LeaseController::class)->group(function(){
        Route::post("get-master-data","getLeaseMasterData");
        Route::post("add","addLease");
        Route::post("search","searchLease");
        Route::post("dtl","leaseDtl");
        // Route::post("generate-demand","generateDemand");
        Route::post("demand-history","getAllDemands");
        Route::post("due","leaseDue");        
        Route::post("pay-due","offlinePayment");
        Route::post("payment-receipt","getPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
    });
    
});