<?php

namespace App\Http\Controllers;

use App\Enums\HourEntryApprovalStatus;
use App\Http\Requests\StoreHourEntryRequest;
use App\Http\Requests\UpdateHourEntryRequest;
use App\Models\Company;
use App\Models\HourEntry;
use App\Support\HourEntryInboxNotifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HourEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = $request->user()->hourEntries()->orderByDesc('work_date')->orderByDesc('start_time')->orderByDesc('id')
            ->get();

        $editEntryId = $request->integer('edit') ?: null;
        if ($editEntryId !== null && ! $entries->contains('id', $editEntryId)) {
            $editEntryId = null;
        }

        return Inertia::render('uren/index', [
            'entries' => $entries->map(fn (HourEntry $entry) => [
                'id' => $entry->id,
                'baan_id' => $entry->baan_id,
                'baan_name' => $entry->baan_name,
                'work_date' => $entry->work_date->format('Y-m-d'),
                'start_time' => substr($entry->start_time, 0, 5),
                'end_time' => substr($entry->end_time, 0, 5),
                'break_minutes' => $entry->break_minutes,
                'duration_minutes' => $entry->duration_minutes,
                'earnings_cents' => $entry->earningsCents(),
                'note' => $entry->note,
                'approval_status' => $entry->approval_status->value,
                'approval_status_label' => $entry->approval_status->label(),
                'is_company_entry' => $entry->company_id !== null,
            ]),
            'editEntryId' => $editEntryId,
            'rejectedCompanyHoursCount' => $entries
                ->filter(fn (HourEntry $entry) => $entry->company_id !== null && $entry->approval_status === HourEntryApprovalStatus::Rejected)
                ->count(),
            'banen' => $request->user()->banen()->orderBy('name')->get(['id', 'name', 'hourly_wage']),
            'today' => now()->toDateString(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(StoreHourEntryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $baan = $request->user()->banen()->findOrFail($data['baan_id']);

        $company = $baan->company_id ? Company::query()->find($baan->company_id) : null;

        $entry = $request->user()->hourEntries()->create([
            ...$data,
            'company_id' => $baan->company_id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'duration_minutes' => HourEntry::grossMinutes($data['start_time'], $data['end_time']) - (int) $data['break_minutes'],
            'approval_status' => HourEntry::approvalStatusForCompany($company),
        ]);

        HourEntryInboxNotifier::notifyApproversOfPending($entry);

        return to_route('uren.index')->with('status', 'Uren toegevoegd.');
    }

    public function update(UpdateHourEntryRequest $request, HourEntry $hourEntry): RedirectResponse
    {
        $data = $request->validated();
        $baanId = isset($data['baan_id']) ? (int) $data['baan_id'] : null;
        $data['baan_id'] = $baanId;
        $wasRejected = $hourEntry->approval_status === HourEntryApprovalStatus::Rejected;

        if ($baanId !== $hourEntry->baan_id) {
            $baan = $request->user()->banen()->findOrFail($baanId);
            $data['baan_name'] = $baan->name;
            $data['hourly_wage'] = $baan->hourly_wage;
            $data['company_id'] = $baan->company_id;
        }

        $companyId = $data['company_id'] ?? $hourEntry->company_id;
        $company = $companyId ? Company::query()->find($companyId) : null;
        $data['approval_status'] = HourEntry::approvalStatusForCompany($company);

        $hourEntry->update([
            ...$data,
            'duration_minutes' => HourEntry::grossMinutes($data['start_time'], $data['end_time']) - (int) $data['break_minutes'],
        ]);

        $resubmitted = $wasRejected && $data['approval_status'] === HourEntryApprovalStatus::Pending;

        if ($resubmitted) {
            HourEntryInboxNotifier::notifyApproversOfPending($hourEntry->fresh(), true);
        }

        return to_route('uren.index')->with(
            'status',
            $resubmitted ? 'Uren opnieuw ingediend ter goedkeuring.' : 'Uren bijgewerkt.',
        );
    }

    public function destroy(Request $request, HourEntry $hourEntry): RedirectResponse
    {
        abort_unless($hourEntry->user_id === $request->user()->id, 403);

        $hourEntry->delete();

        return to_route('uren.index')->with('status', 'Uren verwijderd.');
    }
}
