<?php
use App\Http\Controllers\ShopRent\MasterController;
use App\Http\Controllers\ShopRent\ShopRentController;
use App\Http\Controllers\SWM\ReportController;
use Illuminate\Support\Facades\Route;

Route::post('/test', [MasterController::class, 'index']);
Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::controller(ShopRentController::class)->group(function(){
        Route::post("get-master-data","getShopRentMasterData");
        Route::post("add","addShopRent");
        Route::post("search","searchShop");
        Route::post("dtl","shopDtl");
        Route::post("generate-demand","generateDemand");
        Route::post("demand-history","getAllDemands");
        Route::post("due","shopDue");        
        Route::post("pay-due","offlinePayment");
        Route::post("payment-receipt","getPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
    });
    Route::prefix("report")->group(function(){
        Route::controller(ReportController::class)->group(function(){
            Route::match(["get","post"],'payment-mode', 'getPaymentMode')->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
            Route::post('collection', 'collectionReport');
            Route::post('collection-summary', 'collectionSummary');
            Route::post('team-summary', 'teamSummary');
        });
    });
});