<?php

namespace App\Http\Controllers;

use App\Models\HourEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $selectedMonth = $this->resolveMonth($request->query('month'));
        $currentMonth = now()->startOfMonth();
        $monthStart = $selectedMonth->toDateString();
        $monthEnd = $selectedMonth->copy()->endOfMonth()->toDateString();

        $entries = $user->hourEntries()
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

        $recentEntries = $user->hourEntries()
            ->orderByDesc('work_date')
            ->orderByDesc('start_time')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (HourEntry $entry) => [
                'id' => $entry->id,
                'baan_name' => $entry->baan_name,
                'work_date' => $entry->work_date->format('Y-m-d'),
                'start_time' => substr($entry->start_time, 0, 5),
                'end_time' => substr($entry->end_time, 0, 5),
                'duration_minutes' => $entry->duration_minutes,
                'earnings_cents' => $entry->earningsCents(),
            ])
            ->all();

        $clock = $user->runningClock()->first();
        $monthKey = $selectedMonth->format('Y-m');

        return Inertia::render('dashboard', [
            'month' => $monthKey,
            'previous_month' => $selectedMonth->copy()->subMonthNoOverflow()->format('Y-m'),
            'next_month' => $selectedMonth->lt($currentMonth)
                ? $selectedMonth->copy()->addMonthNoOverflow()->format('Y-m')
                : null,
            'month_entry_count' => $entries->count(),
            'month_minutes' => (int) $entries->sum('duration_minutes'),
            'month_earnings_cents' => (int) $entries->sum(fn (HourEntry $entry) => $entry->earningsCents()),
            'month_breakdown' => $monthBreakdown,
            'hours_chart' => $this->hoursChart($user->hourEntries()),
            'recent_entries' => $recentEntries,
            'activeClock' => $clock ? ['baan_name' => $clock->baan_name, 'started_at' => $clock->started_at] : null,
            'banen' => $user->banen()->orderBy('name')->get(['id', 'name', 'hourly_wage']),
            'serverNow' => now()->timestamp,
            'timezone' => config('app.timezone'),
            'status' => $request->session()->get('status'),
        ]);
    }

    private function resolveMonth(mixed $month): Carbon
    {
        $current = now()->startOfMonth();

        if (! is_string($month) || ! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return $current->copy();
        }

        $selected = Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfMonth();

        return $selected->gt($current) ? $current->copy() : $selected;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Relations\HasMany<HourEntry, \App\Models\User>  $entries
     * @return list<array{month: string, minutes: int, hours: float, percent: int}>
     */
    private function hoursChart($entries): array
    {
        $chartStart = now()->subMonths(5)->startOfMonth()->toDateString();
        $chartEnd = now()->endOfMonth()->toDateString();

        /** @var Collection<string, int> $minutesByMonth */
        $minutesByMonth = $entries
            ->whereBetween('work_date', [$chartStart, $chartEnd])
            ->get(['work_date', 'duration_minutes'])
            ->groupBy(fn (HourEntry $entry) => $entry->work_date->format('Y-m'))
            ->map(fn (Collection $group) => (int) $group->sum('duration_minutes'));

        $points = collect(range(5, 0))->map(function (int $monthsAgo) use ($minutesByMonth) {
            $month = now()->subMonths($monthsAgo);
            $key = $month->format('Y-m');
            $minutes = $minutesByMonth->get($key, 0);

            return [
                'month' => $key,
                'minutes' => $minutes,
                'hours' => round($minutes / 60, 1),
            ];
        });

        $maxHours = max(1.0, (float) $points->max('hours'));

        return $points
            ->map(fn (array $point) => [
                ...$point,
                'percent' => (int) round(($point['hours'] / $maxHours) * 100),
            ])
            ->values()
            ->all();
    }
}
