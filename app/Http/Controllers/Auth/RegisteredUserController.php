<?php

namespace App\Http\Controllers\Auth;

use App\Enums\CompanyMemberRole;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'account_type' => ['required', Rule::in(['personal', 'company'])],
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'company_name' => [
                Rule::requiredIf($request->input('account_type') === 'company'),
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        /** @var array{user: User, company: ?Company} $result */
        $result = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $company = null;

            if ($request->input('account_type') === 'company') {
                $company = Company::create([
                    'name' => $request->string('company_name')->toString(),
                    'owner_user_id' => $user->id,
                ]);

                CompanyMember::create([
                    'company_id' => $company->id,
                    'user_id' => $user->id,
                    'role' => CompanyMemberRole::Owner,
                ]);

                $company->ensureBaanFor($user);
            }

            return ['user' => $user, 'company' => $company];
        });

        event(new Registered($result['user']));

        Auth::login($result['user']);

        if ($result['company']) {
            return to_route('company.dashboard', $result['company'])
                ->with('status', 'Bedrijf '.$result['company']->name.' is aangemaakt.');
        }

        return to_route('dashboard');
    }
}
