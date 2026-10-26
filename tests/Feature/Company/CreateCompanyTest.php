<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CreateCompanyTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('company.create'))->assertRedirect('/login');
        $this->post(route('company.store'), ['name' => 'Demo BV'])->assertRedirect('/login');
    }

    public function test_authenticated_users_can_view_the_create_form(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('company.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('company/create')
                ->has('memberships', 0));
    }

    public function test_authenticated_users_can_start_a_company(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('company.store'), [
            'name' => 'Shiftly BV',
        ]);

        $company = Company::query()->where('name', 'Shiftly BV')->firstOrFail();

        $response
            ->assertRedirect(route('company.dashboard', $company, absolute: false))
            ->assertSessionHas('status');

        $this->assertSame($user->id, $company->owner_user_id);
        $this->assertDatabaseHas('company_members', [
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role' => CompanyMemberRole::Owner->value,
        ]);
        $this->assertInstanceOf(CompanyMember::class, $user->membershipFor($company));
        $this->assertDatabaseHas('banen', [
            'user_id' => $user->id,
            'company_id' => $company->id,
            'name' => 'Shiftly BV',
        ]);
    }

    public function test_company_name_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('company.store'), ['name' => ''])
            ->assertSessionHasErrors('name');

        $this->assertDatabaseCount('companies', 0);
    }
}
