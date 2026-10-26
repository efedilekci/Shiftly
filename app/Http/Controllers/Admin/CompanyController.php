<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/companies/index', [
            'companies' => Company::query()
                ->with('owner:id,name,email')
                ->withCount('members')
                ->orderBy('name')
                ->get()
                ->map(fn (Company $company) => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'slug' => $company->slug,
                    'members_count' => $company->members_count,
                    'hour_approval_mode' => $company->hour_approval_mode->value,
                    'hour_approval_mode_label' => $company->hour_approval_mode->label(),
                    'owner_id' => $company->owner_user_id,
                    'owner_name' => $company->owner?->name ?? 'Onbekend',
                    'owner_email' => $company->owner?->email,
                    'created_at' => $company->created_at?->toDateString(),
                ]),
        ]);
    }

    public function show(Company $company): Response
    {
        $company->load(['owner:id,name,email']);

        $members = $company->members()
            ->with('user:id,name,email')
            ->orderBy('role')
            ->get()
            ->sortBy(fn (CompanyMember $member) => $member->user?->name ?? '')
            ->values()
            ->map(fn (CompanyMember $member) => [
                'id' => $member->id,
                'user_id' => $member->user_id,
                'name' => $member->user?->name ?? 'Onbekend',
                'email' => $member->user?->email,
                'role' => $member->role->value,
                'role_label' => $member->role->label(),
            ]);

        $invitations = $company->invitations()
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CompanyInvitation $invitation) => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'role' => $invitation->role->value,
                'role_label' => $invitation->role->label(),
                'expires_at' => $invitation->expires_at?->toDateString(),
                'created_at' => $invitation->created_at?->toDateString(),
            ]);

        $recentEntries = HourEntry::query()
            ->where('company_id', $company->id)
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
                'approval_status' => $entry->approval_status->value,
                'approval_status_label' => $entry->approval_status->label(),
            ]);

        return Inertia::render('admin/companies/show', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'hour_approval_mode' => $company->hour_approval_mode->value,
                'hour_approval_mode_label' => $company->hour_approval_mode->label(),
                'created_at' => $company->created_at?->toDateString(),
                'members_count' => $members->count(),
                'pending_invitations_count' => $invitations->count(),
            ],
            'owner' => [
                'id' => $company->owner_user_id,
                'name' => $company->owner?->name ?? 'Onbekend',
                'email' => $company->owner?->email,
            ],
            'members' => $members,
            'invitations' => $invitations,
            'recent_entries' => $recentEntries,
        ]);
    }
}

