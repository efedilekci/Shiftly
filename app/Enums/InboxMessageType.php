<?php

namespace App\Enums;

enum InboxMessageType: string
{
    case HoursApproved = 'hours_approved';
    case HoursRejected = 'hours_rejected';
    case HoursPendingReview = 'hours_pending_review';
    case HoursResubmitted = 'hours_resubmitted';
}
