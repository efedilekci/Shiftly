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
            'hour_approval_mode' => ['required', 'string', Rule::in(CompanyHourApprovalMode::values())],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'hour_approval_mode.required' => 'Kies hoe bedrijfsuren worden goedgekeurd.',
            'hour_approval_mode.in' => 'Kies een geldige goedkeuringsoptie.',
        ];
    }
}
