<?php

use App\Http\Controllers\Water\ConsumerController;
use App\Http\Controllers\Water\ReportController;
use App\Http\Controllers\Water\WaterApplicationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('water', function (Request $request) {
    $request->merge(["water"=>"water"]);
    return($request->all());
});

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::prefix("app/")->group(function(){
        Route::controller(WaterApplicationController::class)->group(function(){
            Route::post("master-data","getMasterData");
            Route::post("test-request","testAddRequest");
            Route::post("review-tax","reviewTax");
            Route::post("apply-connection","applyApplication");
            Route::post("edit","editAppData");
            Route::post("search","searchApplication");
            Route::post("dtl","getApplicationDtl");
            Route::post("due","getApplicationDue");
            Route::post("pay-demand","offlinePayment");
            Route::post("payment-receipt","getPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);

            Route::post("doc-list","getDocList");
            Route::post("get-uploaded-doc-list","getUploadedDoc");
            Route::post("uploaded-doc","uploadDoc");
            Route::post("doc-verify","docVerify");

            Route::post("inbox","inbox");
            Route::post("btc-list","btcList");
            Route::post("outbox","outbox");
            Route::post("post-next","postNextLevel");
            Route::post("get-field-verification","getApplicationForVerification");
            Route::post("field-verification","fieldVerification");
            Route::post("field-verification-dtl", "getVerificationDetails");
        });
    });
    Route::prefix("consumer/")->group(function(){
        Route::controller(ConsumerController::class)->group(function(){
            Route::post("meter-type/list","getMeterTypeList");
            Route::post("search","searchConsumer");
            Route::post("dtl","consumerDtl");
            Route::post("update-connection","updateConnectionType");
            Route::post("generate-demand","generateDemand");
            Route::post("demand-history","getAllDemands");
            Route::post("due","consumerDue");
            Route::post("pay-due","offlinePayment");
            Route::post("payment-receipt","getPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
        });
    });
    Route::prefix("report")->group(function(){
        Route::controller(ReportController::class)->group(function(){
            Route::match(["get","post"],'payment-mode', 'getPaymentMode')->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
            Route::post('collection', 'collectionReport');
            Route::post('wf-role-list', 'waterWfRoleList');
            Route::post('collection-summary', 'collectionSummary');            
            Route::post('level-wise-pending-app', 'levelWisePendingApp');
            Route::post('user-wise-pending-app', 'userWisePendingApp');
            Route::post('role-user-wise-pending-app', 'roleUserWisePendingApp');
            Route::post('role-wise-pending-app', 'roleWisePendingApp');
            Route::post('ward-wise-consumer', 'wardWiseConsumer');
            Route::post('consumer-dcb', 'consumerWiseDcb');
            Route::post('ward-wise-dcb', 'wardWiseDcb');
            // Route::post('applied-saf-list', 'appliedSafList');
            // Route::post('ward-wise-applied-saf', 'wardWiseAppliedList');
        });
    });
});
