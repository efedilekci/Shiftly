<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DeleteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $user = $this->route('user');
            if (! $user instanceof User) {
                return;
            }

            if ($this->user()?->is($user)) {
                $validator->errors()->add('user', 'Je kunt jezelf niet verwijderen.');

                return;
            }

            if ($user->role === Role::Admin && User::query()->where('role', Role::Admin)->count() <= 1) {
                $validator->errors()->add('user', 'Er moet minstens één admin overblijven.');
            }
        }];
    }
}
