<?php

namespace Tests\Feature\Admin;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompanyIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/admin/bedrijven')->assertRedirect('/login');
    }

    public function test_regular_users_cannot_view_the_companies_list(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin/bedrijven')
            ->assertForbidden();
    }

    public function test_admins_see_companies_ordered_by_name(): void
    {
        $admin = User::factory()->admin()->create();
        $ownerA = User::factory()->create(['name' => 'Eigenaar A']);
        $ownerZ = User::factory()->create(['name' => 'Eigenaar Z']);

        $zeta = Company::factory()->create([
            'name' => 'Zeta BV',
            'owner_user_id' => $ownerZ->id,
        ]);
        CompanyMember::factory()->owner()->create([
            'company_id' => $zeta->id,
            'user_id' => $ownerZ->id,
        ]);

        $alpha = Company::factory()->create([
            'name' => 'Alpha BV',
            'owner_user_id' => $ownerA->id,
        ]);
        CompanyMember::factory()->owner()->create([
            'company_id' => $alpha->id,
            'user_id' => $ownerA->id,
        ]);
        CompanyMember::factory()->create([
            'company_id' => $alpha->id,
            'user_id' => User::factory()->create()->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($admin)
            ->get('/admin/bedrijven')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/companies/index')
                ->has('companies', 2)
                ->where('companies.0.name', 'Alpha BV')
                ->where('companies.0.owner_name', 'Eigenaar A')
                ->where('companies.0.members_count', 2)
                ->where('companies.1.name', 'Zeta BV')
                ->where('companies.1.owner_name', 'Eigenaar Z')
                ->where('companies.1.members_count', 1));
    }
}
