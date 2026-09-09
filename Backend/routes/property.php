<?php

use App\Http\Controllers\Property\MasterController;
use App\Http\Controllers\Property\PropertyController;
use App\Http\Controllers\Property\ReportController;
use App\Http\Controllers\Property\SafController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('property', function (Request $request) {
    $request->merge(["property"=>"property"]);
    return($request->all());
});

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::controller(MasterController::class)->group(function(){
        Route::post('prop-usage-type', 'propUsageType');
        Route::post('prop-usage-type-dtl', 'propUsageTypeDtl');
        Route::post('prop-usage-type-add', 'addPropUsageType');
        Route::post('prop-usage-type-edit', 'editPropUsageType');
        Route::post('prop-usage-type-lock-unlock', 'activeDeactivatePropUsageType');

        Route::post('prop-occupancy-type', 'propOccupancyType');
        Route::post('prop-occupancy-type-dtl', 'propOccupancyTypeDtl');
        Route::post('prop-occupancy-type-add', 'addPropOccupancyType');
        Route::post('prop-occupancy-type-edit', 'editPropOccupancyType');
        Route::post('prop-occupancy-type-lock-unlock', 'activeDeactivatePropOccupancyType');

        Route::post('prop-const-type', 'propConstructionType');
        Route::post('prop-const-type-dtl', 'propConstructionTypeDtl');
        Route::post('prop-const-type-add', 'addPropConstructionType');
        Route::post('prop-const-type-edit', 'editPropConstructionType');
        Route::post('prop-const-type-lock-unlock', 'activeDeactivatePropConstructionType');

        Route::post('prop-property-type', 'propPropertyType');
        Route::post('prop-property-type-dtl', 'propPropertyTypeDtl');
        Route::post('prop-property-type-add', 'addPropPropertyType');
        Route::post('prop-property-type-edit', 'editPropPropertyType');
        Route::post('prop-property-type-lock-unlock', 'activeDeactivatePropPropertyType');

        Route::post("prop-road-mst-list","getRoadTypeMaster");
        Route::post('prop-road-type', 'propRoadType');
        Route::post('prop-road-type-dtl', 'propRoadTypeDtl');
        Route::post('prop-road-type-add', 'addPropRoadType');
        Route::post('prop-road-type-edit', 'editPropRoadType');
        Route::post('prop-road-type-lock-unlock', 'activeDeactivatePropRoadType');

        Route::post('prop-floor-type', 'propFloorType');
        Route::post('prop-floor-type-dtl', 'propFloorTypeDtl');
        Route::post('prop-floor-type-add', 'addPropFloorType');
        Route::post('prop-floor-type-edit', 'editPropFloorType');
        Route::post('prop-floor-type-lock-unlock', 'activeDeactivatePropFloorType');

        Route::post('prop-ownership-type', 'propOwnershipType');
        Route::post('prop-ownership-type-dtl', 'propOwnershipTypeDtl');
        Route::post('prop-ownership-type-add', 'addPropOwnershipType');
        Route::post('prop-ownership-type-edit', 'editPropOwnershipType');
        Route::post('prop-ownership-type-lock-unlock', 'activeDeactivatePropOwnershipType');

        Route::post('prop-apartment-list', 'propApartmentList');
        Route::post('prop-apartment-dtl', 'propApartmentDtl');
        Route::post('prop-apartment-add', 'addPropApartment');
        Route::post('prop-apartment-edit', 'editPropApartment');
        Route::post('prop-apartment-lock-unlock', 'activeDeactivatePropApartment');
    });
    Route::controller(SafController::class)->group(function(){
        Route::post("get-saf-master-data","getSafMasterData");
        Route::post("get-new-ward-by-old","getNewWardByOldWard");
        Route::post("get-apartment-by-old-ward","getApartmentListByOldWard");
        Route::post("get-swm-subCategory","getSwmSubCategoryList");
        Route::post("get-swm-rate","getSwmRate");
        Route::post("test-request","testAddRequest");
        Route::post("review-tax","reviewTax")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("saf-apply","AddSaf");
        Route::match(["get","post"],"search-saf","searchSaf");
        Route::post("get-saf-dtl","getSafDtl");
        Route::post("saf-edit-basic","editBasicsSaf");
        Route::post("get-saf-demand","getSafDue");
        Route::post("pay-saf-demand","safOfflinePayment");
        Route::post("payment-receipt","getSafPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);

        Route::post("saf-auto-forward-list","safListForAutoApprove");
        Route::post("saf-auto-forward","addAutoForwardAssistant");
        Route::post("inbox","inbox");
        Route::post("inbox","inbox");
        Route::post("outbox","outbox");
        Route::post("post-next","postNextLevel");
        Route::post("doc-list","getDocList");
        Route::post("get-uploaded-doc-list","getUploadedDoc");
        Route::post("uploaded-doc","uploadDoc");
        Route::post("doc-verify","docVerify");
        Route::post("geotage","uploadGeoTag");
        Route::post("get-saf-field-verification","getSafForVerification");
        Route::post("field-verification","fieldVerification");
        Route::match(["get","post"],"field-verification-dtl","getVerificationDetails");
        Route::post("memo-receipt","memoReceipt")->withoutMiddleware("auth:sanctum");
        Route::post("validate-saf","validateSafNo");
    });
    Route::controller(PropertyController::class)->group(function(){
        Route::match(["get","post"],"search-prop","searchProperty");
        Route::post("get-prop-dtl","propDtl");
        Route::post("prop-edit-basic","editPropBasicDtl");
        Route::post("prop-edit-owner","editOwnerDtl");
        Route::post("get-prop-demand","getPropDue");
        Route::post("get-prop-demand-history","getPropDemandHistory");
        Route::post("pay-prop-demand","propOfflinePayment");
        Route::post("pay-prop-demand-nttData-init","propOnlineNttDataInitPayment");
        Route::post("prop-payment-receipt","getPropPaymentReceipt")->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("prop-deactivate","propDeactivate");
        Route::post("validate-holding","validateHoldingNo")->withoutMiddleware(["auth:sanctum"]);
        Route::post("prop-generate-notice","generateNotice");
        Route::post("prop-notice-list","getPropertyNoticeList");
        Route::post("prop-notice-receipt","propertyNoticeReceipt");
        Route::post("prop-notice-deactivate","propertyNoticeDeactivate");
        Route::post("validate-existing-holding-no","validateExistingHolding");
        Route::post("test-add-existing-prop","testAddExistingPropertyRequest");
        Route::post("add-existing-prop","addExistingProperty");
    });
    Route::prefix("report")->group(function(){
        Route::controller(ReportController::class)->group(function(){
            Route::match(["get","post"],'payment-mode', 'getPaymentMode')->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
            Route::post('collection', 'collectionReport');
            Route::post('wf-role-list', 'propertyWfRoleList');
            Route::post('collection-summary', 'collectionSummary');
            Route::post('ward-wise-holding', 'wardWiseHolding');
            Route::post('level-wise-pending-saf', 'levelWisePendingSaf');
            Route::post('user-wise-pending-saf', 'userWisePendingSaf');
            Route::post('role-user-wise-pending-saf', 'roleUserWisePendingSaf');
            Route::post('role-wise-pending-saf', 'roleWisePendingSaf');
            Route::post('prop-dcb', 'holdingWiseDcb');
            Route::post('ward-wise-dcb', 'wardWiseDcb');
            Route::post('applied-saf-list', 'appliedSafList');
            Route::post('ward-wise-applied-saf', 'wardWiseAppliedList');
            Route::post('date-wise-applied-saf', 'dateWiseAppliedSaf');
            Route::post('date-wise-prop-demand-due', 'dateWisePropertyCreated');
            Route::post('month-wise-prop-demand-due', 'monthWiseCreatedProperty');
        });
    });
});
