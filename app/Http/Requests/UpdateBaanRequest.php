<?php

namespace App\Http\Requests;

use App\Models\Baan;

class UpdateBaanRequest extends StoreBaanRequest
{
    public function authorize(): bool
    {
        $baan = $this->route('baan');

        return $baan instanceof Baan
            && $this->user() !== null
            && $baan->user_id === $this->user()->id;
    }
}
