<?php

use App\Http\Controllers\BaanController;
use App\Http\Controllers\ClockController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HourEntryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/klok', [ClockController::class, 'index'])->name('clock.index');
    Route::post('/klok/in', [ClockController::class, 'start'])->name('clock.start');
    Route::post('/klok/uit', [ClockController::class, 'stop'])->name('clock.stop');
    Route::delete('/klok', [ClockController::class, 'cancel'])->name('clock.cancel');

    Route::get('/uren', [HourEntryController::class, 'index'])->name('uren.index');
    Route::post('/uren', [HourEntryController::class, 'store'])->name('uren.store');
    Route::put('/uren/{hourEntry}', [HourEntryController::class, 'update'])->name('uren.update');
    Route::delete('/uren/{hourEntry}', [HourEntryController::class, 'destroy'])->name('uren.destroy');

    Route::get('/banen', [BaanController::class, 'index'])->name('banen.index');
    Route::post('/banen', [BaanController::class, 'store'])->name('banen.store');
    Route::put('/banen/{baan}', [BaanController::class, 'update'])->name('banen.update');
    Route::delete('/banen/{baan}', [BaanController::class, 'destroy'])->name('banen.destroy');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
