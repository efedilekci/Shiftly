<?php

namespace App\Http\Middleware;

use App\Models\CompanyInvitation;
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
                ->with('company:id,name,slug')
                ->get()
                ->map(fn ($membership) => [
                    'id' => $membership->company->id,
                    'name' => $membership->company->name,
                    'slug' => $membership->company->slug,
                    'role' => $membership->role->value,
                    'role_label' => $membership->role->label(),
                    'can_access_company_area' => $membership->role->canViewTeamHours(),
                    'can_manage_settings' => $membership->role->canManageMembers(),
                ])
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

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
            ],
            'companies' => $companies,
            'pendingInvitationCount' => $pendingInvitationCount,
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
