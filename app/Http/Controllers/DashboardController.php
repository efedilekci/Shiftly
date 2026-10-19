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

        $monthBreakdown = $entries
            ->groupBy('baan_name')
            ->map(fn ($group, string $baanName) => [
                'baan_name' => $baanName,
                'entry_count' => $group->count(),
                'minutes' => (int) $group->sum('duration_minutes'),
                'earnings_cents' => (int) $group->sum(fn (HourEntry $entry) => $entry->earningsCents()),
            ])
            ->sortByDesc('earnings_cents')
            ->values()
            ->all();

        return Inertia::render('dashboard', [
            'month' => now()->format('Y-m'),
            'month_entry_count' => $entries->count(),
            'month_minutes' => (int) $entries->sum('duration_minutes'),
            'month_earnings_cents' => (int) $entries->sum(fn (HourEntry $entry) => $entry->earningsCents()),
            'month_breakdown' => $monthBreakdown,
        ]);
    }
}
