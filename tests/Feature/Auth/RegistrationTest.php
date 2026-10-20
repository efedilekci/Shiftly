<?php

namespace Tests\Feature\Auth;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register()
    {
        $response = $this->post('/register', [
            'account_type' => 'personal',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseCount('companies', 0);
    }

    public function test_company_owners_can_register_with_a_company()
    {
        $response = $this->post('/register', [
            'account_type' => 'company',
            'company_name' => 'Shiftly BV',
            'name' => 'Efe Eigenaar',
            'email' => 'eigenaar@shiftly.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $response->assertSessionHas('status');

        $user = User::query()->where('email', 'eigenaar@shiftly.test')->firstOrFail();
        $company = Company::query()->where('name', 'Shiftly BV')->firstOrFail();

        $this->assertSame($user->id, $company->owner_user_id);
        $this->assertDatabaseHas('company_members', [
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role' => CompanyMemberRole::Owner->value,
        ]);
        $this->assertInstanceOf(CompanyMember::class, $user->membershipFor($company));
    }

    public function test_company_registration_requires_a_company_name()
    {
        $response = $this->post('/register', [
            'account_type' => 'company',
            'company_name' => '',
            'name' => 'Efe Eigenaar',
            'email' => 'eigenaar@shiftly.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('company_name');
        $this->assertGuest();
        $this->assertDatabaseCount('companies', 0);
    }
}
