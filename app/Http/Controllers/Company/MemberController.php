<?php

namespace App\Http\Controllers\Company;

use App\Enums\CompanyMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Company\UpdateCompanyMemberRoleRequest;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use Illuminate\Http\RedirectResponse;
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

        $invitations = $membership->role->canManageMembers()
            ? $company->invitations()
                ->whereNull('accepted_at')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($invitation) => [
                    'id' => $invitation->id,
                    'email' => $invitation->email,
                    'role' => $invitation->role->value,
                    'role_label' => $invitation->role->label(),
                    'expires_at' => $invitation->expires_at?->toIso8601String(),
                    'is_expired' => $invitation->isExpired(),
                ])
            : [];

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
            'invitations' => $invitations,
            'assignableRoles' => collect(CompanyMemberRole::assignableValues())
                ->map(fn (string $value) => [
                    'value' => $value,
                    'label' => CompanyMemberRole::from($value)->label(),
                ])
                ->values(),
        ]);
    }

    public function updateRole(UpdateCompanyMemberRoleRequest $request, Company $company, CompanyMember $member): RedirectResponse
    {
        abort_unless($member->company_id === $company->id, 404);

        $member->forceFill([
            'role' => $request->validated('role'),
        ])->save();

        return back()->with('status', 'Rol bijgewerkt.');
    }

    public function destroy(Request $request, Company $company, CompanyMember $member): RedirectResponse
    {
        abort_unless($member->company_id === $company->id, 404);

        if ($member->role === CompanyMemberRole::Owner) {
            return back()->withErrors(['member' => 'De eigenaar kan niet worden verwijderd.']);
        }

        if ($member->user_id === $request->user()->id) {
            return back()->withErrors(['member' => 'Je kunt jezelf niet verwijderen.']);
        }

        $member->delete();

        return back()->with('status', 'Medewerker verwijderd uit het bedrijf.');
    }
}
