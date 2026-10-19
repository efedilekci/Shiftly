<?php

use App\Http\Controllers\BaanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/banen', [BaanController::class, 'index'])->name('banen.index');
    Route::post('/banen', [BaanController::class, 'store'])->name('banen.store');
    Route::put('/banen/{baan}', [BaanController::class, 'update'])->name('banen.update');
    Route::delete('/banen/{baan}', [BaanController::class, 'destroy'])->name('banen.destroy');

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
