<?php

use App\Http\Controllers\Trade\ReportController;
use App\Http\Controllers\Trade\TradeLicenseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('trade', function (Request $request) {
    $request->merge(["trade"=>"trade"]);
    return($request->all());
});

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::controller(TradeLicenseController::class)->group(function(){
        Route::post("get-trade-master-data","getMasterData");
        Route::post("test-request","testAddRequest");
        Route::post("review-tax","reviewTax");
        Route::post("apply","AddTrade");
        Route::post("edit","editAppData");
        Route::match(['get','post'],"search","searchTrade");
        Route::post("get-dtl","getLicenseDtl");
        Route::post("get-due","getLicenseDue");
        Route::post("pay-demand","offlinePayment");
        Route::post("payment-receipt","getTradePaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("license-receipt","getTradeLicenseReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("doc-list","getDocList");
        Route::post("get-uploaded-doc-list","getUploadedDoc");
        Route::post("uploaded-doc","uploadDoc");
        Route::post("doc-verify","docVerify");

        Route::post("inbox","inbox");
        Route::post("btc-list","btcList");
        Route::post("outbox","outbox");
        Route::post("post-next","postNextLevel");
    });
    Route::prefix("report")->group(function(){
        Route::controller(ReportController::class)->group(function(){
            Route::match(["get","post"],'payment-mode', 'getPaymentMode')->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
            Route::post('collection', 'collectionReport');
            Route::post('wf-role-list', 'tradeWfRoleList');
            Route::post('collection-summary', 'collectionSummary');
            Route::post('ward-wise-trade', 'wardWiseTrade');
            Route::post('level-wise-pending-trade', 'levelWisePendingTrade');
            Route::post('user-wise-pending-trade', 'userWisePendingTrade');
            Route::post('role-user-wise-pending-trade', 'roleUserWisePendingTrade');
            Route::post('role-wise-pending-trade', 'roleWisePendingTrade');
            Route::post("license-status","licenseStatus");
        });
    });
});
