<?php

use App\Http\Controllers\Property\CitizenPropertyController;
use App\Http\Controllers\DBSystem\CitizenController;
use App\Http\Controllers\DBSystem\MenuController;
use App\Http\Controllers\DBSystem\NotificationController;
use App\Http\Controllers\DBSystem\QueryEditedController;
use App\Http\Controllers\DBSystem\RoleController;
use App\Http\Controllers\DBSystem\RoleModulePermissionController;
use App\Http\Controllers\DBSystem\SocialAuthController;
use App\Http\Controllers\DBSystem\UlbController;
use App\Http\Controllers\DBSystem\UserController;
use App\Http\Controllers\DBSystem\WardController;
use App\Http\Controllers\DBSystem\WorkflowController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\OnlinePaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::get("/getInfo",function(){
    echo phpinfo();die;
});

Route::controller(OnlinePaymentController::class)->group(function(){
    Route::post('/payment/ntt/callback',"NttDataCallback");
    Route::post('/payment/ntt/response',"NttDataHandelResponse");
    Route::post('/decrypt/ntt/response',"decryptNttDataResponse");
    Route::post('/test/ntt/signature',"testSignature");
});


Route::match(["get","post"],"fyear/list",function(){
    $data = FyListdesc();
    return responseMsgs(true,"Fyear list",camelCase(remove_null($data)));
});



Route::controller(NotificationController::class)->group(function(){
    Route::post('forgot-password', 'forgatPasswordSendOtp');
    Route::post('otp-verify', 'verifyOtp');
    Route::post('otp-change-pass', 'changePassword');

    Route::post('add/notice', 'addUlbNotice')->middleware(['auth:sanctum',"expireBearerToken","setUlb"]);
    Route::post('edit/notice', 'editUlbNotice')->middleware(['auth:sanctum',"expireBearerToken","setUlb"]);
    Route::post('dtl/notice', 'dtlUlbNotice')->middleware(['auth:sanctum',"expireBearerToken","setUlb"]);
    Route::post('lock-unlock/notice', 'lockUnlockUlbNotice')->middleware(['auth:sanctum',"expireBearerToken","setUlb"]);
    Route::post('list/notice', 'getNoticeList')->middleware(['auth:sanctum',"expireBearerToken","setUlb"]);
    Route::post('published/notice', 'getNoticeList');
});



Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::match(["get","post"],"switch/ulb",function(){
        return response()->json([
            'status' => true,
            'authenticated' => auth()->check()
        ]); 
    });
    
    #========citizen===================
    Route::prefix("/citizen")->group(function(){
        Route::controller(CitizenController::class)->group(function(){
            Route::post('register', 'registerOtp')->withoutMiddleware("auth:sanctum");
            Route::post('verifyOtp-register', 'verifyOtpAndRegister')->withoutMiddleware("auth:sanctum");
            Route::post('login', 'loginAuthOtp')->withoutMiddleware("auth:sanctum");
            Route::post('login-otp', 'citizenLoginSendOtp')->withoutMiddleware("auth:sanctum");
            Route::post('logout', 'logout');
            Route::post("profile","profile");
            Route::post("edit-profile","updateLoginCitizenProfile");
            Route::post("dashboard","citizenDashBoard");
            Route::post("app-list","citizenApplications");
        });        
        // SOCIAL AUTHENTICATION
        Route::controller(SocialAuthController::class)->group(function(){
            Route::post("get-client-id","getClintId")->withoutMiddleware("auth:sanctum");
            Route::post("google-login","handleGoogleLogin")->withoutMiddleware("auth:sanctum");
        });

        // citizen Property
        Route::controller(CitizenPropertyController::class)->group(function(){
            Route::post("property/search","searchHoldingWithMobile");
            Route::post("saf/search","searchSafWithMobile");
        });

    });
});

Route::middleware(['auth:sanctum',"expireBearerToken","setUlb"])->group(function () {
    Route::post('/heartbeat', function () {  // Heartbeat Api
        return response()->json([
            'status' => true,
            'authenticated' => auth()->check()
        ]);
    });

    #=============ulb=================
    Route::controller(UlbController::class)->group(function(){
        Route::post('ulb/show/{id}', "show")->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
        Route::post('ulb/list', "index")->withoutMiddleware(['auth:sanctum',"expireBearerToken","setUlb"]);
    });
    #========user======================
    Route::apiResource('user', UserController::class);
    Route::controller(UserController::class)->group(function () {
        Route::post('user/{id}', "update");
        Route::post('login', 'loginAuth')->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post('logout', 'logout');
        Route::post("login-users","loginUsers");
        Route::post("user-profile","profile");
        Route::post("edit-login-user/{id}","updateLoginUserProfile");
        Route::post("login-user-change-pass","changePass");
        Route::post('user-login-sendOtp', 'userLoginSendOtp')->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post('user-login-verifyOtp', 'userLoginVerifyOtp')->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post('user-hashPassword', 'hashPassword')->withoutMiddleware(["auth:sanctum","setUlb"]);
        Route::post("get-user-ward-map","getUserWardMap");
        Route::post("user-ward-map","userWardMap");
        Route::post("get-user-role-map","getUserRoleMap");
        Route::post("user-role-map","userRoleMap");
        Route::get("get-report-to","reportingList");
        Route::post("user-lock-unlock/{id}","userLockUnlock");
        Route::post("user-reset-password/{id}","resetPassword");
        
        Route::post("published/officer","getOfficerList")->withoutMiddleware(["auth:sanctum"]);
        Route::post("officer/list","getOfficerList");        
        Route::post("officer/add","addOfficer");        
        Route::post("officer/edit","editOfficer");
        Route::post("officer/lock-unlock","lockUnlockUlbNotice");
        Route::post("officer/dtl","dtlUlbOfficer");

        Route::match(["get","post"],"cache-clear","clearAllRedisData")->withoutMiddleware(["auth:sanctum","setUlb"]);
    });

    

    #======ward=======================
    Route::apiResource('ward', WardController::class);
    Route::controller(WardController::class)->group(function(){
        Route::post("ulb-ward-list","getUlbWard");
    });

    #=======role======================
    Route::resource("role",RoleController::class);
    Route::controller(RoleController::class)->group(function(){
        Route::post("role-user-list","getUserListByRole");
    });

    #=======menu=====================
    Route::controller(MenuController::class)->group(function(){
        Route::post("menu-add","store");
        Route::post("menu-list","getMenuList");
        Route::post("sub-menu-list","getSubMenuList");
        Route::post("menu-detail","showMenu");
        Route::post("menu-edit","editMenu");
        Route::post("menu-lock-unlock","lockUnlockMenu");
        Route::post("menu-user-exclude-include-list","getUserIncludeExcludeList");
        Route::post("menu-user-include-add","userMenuInclude");
        Route::post("menu-user-include-edit","userMenuIncludeEdit");
        Route::post("menu-user-exclude-add","userMenuExclude");
        Route::post("menu-user-exclude-edit","userMenuExcludeEdit");

        #========mobile menu=============

        Route::post("menu-add-mobile","storeMobile");
        Route::post("menu-list-mobile","getMobileMenuList");
        Route::post("sub-menu-list-mobile","getMobileSubMenuList");
        Route::post("menu-detail-mobile","showMobileMenu");
        Route::post("menu-edit-mobile","editMobileMenu");
        Route::post("menu-lock-unlock-mobile","lockUnlockMobileMenu");        
        Route::post("menu-user-exclude-include-list-mobile","getMobileUserIncludeExcludeList");
        Route::post("menu-user-include-add-mobile","userMobileMenuInclude");
        Route::post("menu-user-include-edit-mobile","userMobileMenuIncludeEdit");
        Route::post("menu-user-exclude-add-mobile","userMobileMenuExclude");
        Route::post("menu-user-exclude-edit-mobile","userMobileMenuExcludeEdit");
    });

    #======workflow==================
    Route::controller(WorkflowController::class)->group(function(){
        Route::post("module/list","moduleList");
        Route::post("module/add","addModule");
        Route::post("module/dtl","moduleDtl");
        Route::post("module/edit","editModule");
        Route::post("module/lock-unlock","activeDeactivateModule");
        Route::post("get-workflow-info","getWorkFlowInfo");
        Route::post("get-workflow-permission","getPermissionOnWorkFlow");
        Route::post("workflow-list","wfMasterList");
        Route::post("workflow-dtl","getWfMasterDtl");
        Route::post("workflow-add","addWfRoleMap");
        Route::post("workflow-edit","editWfRoleMap");
        Route::post("workflow-lock-unlock","activeDeactivateWorkflow");
    });

    #=======Logs=====================
    Route::controller(LogController::class)->group(function(){
        Route::post("log/list","getAppChangesLogsToken");
    });
    #=======RoleModulePermission======
    Route::controller(RoleModulePermissionController::class)->group(function(){
        Route::post("role-permission/list","index");
        Route::post("role-permission/dtl","permissionDtl");
        Route::post("role-permission/add","store");
        Route::post("role-permission/edit","edit");
        Route::post("role-permission/lock-unlock","lockUnlockPermission");
        Route::post("module/list","getModuleList");
    });

    Route::controller(QueryEditedController::class)->group(function(){
        Route::prefix("editor")->group(function(){
            Route::post("get-db","getDbList");
            Route::post("get-table","getTableList");
            Route::post("execute","QueryExecute");
            Route::post("backup-download","downloadBackup");
        });
    });
});