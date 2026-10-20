<?php

namespace App\Http\Requests\Company;

use App\Enums\CompanyMemberRole;
use App\Models\CompanyMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyMemberRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'role' => ['required', 'string', Rule::in(CompanyMemberRole::assignableValues())],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            /** @var CompanyMember|null $member */
            $member = $this->route('member');

            if ($member?->role === CompanyMemberRole::Owner) {
                $validator->errors()->add('role', 'De rol van de eigenaar kan niet worden gewijzigd.');
            }

            if ($member && $member->user_id === $this->user()?->id) {
                $validator->errors()->add('role', 'Je kunt je eigen rol niet wijzigen.');
            }
        });
    }
}
