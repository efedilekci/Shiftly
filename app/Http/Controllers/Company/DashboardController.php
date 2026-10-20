<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, Company $company): Response
    {
        /** @var CompanyMember $membership */
        $membership = $request->attributes->get('companyMember');

        $memberUserIds = $company->members()->pluck('user_id');

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $monthEntries = HourEntry::query()
            ->whereIn('user_id', $memberUserIds)
            ->whereBetween('work_date', [$monthStart, $monthEnd])
            ->get(['duration_minutes', 'hourly_wage']);

        $recentEntries = $membership->role->canViewTeamHours()
            ? HourEntry::query()
                ->with('user:id,name')
                ->whereIn('user_id', $memberUserIds)
                ->orderByDesc('work_date')
                ->orderByDesc('start_time')
                ->limit(8)
                ->get()
                ->map(fn (HourEntry $entry) => [
                    'id' => $entry->id,
                    'user_name' => $entry->user?->name ?? 'Onbekend',
                    'baan_name' => $entry->baan_name,
                    'work_date' => $entry->work_date?->format('Y-m-d'),
                    'start_time' => substr((string) $entry->start_time, 0, 5),
                    'end_time' => substr((string) $entry->end_time, 0, 5),
                    'duration_minutes' => $entry->duration_minutes,
                    'earnings_cents' => $entry->earningsCents(),
                ])
                ->values()
            : collect();

        return Inertia::render('company/dashboard', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
            ],
            'membership' => [
                'role' => $membership->role->value,
                'role_label' => $membership->role->label(),
                'can_manage_members' => $membership->role->canManageMembers(),
                'can_view_hours' => $membership->role->canViewTeamHours(),
            ],
            'stats' => [
                'members' => $company->members()->count(),
                'month_minutes' => (int) $monthEntries->sum('duration_minutes'),
                'month_earnings_cents' => (int) $monthEntries->sum(fn (HourEntry $entry) => $entry->earningsCents()),
            ],
            'recentEntries' => $recentEntries,
        ]);
    }
}
