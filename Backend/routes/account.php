<?php

use App\Http\Controllers\AccountController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::controller(AccountController::class)->group(function(){
        Route::post("cash-user/list","userList");
        Route::post("user/cash","userCash");
        Route::post("cash/verification","cashVerify");
        Route::post("bank/reconciliation/list","bankReconciliationList");
        Route::post("bank/reconciliation","bankReconciliation");
        Route::post("search/transaction","searchTransaction");
        Route::post("update/payment-mode","updatePaymentMode");
        Route::post("deactivate/transaction","deactivateTransaction");
        Route::post("deactivate/transaction/list","deactivatedTranList");
        Route::post("collection/summary","collectionSummary");
        Route::post("date-wise/collection","dateWiseCollection");
    });
});