<?php

namespace App\Http\Controllers;

use App\Enums\InboxMessageType;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\InboxMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $email = $user->email;

        $invitations = CompanyInvitation::query()
            ->with(['company:id,name,slug', 'inviter:id,name'])
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CompanyInvitation $invitation) => [
                'kind' => 'invitation',
                'id' => $invitation->id,
                'title' => 'Uitnodiging voor '.$invitation->company?->name,
                'body' => ($invitation->inviter?->name ?? 'Iemand').' nodigde je uit als '.$invitation->role->label().'.',
                'company_name' => $invitation->company?->name,
                'company_slug' => $invitation->company?->slug,
                'role' => $invitation->role->value,
                'role_label' => $invitation->role->label(),
                'invited_by' => $invitation->inviter?->name,
                'expires_at' => $invitation->expires_at?->toIso8601String(),
                'is_expired' => $invitation->isExpired(),
                'is_pending' => $invitation->isPending(),
                'created_at' => $invitation->created_at?->toIso8601String(),
                'is_unread' => true,
            ]);

        $messages = InboxMessage::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(function (InboxMessage $message) {
                $actionUrl = $message->action_url;
                $hourEntryId = data_get($message->meta, 'hour_entry_id');

                if (
                    $message->type === InboxMessageType::HoursRejected
                    && filled($hourEntryId)
                ) {
                    $actionUrl = route('uren.index', ['edit' => $hourEntryId], absolute: false);
                }

                return [
                    'kind' => 'message',
                    'id' => $message->id,
                    'type' => $message->type->value,
                    'title' => $message->title,
                    'body' => $message->body,
                    'action_url' => $actionUrl,
                    'action_label' => $message->action_label,
                    'created_at' => $message->created_at?->toIso8601String(),
                    'is_unread' => $message->isUnread(),
                ];
            });

        $items = $invitations
            ->concat($messages)
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('inbox/index', [
            'items' => $items,
            'invitations' => $invitations->values(),
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

    public function markRead(Request $request, InboxMessage $message): RedirectResponse
    {
        abort_unless($message->user_id === $request->user()->id, 403);

        $message->markAsRead();

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        InboxMessage::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('status', 'Alle meldingen gemarkeerd als gelezen.');
    }
}
