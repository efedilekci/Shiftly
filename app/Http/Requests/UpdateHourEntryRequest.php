<?php

namespace App\Http\Requests;

use App\Models\HourEntry;

class UpdateHourEntryRequest extends StoreHourEntryRequest
{
    public function authorize(): bool
    {
        $entry = $this->route('hourEntry');

        return $entry instanceof HourEntry
            && $this->user() !== null
            && $entry->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        $rules = parent::rules();

        if ($this->route('hourEntry') instanceof HourEntry && $this->route('hourEntry')->baan_id === null) {
            $rules['baan_id'][0] = 'nullable';
        }

        return $rules;
    }
}
