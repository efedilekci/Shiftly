<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HourEntry extends Model
{
    protected $fillable = [
        'baan_id', 'baan_name', 'hourly_wage', 'work_date',
        'start_time', 'end_time', 'break_minutes', 'duration_minutes', 'note',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'hourly_wage' => 'decimal:2',
            'break_minutes' => 'integer',
            'duration_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function baan(): BelongsTo
    {
        return $this->belongsTo(Baan::class);
    }

    public function earningsCents(): int
    {
        [$euros, $cents] = explode('.', $this->hourly_wage);
        $hourlyCents = (int) $euros * 100 + (int) $cents;

        // Round half a cent up without floating-point amounts.
        return intdiv($hourlyCents * $this->duration_minutes + 30, 60);
    }

    public static function grossMinutes(string $startTime, string $endTime): int
    {
        [$startHour, $startMinute] = array_map('intval', explode(':', $startTime));
        [$endHour, $endMinute] = array_map('intval', explode(':', $endTime));
        $minutes = ($endHour * 60 + $endMinute) - ($startHour * 60 + $startMinute);

        return $minutes < 0 ? $minutes + 1440 : $minutes;
    }
}
