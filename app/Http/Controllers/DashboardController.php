<?php

namespace App\Http\Controllers;

use App\Models\HourEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $entries = $request->user()->hourEntries()
            ->whereBetween('work_date', [$monthStart, $monthEnd])
            ->get();

        return Inertia::render('dashboard', [
            'month' => now()->format('Y-m'),
            'month_entry_count' => $entries->count(),
            'month_minutes' => (int) $entries->sum('duration_minutes'),
            'month_earnings_cents' => (int) $entries->sum(fn (HourEntry $entry) => $entry->earningsCents()),
        ]);
    }
}
