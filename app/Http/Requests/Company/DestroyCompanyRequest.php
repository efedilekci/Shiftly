<?php

namespace App\Http\Requests\Company;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DestroyCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Company $company */
        $company = $this->route('company');

        return [
            'confirmation' => [
                'required',
                'string',
                Rule::in([$company->name]),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'confirmation.required' => 'Typ de bedrijfsnaam om opheffen te bevestigen.',
            'confirmation.in' => 'De naam komt niet overeen met dit bedrijf.',
        ];
    }
}
