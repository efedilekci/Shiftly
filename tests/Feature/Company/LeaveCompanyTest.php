<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeaveCompanyTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_page_lists_memberships(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($employee)
            ->get(route('company.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('company/create')
                ->has('memberships', 1)
                ->where('memberships.0.name', $company->name)
                ->where('memberships.0.can_leave', true));

        $this->actingAs($owner)
            ->get(route('company.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('memberships.0.can_leave', false));
    }

    public function test_employee_can_leave_a_company(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);
        $baan = $company->ensureBaanFor($employee, '15.00');

        $this->actingAs($employee)
            ->delete(route('company.leave', $company))
            ->assertRedirect(route('company.create', absolute: false))
            ->assertSessionHas('status');

        $this->assertDatabaseMissing('company_members', [
            'company_id' => $company->id,
            'user_id' => $employee->id,
        ]);
        $this->assertDatabaseMissing('banen', [
            'id' => $baan->id,
        ]);
    }

    public function test_team_leader_can_leave_a_company(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $teamLeader = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $this->actingAs($teamLeader)
            ->delete(route('company.leave', $company))
            ->assertRedirect(route('company.create', absolute: false));

        $this->assertDatabaseMissing('company_members', [
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
        ]);
    }

    public function test_owner_cannot_leave_their_company(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();

        $this->actingAs($owner)
            ->delete(route('company.leave', $company))
            ->assertRedirect()
            ->assertSessionHasErrors('company');

        $this->assertDatabaseHas('company_members', [
            'company_id' => $company->id,
            'user_id' => $owner->id,
            'role' => CompanyMemberRole::Owner->value,
        ]);
    }

    public function test_outsiders_cannot_leave_a_company(): void
    {
        [, $company] = $this->createCompanyWithOwner();

        $this->actingAs(User::factory()->create())
            ->delete(route('company.leave', $company))
            ->assertForbidden();
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
