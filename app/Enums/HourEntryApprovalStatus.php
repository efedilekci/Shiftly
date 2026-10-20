<?php

namespace App\Enums;

enum HourEntryApprovalStatus: string
{
    case Approved = 'approved';
    case Pending = 'pending';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Approved => 'Goedgekeurd',
            self::Pending => 'In afwachting',
            self::Rejected => 'Afgewezen',
        };
    }
}
