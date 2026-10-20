<?php

namespace App\Http\Controllers;

use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request): Response
    {
        $email = $request->user()->email;

        $invitations = CompanyInvitation::query()
            ->with(['company:id,name,slug', 'inviter:id,name'])
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CompanyInvitation $invitation) => [
                'id' => $invitation->id,
                'company_name' => $invitation->company?->name,
                'company_slug' => $invitation->company?->slug,
                'role' => $invitation->role->value,
                'role_label' => $invitation->role->label(),
                'invited_by' => $invitation->inviter?->name,
                'expires_at' => $invitation->expires_at?->toIso8601String(),
                'is_expired' => $invitation->isExpired(),
                'is_pending' => $invitation->isPending(),
            ]);

        return Inertia::render('inbox/index', [
            'invitations' => $invitations,
        ]);
    }

    public function accept(Request $request, CompanyInvitation $invitation): RedirectResponse
    {
        abort_unless(
            strtolower($invitation->email) === strtolower($request->user()->email),
            403,
        );

        if (! $invitation->isPending()) {
            return redirect()
                ->route('inbox.index')
                ->withErrors(['invitation' => 'Deze uitnodiging is niet meer geldig.']);
        }

        DB::transaction(function () use ($request, $invitation): void {
            $invitation->loadMissing('company');

            CompanyMember::query()->firstOrCreate(
                [
                    'company_id' => $invitation->company_id,
                    'user_id' => $request->user()->id,
                ],
                [
                    'role' => $invitation->role,
                ],
            );

            $invitation->company->ensureBaanFor($request->user());

            $invitation->forceFill([
                'accepted_at' => now(),
            ])->save();
        });

        $invitation->loadMissing('company');

        $status = 'Je bent nu lid van '.$invitation->company->name.'.';

        if ($invitation->role->canViewTeamHours()) {
            return redirect()
                ->route('company.dashboard', $invitation->company)
                ->with('status', $status);
        }

        return redirect()
            ->route('dashboard')
            ->with('status', $status);
    }
}
