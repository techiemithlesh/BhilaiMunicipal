<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/logo/{path}', function ($path) {
    $fullPath = public_path($path);

    if (!file_exists($fullPath) || is_dir($fullPath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath);
    $response = Response::file($fullPath, ['Content-Type' => $mimeType]);

    return $response;
})->where('path', '.*\.(jpg|jpeg|png|gif|svg|pdf|css|js|woff2?|ttf|ico)$');

Route::match(["get","post"],'/documents/{path}', function($path){
    $disk ="documents_driver";
    $path = Storage::disk($disk)->path($path);
    if (!file_exists($path) || is_dir($path)) {
        abort(404);
    }

    $mime = mime_content_type($path);

    $response = Response::file($path, ['Content-Type' => $mime]);
    return $response;
})->where('path', '.*');