<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HourEntry;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class HourEntryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/uren/index', [
            'entries' => HourEntry::query()
                ->with(['user:id,name', 'company:id,name,slug'])
                ->orderByDesc('work_date')
                ->orderByDesc('start_time')
                ->orderByDesc('id')
                ->get()
                ->map(fn (HourEntry $entry) => [
                    'id' => $entry->id,
                    'user_id' => $entry->user_id,
                    'user_name' => $entry->user?->name ?? 'Onbekend',
                    'baan_name' => $entry->baan_name,
                    'company_id' => $entry->company_id,
                    'company_name' => $entry->company?->name,
                    'company_slug' => $entry->company?->slug,
                    'approval_status' => $entry->approval_status->value,
                    'approval_status_label' => $entry->approval_status->label(),
                    'work_date' => $entry->work_date->format('Y-m-d'),
                    'start_time' => substr((string) $entry->start_time, 0, 5),
                    'end_time' => substr((string) $entry->end_time, 0, 5),
                    'duration_minutes' => $entry->duration_minutes,
                    'earnings_cents' => $entry->earningsCents(),
                    'note' => $entry->note,
                ]),
            'users' => User::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                ]),
        ]);
    }
}
