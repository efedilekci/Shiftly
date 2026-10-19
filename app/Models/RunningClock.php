<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RunningClock extends Model
{
    protected $fillable = ['baan_id', 'baan_name', 'hourly_wage', 'started_at'];

    protected function casts(): array
    {
        return ['started_at' => 'integer', 'hourly_wage' => 'decimal:2'];
    }
}
