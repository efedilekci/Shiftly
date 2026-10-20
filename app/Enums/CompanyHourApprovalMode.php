<?php

namespace App\Enums;

enum CompanyHourApprovalMode: string
{
    case Auto = 'auto';
    case TeamLeader = 'team_leader';
    case Owner = 'owner';

    public function label(): string
    {
        return match ($this) {
            self::Auto => 'Direct goedgekeurd',
            self::TeamLeader => 'Goedkeuring door teamleider of eigenaar',
            self::Owner => 'Goedkeuring alleen door eigenaar',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Auto => 'Nieuwe bedrijfsuren tellen meteen mee.',
            self::TeamLeader => 'Uren blijven in afwachting tot een teamleider of eigenaar ze goedkeurt.',
            self::Owner => 'Uren blijven in afwachting tot de eigenaar ze goedkeurt.',
        };
    }

    public function requiresApproval(): bool
    {
        return $this !== self::Auto;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
