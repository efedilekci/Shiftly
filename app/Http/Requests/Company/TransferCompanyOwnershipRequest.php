<?php

namespace App\Http\Requests\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransferCompanyOwnershipRequest extends FormRequest
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
            'member_id' => [
                'required',
                'integer',
                Rule::exists('company_members', 'id')
                    ->where(fn ($query) => $query
                        ->where('company_id', $company->id)
                        ->where('role', '!=', CompanyMemberRole::Owner->value)),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'member_id.required' => 'Kies een nieuwe eigenaar.',
            'member_id.exists' => 'Kies een geldige medewerker uit dit bedrijf.',
        ];
    }

    public function member(): CompanyMember
    {
        /** @var Company $company */
        $company = $this->route('company');

        return CompanyMember::query()
            ->where('company_id', $company->id)
            ->whereKey($this->integer('member_id'))
            ->firstOrFail();
    }
}
