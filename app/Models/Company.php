<?php

namespace App\Models;

use App\Enums\CompanyHourApprovalMode;
use App\Enums\CompanyMemberRole;
use App\Enums\HourEntryApprovalStatus;
use App\Enums\InboxMessageType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'owner_user_id',
        'hour_approval_mode',
    ];

    protected function casts(): array
    {
        return [
            'hour_approval_mode' => CompanyHourApprovalMode::class,
        ];
    }

    public function initialHourApprovalStatus(): HourEntryApprovalStatus
    {
        return $this->hour_approval_mode->requiresApproval()
            ? HourEntryApprovalStatus::Pending
            : HourEntryApprovalStatus::Approved;
    }

    public function actorCanApproveHours(CompanyMemberRole $role): bool
    {
        return $this->hour_approval_mode->canBeApprovedBy($role);
    }

    /** @return Collection<int, User> */
    public function usersWhoCanApproveHours(): Collection
    {
        return $this->members()
            ->with('user')
            ->get()
            ->filter(fn (CompanyMember $member) => $this->actorCanApproveHours($member->role) && $member->user)
            ->map(fn (CompanyMember $member) => $member->user)
            ->values();
    }

    public function notifyHourApprovers(
        InboxMessageType $type,
        string $title,
        string $body,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        ?array $meta = null,
        ?int $exceptUserId = null,
    ): void {
        foreach ($this->usersWhoCanApproveHours() as $user) {
            if ($exceptUserId !== null && $user->id === $exceptUserId) {
                continue;
            }

            InboxMessage::notify($user, $type, $title, $body, $actionUrl, $actionLabel, $meta);
        }
    }

    protected static function booted(): void
    {
        static::creating(function (Company $company): void {
            if (blank($company->slug)) {
                $company->slug = static::uniqueSlugFor($company->name);
            }
        });
    }

    public static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'bedrijf';
        $slug = $base;
        $i = 2;

        while (static::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(CompanyMember::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(CompanyInvitation::class);
    }

    public function banen(): HasMany
    {
        return $this->hasMany(Baan::class);
    }

    public function ensureBaanFor(User $user, string $hourlyWage = '0.00'): Baan
    {
        return Baan::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'company_id' => $this->id,
            ],
            [
                'name' => $this->name,
                'hourly_wage' => $hourlyWage,
            ],
        );
    }

    public function removeBaanFor(User $user): void
    {
        $baanIds = Baan::query()
            ->where('user_id', $user->id)
            ->where('company_id', $this->id)
            ->pluck('id');

        if ($baanIds->isEmpty()) {
            return;
        }

        RunningClock::query()
            ->where('user_id', $user->id)
            ->whereIn('baan_id', $baanIds)
            ->delete();

        Baan::query()->whereIn('id', $baanIds)->delete();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
