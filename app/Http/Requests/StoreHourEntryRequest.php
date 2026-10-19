<?php

namespace App\Http\Requests;

use App\Models\HourEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreHourEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'baan_id' => ['required', 'integer', Rule::exists('banen', 'id')->where('user_id', $this->user()?->id)],
            'work_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'break_minutes' => ['required', 'integer', 'min:0', 'max:1439'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $minutes = HourEntry::grossMinutes($this->string('start_time')->toString(), $this->string('end_time')->toString());

            if ($minutes === 0) {
                $validator->errors()->add('end_time', 'De begin- en eindtijd mogen niet gelijk zijn.');
            } elseif ((int) $this->input('break_minutes') >= $minutes) {
                $validator->errors()->add('break_minutes', 'De pauze moet korter zijn dan de dienst.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'baan_id.required' => 'Kies een baan.',
            'baan_id.integer' => 'Kies een geldige baan.',
            'baan_id.exists' => 'Deze baan is niet beschikbaar. Kies een van je eigen banen.',
            'work_date.required' => 'Vul de datum in.',
            'work_date.date_format' => 'Vul een geldige datum in.',
            'start_time.required' => 'Vul de begintijd in.',
            'start_time.date_format' => 'Vul een geldige begintijd in.',
            'end_time.required' => 'Vul de eindtijd in.',
            'end_time.date_format' => 'Vul een geldige eindtijd in.',
            'break_minutes.required' => 'Vul de pauze in minuten in, of 0 als je geen pauze had.',
            'break_minutes.integer' => 'Vul een heel aantal minuten in.',
            'break_minutes.min' => 'De pauze mag niet negatief zijn.',
            'break_minutes.max' => 'De pauze moet korter zijn dan een dag.',
        ];
    }
}
