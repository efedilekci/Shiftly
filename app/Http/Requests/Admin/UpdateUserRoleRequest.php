<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'role' => ['required', Rule::enum(Role::class)],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $user = $this->route('user');
            if (! $user instanceof User) {
                return;
            }

            $newRole = Role::from($this->string('role')->toString());

            if ($user->role === Role::Admin && $newRole === Role::User) {
                $adminCount = User::query()->where('role', Role::Admin)->count();

                if ($adminCount <= 1) {
                    $validator->errors()->add('role', 'Er moet minstens één admin overblijven.');
                }
            }
        }];
    }

    public function messages(): array
    {
        return [
            'role.required' => 'Kies een rol.',
        ];
    }
}
