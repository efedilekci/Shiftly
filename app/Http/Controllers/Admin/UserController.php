<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/users/index', [
            'users' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'created_at'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'created_at' => $user->created_at?->toDateString(),
                ]),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function show(User $user): Response
    {
        $entries = $user->hourEntries()
            ->orderByDesc('work_date')
            ->orderByDesc('start_time')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'created_at' => $user->created_at?->toDateString(),
            ],
            'stats' => [
                'banen_count' => $user->banen()->count(),
                'entry_count' => $entries->count(),
                'total_minutes' => (int) $entries->sum('duration_minutes'),
                'total_earnings_cents' => (int) $entries->sum(fn (HourEntry $entry) => $entry->earningsCents()),
            ],
            'banen' => $user->banen()
                ->orderBy('name')
                ->get(['id', 'name', 'hourly_wage'])
                ->map(fn ($baan) => [
                    'id' => $baan->id,
                    'name' => $baan->name,
                    'hourly_wage' => $baan->hourly_wage,
                ]),
            'recent_entries' => $entries
                ->take(5)
                ->map(fn (HourEntry $entry) => [
                    'id' => $entry->id,
                    'baan_name' => $entry->baan_name,
                    'work_date' => $entry->work_date->format('Y-m-d'),
                    'start_time' => substr($entry->start_time, 0, 5),
                    'end_time' => substr($entry->end_time, 0, 5),
                    'duration_minutes' => $entry->duration_minutes,
                    'earnings_cents' => $entry->earningsCents(),
                    'note' => $entry->note,
                ])
                ->values(),
        ]);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        $user->role = $request->enum('role', Role::class);
        $user->save();

        return to_route('admin.users.index')->with('status', 'Rol bijgewerkt.');
    }
}
