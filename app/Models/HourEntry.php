<?php

namespace App\Models;

use App\Enums\HourEntryApprovalStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HourEntry extends Model
{
    protected $fillable = [
        'user_id', 'baan_id', 'company_id', 'baan_name', 'hourly_wage', 'work_date',
        'start_time', 'end_time', 'break_minutes', 'duration_minutes', 'note', 'approval_status',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'hourly_wage' => 'decimal:2',
            'break_minutes' => 'integer',
            'duration_minutes' => 'integer',
            'company_id' => 'integer',
            'approval_status' => HourEntryApprovalStatus::class,
        ];
    }

    public static function approvalStatusForCompany(?Company $company): HourEntryApprovalStatus
    {
        if ($company === null) {
            return HourEntryApprovalStatus::Approved;
        }

        return $company->initialHourApprovalStatus();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function baan(): BelongsTo
    {
        return $this->belongsTo(Baan::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
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

    /**
     * Half-open interval [start, end) in app timezone unix seconds.
     *
     * @return array{0: int, 1: int}
     */
    public static function absoluteBounds(string $workDate, string $startTime, string $endTime): array
    {
        $timezone = config('app.timezone');
        $start = CarbonImmutable::createFromFormat('Y-m-d H:i', $workDate.' '.substr($startTime, 0, 5), $timezone);
        $end = CarbonImmutable::createFromFormat('Y-m-d H:i', $workDate.' '.substr($endTime, 0, 5), $timezone);

        if ($end->lte($start)) {
            $end = $end->addDay();
        }

        return [$start->getTimestamp(), $end->getTimestamp()];
    }

    public static function intervalsOverlap(int $startA, int $endA, int $startB, int $endB): bool
    {
        return $startA < $endB && $startB < $endA;
    }

    public static function findOverlapping(
        int $userId,
        string $workDate,
        string $startTime,
        string $endTime,
        ?int $ignoreId = null,
    ): ?self {
        [$start, $end] = self::absoluteBounds($workDate, $startTime, $endTime);
        $fromDate = CarbonImmutable::createFromFormat('Y-m-d', $workDate, config('app.timezone'))->subDay()->toDateString();
        $toDate = CarbonImmutable::createFromFormat('Y-m-d', $workDate, config('app.timezone'))->addDay()->toDateString();

        $candidates = self::query()
            ->where('user_id', $userId)
            ->whereBetween('work_date', [$fromDate, $toDate])
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get(['id', 'work_date', 'start_time', 'end_time', 'baan_name']);

        foreach ($candidates as $candidate) {
            [$otherStart, $otherEnd] = self::absoluteBounds(
                $candidate->work_date->format('Y-m-d'),
                substr((string) $candidate->start_time, 0, 5),
                substr((string) $candidate->end_time, 0, 5),
            );

            if (self::intervalsOverlap($start, $end, $otherStart, $otherEnd)) {
                return $candidate;
            }
        }

        return null;
    }
}
