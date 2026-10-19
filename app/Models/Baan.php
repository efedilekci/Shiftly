<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Baan extends Model
{
    protected $table = 'banen';

    protected $fillable = ['name', 'hourly_wage'];

    protected function casts(): array
    {
        return ['hourly_wage' => 'decimal:2'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
