<?php
use App\Http\Controllers\ShopRent\MasterController;
use Illuminate\Support\Facades\Route;

Route::post('/test', [MasterController::class, 'index']);