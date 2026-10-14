<?php
use App\Http\Controllers\ShopRent\MasterController;
use App\Http\Controllers\ShopRent\ShopRentController;
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
    });
});