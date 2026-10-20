<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(Request $request, Company $company): Response
    {
        /** @var CompanyMember $membership */
        $membership = $request->attributes->get('companyMember');

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $members = $company->members()
            ->with('user:id,name,email')
            ->orderByRaw("CASE role WHEN 'owner' THEN 0 WHEN 'team_leader' THEN 1 ELSE 2 END")
            ->orderBy('created_at')
            ->get()
            ->map(function (CompanyMember $member) use ($monthStart, $monthEnd, $membership) {
                $minutes = $membership->role->canViewTeamHours()
                    ? (int) HourEntry::query()
                        ->where('user_id', $member->user_id)
                        ->whereBetween('work_date', [$monthStart, $monthEnd])
                        ->sum('duration_minutes')
                    : null;

                return [
                    'id' => $member->id,
                    'user_id' => $member->user_id,
                    'name' => $member->user?->name,
                    'email' => $member->user?->email,
                    'role' => $member->role->value,
                    'role_label' => $member->role->label(),
                    'month_minutes' => $minutes,
                ];
            });

        return Inertia::render('company/members/index', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
            ],
            'membership' => [
                'role' => $membership->role->value,
                'can_manage_members' => $membership->role->canManageMembers(),
                'can_view_hours' => $membership->role->canViewTeamHours(),
            ],
            'members' => $members,
        ]);
    }
}
