<?php

use App\Http\Controllers\SWM\ConsumerController;
use App\Http\Controllers\SWM\FeedbackController;
use App\Http\Controllers\SWM\MasterController;
use App\Http\Controllers\SWM\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('swm', function (Request $request) {
    $request->merge(["swm"=>"swm"]);
    return($request->all());
});
Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::prefix("/master")->group(function(){
        Route::controller(MasterController::class)->group(function(){
            Route::post("category-list","getCategoryList");
            Route::post("category-add","addCategory");
            Route::post("category-edit","editCategory");
            Route::post("category-lock-unlock","lockUnlockCategory");
            Route::post("category-dtl","categoryDtl");

            Route::post("sub-category-list","getSubCategoryList");
            Route::post("sub-category-add","addSubCategory");
            Route::post("sub-category-edit","editSubCategory");
            Route::post("sub-category-lock-unlock","lockUnlockSubCategory");
            Route::post("sub-category-dtl","subCategoryDtl");
        });
    });

    Route::prefix("/feedback")->group(function(){
        Route::controller(FeedbackController::class)->group(function(){
            Route::post("mstr-list","getFeedbackList");
            Route::post("mstr-add","addFeedBack");
            Route::post("mstr-edit","editFeedback");
            Route::post("mstr-lock-unlock","lockUnlockFeedback");
            Route::post("mstr-dtl","showFeedBack");

            Route::post("consumer-list","getConsumerFeedbackList");
            Route::post("consumer-add","addConsumerFeedback");
        });
    });
    Route::controller(ConsumerController::class)->group(function(){
        Route::post("get-master-data","getMasterData");
        Route::post("get-rate","getRate");
        Route::post("validate-holding","validateHoldingNo");
        Route::post("review-tax","reviewTax")->withoutMiddleware(['auth:sanctum']);
        Route::post("test-request","testAddRequest");
        Route::post("consumer-add","addConsumer");
        Route::post("consumer-edit-basic","editConsumer");
        Route::post("consumer-edit-owner","editOwners");
        Route::post("consumer-edit-range","editConsumerRange");
        Route::post("consumer-search","searchConsumer");
        Route::post("consumer-dtl","consumerDtl");
        Route::post("consumer-deactivate","deactivateConsumer");
        Route::post("daily-visiting-log","consumerVisitingLog");
        Route::post("generate-demand","generateDemand");
        Route::post("demand-history","getAllDemands");
        Route::post("consumer-due","consumerDue");
        Route::post("pay-due","offlinePayment");
        Route::post("payment-receipt","getPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("bulk-payment-receipt","bulkPaymentReceipt");
        Route::post("demand-receipt","getDemandReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("daily-rfid-scan","dailyWastCollectionLog")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("install-rfid","installRFID");
        Route::post("validate-consumer","validateConsumer");
    });

    Route::prefix("report")->group(function(){
        Route::controller(ReportController::class)->group(function(){
            Route::match(["get","post"],'payment-mode', 'getPaymentMode')->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
            Route::post('collection', 'collectionReport');
            Route::post('collection-summary', 'collectionSummary');
            Route::post('date-wise-collection', 'dateWiseCollection'); 
            Route::post('team-summary', 'teamSummary'); 
            Route::post('ward-wise-consumer', 'wardWiseConsumer');
            Route::post('consumer-dcb', 'consumerWiseDcb');
            Route::post('ward-wise-dcb', 'wardWiseDcb');
            Route::post('due-consumer', 'consumerDueList');
            Route::post('consumer-type-list', 'consumerTypeList');
            Route::post('user-wise-apply', 'userWiseApplyConnection');
            Route::post('visiting', 'visitingReport');
            Route::post('date-wise-visiting', 'dateVisitedConsumer');
            Route::post('rfid-map-not-map', 'consumerRFIDmaped');
            Route::post('vehicle-movement', 'getVehicleTodayLog');
            Route::post("consumer-location","getConsumerLocation");
            Route::post("consumer-wast-collection","consumerWestCollection");
            Route::post("today-wast-collection","todayWestCollectNotCollectConsumer");
            Route::post("ward-wise-wast-collection","wardWiseWestCollection");
            Route::post("date-wise-consumer-add","addedConsumersList");
        });
    });
});
