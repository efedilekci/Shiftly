<?php

namespace App\Support;

use App\Enums\HourEntryApprovalStatus;
use App\Enums\InboxMessageType;
use App\Models\HourEntry;
use App\Models\InboxMessage;
use App\Models\User;

class HourEntryInboxNotifier
{
    public static function notifyApproversOfPending(HourEntry $entry, bool $resubmitted = false): void
    {
        $entry->loadMissing(['user', 'company']);

        $company = $entry->company;
        if ($company === null || $entry->approval_status !== HourEntryApprovalStatus::Pending) {
            return;
        }

        $employeeName = $entry->user?->name ?? 'Een medewerker';
        $date = $entry->work_date?->format('d-m-Y') ?? '-';
        $times = substr((string) $entry->start_time, 0, 5).'–'.substr((string) $entry->end_time, 0, 5);

        $type = $resubmitted
            ? InboxMessageType::HoursResubmitted
            : InboxMessageType::HoursPendingReview;

        $title = $resubmitted
            ? 'Uren opnieuw ingediend'
            : 'Nieuwe uren ter goedkeuring';

        $body = $resubmitted
            ? "{$employeeName} heeft aangepaste uren opnieuw ingediend voor {$company->name} op {$date} ({$times})."
            : "{$employeeName} heeft uren ingediend voor {$company->name} op {$date} ({$times}).";

        $company->notifyHourApprovers(
            $type,
            $title,
            $body,
            route('company.hours.index', $company, absolute: false),
            'Bekijk uren',
            [
                'hour_entry_id' => $entry->id,
                'company_id' => $company->id,
            ],
            $entry->user_id,
        );
    }

    public static function notifyEmployeeOfDecision(
        HourEntry $entry,
        HourEntryApprovalStatus $status,
        ?User $reviewer = null,
        ?string $reason = null,
    ): void {
        $entry->loadMissing(['user', 'company']);

        $user = $entry->user;
        $company = $entry->company;

        if ($user === null || $company === null) {
            return;
        }

        $date = $entry->work_date?->format('d-m-Y') ?? '-';
        $times = substr((string) $entry->start_time, 0, 5).'–'.substr((string) $entry->end_time, 0, 5);
        $reviewerName = $reviewer?->name;

        if ($status === HourEntryApprovalStatus::Approved) {
            $body = $reviewerName
                ? "{$reviewerName} heeft je uren voor {$company->name} op {$date} ({$times}) goedgekeurd."
                : "Je uren voor {$company->name} op {$date} ({$times}) zijn goedgekeurd.";

            InboxMessage::notify(
                $user,
                InboxMessageType::HoursApproved,
                'Uren goedgekeurd',
                $body,
                route('uren.index', absolute: false),
                'Bekijk uren',
                [
                    'hour_entry_id' => $entry->id,
                    'company_id' => $company->id,
                ],
            );

            return;
        }

        if ($status === HourEntryApprovalStatus::Rejected) {
            $body = $reviewerName
                ? "{$reviewerName} heeft je uren voor {$company->name} op {$date} ({$times}) afgewezen."
                : "Je uren voor {$company->name} op {$date} ({$times}) zijn afgewezen.";

            if (filled($reason)) {
                $body .= ' Reden: '.$reason;
            } else {
                $body .= ' Pas je uren aan en dien ze opnieuw in.';
            }

            InboxMessage::notify(
                $user,
                InboxMessageType::HoursRejected,
                'Uren afgewezen',
                $body,
                route('uren.index', ['edit' => $entry->id], absolute: false),
                'Uren aanpassen',
                [
                    'hour_entry_id' => $entry->id,
                    'company_id' => $company->id,
                    'reason' => $reason,
                ],
            );
        }
    }
}
