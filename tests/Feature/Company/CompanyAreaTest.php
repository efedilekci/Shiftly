<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompanyAreaTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_owner_can_view_dashboard_and_members(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();

        $this->actingAs($owner)
            ->get(route('company.dashboard', $company))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('company/dashboard')
                ->where('company.slug', $company->slug)
                ->where('membership.role', CompanyMemberRole::Owner->value)
                ->where('stats.members', 1));

        $this->actingAs($owner)
            ->get(route('company.members.index', $company))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('company/members/index')
                ->has('members', 1)
                ->where('members.0.email', $owner->email));
    }

    public function test_non_members_cannot_access_company_area(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->get(route('company.dashboard', $company))
            ->assertForbidden();

        $this->actingAs($outsider)
            ->get(route('company.members.index', $company))
            ->assertForbidden();
    }

    public function test_employee_can_view_members_but_not_month_hours(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($employee)
            ->get(route('company.members.index', $company))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('membership.can_view_hours', false)
                ->where('members.0.month_minutes', null)
                ->where('members.1.month_minutes', null));

        $this->actingAs($owner)
            ->get(route('company.members.index', $company))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('membership.can_view_hours', true));
    }

    /** @return array{0: User, 1: Company} */
    private function createCompanyWithOwner(): array
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create([
            'owner_user_id' => $owner->id,
        ]);

        CompanyMember::factory()->owner()->create([
            'company_id' => $company->id,
            'user_id' => $owner->id,
        ]);

        return [$owner, $company];
    }
}
