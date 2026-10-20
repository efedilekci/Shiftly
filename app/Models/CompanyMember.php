<?php

namespace App\Models;

use App\Enums\CompanyMemberRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyMember extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyMemberFactory> */
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'role',
    ];

    protected function casts(): array
    {
        return [
            'role' => CompanyMemberRole::class,
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
