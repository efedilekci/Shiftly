<?php

namespace App\Http\Middleware;

use App\Enums\HourEntryApprovalStatus;
use App\Models\CompanyInvitation;
use App\Models\HourEntry;
use App\Models\InboxMessage;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $user = $request->user();
        $clock = $user?->runningClock()->first();

        $companies = $user
            ? $user->companyMemberships()
                ->with('company:id,name,slug,hour_approval_mode')
                ->get()
                ->map(function ($membership) {
                    $company = $membership->company;
                    $canApproveHours = $company->actorCanApproveHours($membership->role);

                    return [
                        'id' => $company->id,
                        'name' => $company->name,
                        'slug' => $company->slug,
                        'role' => $membership->role->value,
                        'role_label' => $membership->role->label(),
                        'can_access_company_area' => $membership->role->canViewTeamHours(),
                        'can_manage_settings' => $membership->role->canManageMembers(),
                        'can_approve_hours' => $canApproveHours,
                        'pending_hour_approvals_count' => $canApproveHours
                            ? HourEntry::query()
                                ->where('company_id', $company->id)
                                ->where('approval_status', HourEntryApprovalStatus::Pending)
                                ->count()
                            : 0,
                    ];
                })
                ->filter(fn (array $company) => $company['can_access_company_area'])
                ->values()
            : collect();

        $pendingInvitationCount = $user
            ? CompanyInvitation::query()
                ->where('email', $user->email)
                ->whereNull('accepted_at')
                ->where('expires_at', '>', now())
                ->count()
            : 0;

        $unreadInboxMessageCount = $user
            ? InboxMessage::query()
                ->where('user_id', $user->id)
                ->whereNull('read_at')
                ->count()
            : 0;

        $pendingInboxCount = $pendingInvitationCount + $unreadInboxMessageCount;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
            ],
            'companies' => $companies,
            'pendingInvitationCount' => $pendingInboxCount,
            'pendingInboxCount' => $pendingInboxCount,
            'pendingHourApprovalsCount' => $companies->sum('pending_hour_approvals_count'),
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
            'activeClock' => $clock ? [
                'baan_name' => $clock->baan_name,
                'started_at' => $clock->started_at,
            ] : null,
            'openClockReminderAfterMinutes' => $user?->open_clock_reminder_after_minutes ?? 0,
            'serverNow' => now()->timestamp,
            'timezone' => config('app.timezone'),
        ];
    }
}
