<?php

namespace App\Enums;

enum CompanyMemberRole: string
{
    case Owner = 'owner';
    case TeamLeader = 'team_leader';
    case Employee = 'employee';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Eigenaar',
            self::TeamLeader => 'Teamleider',
            self::Employee => 'Medewerker',
        };
    }

    public function canManageMembers(): bool
    {
        return $this === self::Owner;
    }

    public function canViewTeamHours(): bool
    {
        return $this === self::Owner || $this === self::TeamLeader;
    }

    /** @return list<string> */
    public static function assignableValues(): array
    {
        return [
            self::TeamLeader->value,
            self::Employee->value,
        ];
    }
}
