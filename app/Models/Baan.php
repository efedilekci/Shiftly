<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Baan extends Model
{
    protected $table = 'banen';

    protected $fillable = ['user_id', 'name', 'hourly_wage', 'company_id'];

    protected function casts(): array
    {
        return [
            'hourly_wage' => 'decimal:2',
            'company_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function isCompanyBaan(): bool
    {
        return $this->company_id !== null;
    }
}
