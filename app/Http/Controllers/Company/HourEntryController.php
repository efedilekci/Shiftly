<?php

namespace App\Http\Controllers\Company;

use App\Enums\HourEntryApprovalStatus;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HourEntryController extends Controller
{
    public function index(Request $request, Company $company): Response
    {
        /** @var CompanyMember $membership */
        $membership = $request->attributes->get('companyMember');

        $canApprove = $company->actorCanApproveHours($membership->role);
        $statusFilter = $request->string('status')->toString();

        if (! in_array($statusFilter, ['pending', 'approved', 'rejected', 'all'], true)) {
            $statusFilter = $canApprove ? 'pending' : 'all';
        }

        $entries = HourEntry::query()
            ->with('user:id,name,email')
            ->where('company_id', $company->id)
            ->when($statusFilter !== 'all', fn ($query) => $query->where('approval_status', $statusFilter))
            ->orderByDesc('work_date')
            ->orderByDesc('start_time')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(fn (HourEntry $entry) => [
                'id' => $entry->id,
                'user_name' => $entry->user?->name ?? 'Onbekend',
                'user_email' => $entry->user?->email,
                'baan_name' => $entry->baan_name,
                'work_date' => $entry->work_date?->format('Y-m-d'),
                'start_time' => substr((string) $entry->start_time, 0, 5),
                'end_time' => substr((string) $entry->end_time, 0, 5),
                'break_minutes' => $entry->break_minutes,
                'duration_minutes' => $entry->duration_minutes,
                'earnings_cents' => $entry->earningsCents(),
                'note' => $entry->note,
                'approval_status' => $entry->approval_status->value,
                'approval_status_label' => $entry->approval_status->label(),
                'can_review' => $canApprove && $entry->approval_status === HourEntryApprovalStatus::Pending,
            ]);

        $pendingCount = HourEntry::query()
            ->where('company_id', $company->id)
            ->where('approval_status', HourEntryApprovalStatus::Pending)
            ->count();

        return Inertia::render('company/hours/index', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'hour_approval_mode' => $company->hour_approval_mode->value,
                'hour_approval_mode_label' => $company->hour_approval_mode->label(),
            ],
            'membership' => [
                'role' => $membership->role->value,
                'can_approve_hours' => $canApprove,
            ],
            'filters' => [
                'status' => $statusFilter,
            ],
            'pendingCount' => $pendingCount,
            'entries' => $entries,
        ]);
    }

    public function approve(Request $request, Company $company, HourEntry $hourEntry): RedirectResponse
    {
        $this->authorizeReview($request, $company, $hourEntry);

        $hourEntry->forceFill([
            'approval_status' => HourEntryApprovalStatus::Approved,
        ])->save();

        return back()->with('status', 'Uren goedgekeurd.');
    }

    public function reject(Request $request, Company $company, HourEntry $hourEntry): RedirectResponse
    {
        $this->authorizeReview($request, $company, $hourEntry);

        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $hourEntry->forceFill([
            'approval_status' => HourEntryApprovalStatus::Rejected,
        ])->save();

        return back()->with('status', 'Uren afgewezen.');
    }

    private function authorizeReview(Request $request, Company $company, HourEntry $hourEntry): void
    {
        abort_unless($hourEntry->company_id === $company->id, 404);

        /** @var CompanyMember $membership */
        $membership = $request->attributes->get('companyMember');

        abort_unless($company->actorCanApproveHours($membership->role), 403);
        abort_unless($hourEntry->approval_status === HourEntryApprovalStatus::Pending, 403);
    }
}
