<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyMemberEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_member_hourly_wage_and_role(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();
        $member = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $company->ensureBaanFor($employee, '12.00');

        $this->actingAs($owner)
            ->put(route('company.members.update', [$company, $member]), [
                'hourly_wage' => '18,50',
                'role' => CompanyMemberRole::TeamLeader->value,
            ])
            ->assertRedirect(route('company.members.index', $company))
            ->assertSessionHas('status');

        $this->assertDatabaseHas('banen', [
            'user_id' => $employee->id,
            'company_id' => $company->id,
            'hourly_wage' => '18.50',
        ]);

        $this->assertSame(CompanyMemberRole::TeamLeader, $member->fresh()->role);
    }

    public function test_owner_can_update_own_hourly_wage_without_changing_role(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $ownerMembership = $owner->membershipFor($company);
        $company->ensureBaanFor($owner, '10.00');

        $this->actingAs($owner)
            ->put(route('company.members.update', [$company, $ownerMembership]), [
                'hourly_wage' => '22.00',
            ])
            ->assertRedirect(route('company.members.index', $company));

        $this->assertDatabaseHas('banen', [
            'user_id' => $owner->id,
            'company_id' => $company->id,
            'hourly_wage' => '22.00',
        ]);

        $this->assertSame(CompanyMemberRole::Owner, $ownerMembership->fresh()->role);
    }

    public function test_employee_cannot_edit_company_baan_wage_themselves(): void
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
            ->from(route('banen.index'))
            ->put(route('banen.update', $baan), [
                'name' => $company->name,
                'hourly_wage' => '99.00',
            ])
            ->assertRedirect(route('banen.index'))
            ->assertSessionHasErrors('baan');

        $this->assertDatabaseHas('banen', [
            'id' => $baan->id,
            'hourly_wage' => '15.00',
        ]);
    }

    public function test_team_leader_cannot_open_member_edit_page(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $teamLeader = User::factory()->create();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $member = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($teamLeader)
            ->get(route('company.members.edit', [$company, $member]))
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
