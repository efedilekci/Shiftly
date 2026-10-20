<?php

namespace App\Http\Requests\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyInvitationRequest extends FormRequest
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

        /** @var CompanyMember $membership */
        $membership = $this->attributes->get('companyMember');

        return [
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) use ($company): void {
                    if ($value === $this->user()?->email) {
                        $fail('Je kunt jezelf niet uitnodigen.');

                        return;
                    }

                    $existingUser = User::query()->where('email', $value)->first();

                    if ($existingUser && CompanyMember::query()
                        ->where('company_id', $company->id)
                        ->where('user_id', $existingUser->id)
                        ->exists()) {
                        $fail('Deze gebruiker is al lid van dit bedrijf.');
                    }
                },
            ],
            'role' => ['required', 'string', Rule::in($membership->role->inviteableValues())],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.required' => 'Vul een e-mailadres in.',
            'role.required' => 'Kies een rol.',
            'role.in' => 'Kies een geldige rol.',
        ];
    }
}
