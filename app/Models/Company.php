<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'owner_user_id',
    ];

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

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
