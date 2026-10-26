<?php

namespace App\Http\Requests\Company;

use App\Enums\CompanyHourApprovalMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'hour_approval_mode' => ['required', 'string', Rule::in(CompanyHourApprovalMode::values())],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Vul een bedrijfsnaam in.',
            'name.max' => 'De bedrijfsnaam mag maximaal 255 tekens zijn.',
            'hour_approval_mode.required' => 'Kies hoe bedrijfsuren worden goedgekeurd.',
            'hour_approval_mode.in' => 'Kies een geldige goedkeuringsoptie.',
        ];
    }
}
