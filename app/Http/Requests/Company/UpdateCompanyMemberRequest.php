<?php

namespace App\Http\Requests\Company;

use App\Enums\CompanyMemberRole;
use App\Models\CompanyMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->hourly_wage)) {
            $this->merge(['hourly_wage' => str_replace(',', '.', trim($this->hourly_wage))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var CompanyMember $member */
        $member = $this->route('member');

        $canChangeRole = $member->role !== CompanyMemberRole::Owner
            && $member->user_id !== $this->user()?->id;

        return [
            'hourly_wage' => ['required', 'numeric', 'min:0', 'max:99999.99', 'decimal:0,2'],
            'role' => [
                Rule::excludeIf(! $canChangeRole),
                'required',
                'string',
                Rule::in(CompanyMemberRole::assignableValues()),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'hourly_wage.required' => 'Vul een uurloon in.',
            'hourly_wage.numeric' => 'Vul een geldig bedrag in.',
            'hourly_wage.min' => 'Het uurloon mag niet negatief zijn.',
            'hourly_wage.max' => 'Het uurloon mag maximaal 99.999,99 euro zijn.',
            'hourly_wage.decimal' => 'Gebruik maximaal twee cijfers achter de komma.',
            'role.required' => 'Kies een rol.',
            'role.in' => 'Kies een geldige rol.',
        ];
    }
}
