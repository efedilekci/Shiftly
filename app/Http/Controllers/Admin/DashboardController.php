<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\HourEntry;
use App\Models\RunningClock;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $monthEntries = HourEntry::query()
            ->whereBetween('work_date', [$monthStart, $monthEnd])
            ->get(['duration_minutes', 'hourly_wage']);

        $recentEntries = HourEntry::query()
            ->with('user:id,name')
            ->orderByDesc('work_date')
            ->orderByDesc('start_time')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (HourEntry $entry) => [
                'id' => $entry->id,
                'user_id' => $entry->user_id,
                'user_name' => $entry->user?->name ?? 'Onbekend',
                'baan_name' => $entry->baan_name,
                'work_date' => $entry->work_date->format('Y-m-d'),
                'start_time' => substr((string) $entry->start_time, 0, 5),
                'end_time' => substr((string) $entry->end_time, 0, 5),
                'duration_minutes' => $entry->duration_minutes,
                'earnings_cents' => $entry->earningsCents(),
            ])
            ->values();

        return Inertia::render('admin/dashboard', [
            'month' => now()->format('Y-m'),
            'stats' => [
                'users_count' => User::query()->count(),
                'companies_count' => Company::query()->count(),
                'month_entry_count' => $monthEntries->count(),
                'month_minutes' => (int) $monthEntries->sum('duration_minutes'),
                'month_earnings_cents' => (int) $monthEntries->sum(fn (HourEntry $entry) => $entry->earningsCents()),
                'active_clocks_count' => RunningClock::query()->count(),
            ],
            'recent_entries' => $recentEntries,
        ]);
    }
}
