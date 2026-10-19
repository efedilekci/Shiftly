<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->hourly_wage)) {
            $this->merge(['hourly_wage' => str_replace(',', '.', trim($this->hourly_wage))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'hourly_wage' => ['required', 'numeric', 'min:0', 'max:99999.99', 'decimal:0,2'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vul de naam van je baan in.',
            'name.string' => 'Vul een geldige naam in.',
            'name.max' => 'De naam mag maximaal 255 tekens bevatten.',
            'hourly_wage.required' => 'Vul je uurloon in.',
            'hourly_wage.numeric' => 'Vul een geldig bedrag in.',
            'hourly_wage.min' => 'Het uurloon mag niet negatief zijn.',
            'hourly_wage.max' => 'Het uurloon mag maximaal 99.999,99 euro zijn.',
            'hourly_wage.decimal' => 'Gebruik maximaal twee cijfers achter de komma.',
        ];
    }
}
