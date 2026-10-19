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
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $note = $this->input('note');

        if (! is_string($note)) {
            $this->merge(['note' => null]);

            return;
        }

        $trimmed = trim($note);
        $this->merge(['note' => $trimmed === '' ? null : $trimmed]);
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $startTime = $this->string('start_time')->toString();
            $endTime = $this->string('end_time')->toString();
            $minutes = HourEntry::grossMinutes($startTime, $endTime);

            if ($minutes === 0) {
                $validator->errors()->add('end_time', 'De begin- en eindtijd mogen niet gelijk zijn.');

                return;
            }

            if ((int) $this->input('break_minutes') >= $minutes) {
                $validator->errors()->add('break_minutes', 'De pauze moet korter zijn dan de dienst.');

                return;
            }

            $ignoreId = $this->route('hourEntry') instanceof HourEntry
                ? $this->route('hourEntry')->id
                : null;

            $overlap = HourEntry::findOverlapping(
                (int) $this->user()->id,
                $this->string('work_date')->toString(),
                $startTime,
                $endTime,
                $ignoreId,
            );

            if ($overlap !== null) {
                $validator->errors()->add(
                    'start_time',
                    sprintf(
                        'Deze tijden overlappen met %s op %s (%s–%s).',
                        $overlap->baan_name,
                        $overlap->work_date->format('d-m-Y'),
                        substr((string) $overlap->start_time, 0, 5),
                        substr((string) $overlap->end_time, 0, 5),
                    ),
                );
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
            'note.string' => 'Vul een geldige notitie in.',
            'note.max' => 'De notitie mag maximaal 500 tekens zijn.',
        ];
    }
}
