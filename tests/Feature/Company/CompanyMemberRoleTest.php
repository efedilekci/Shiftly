<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyMemberRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_member_role(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();
        $member = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($owner)
            ->patch(route('company.members.role', [$company, $member]), [
                'role' => CompanyMemberRole::TeamLeader->value,
            ])
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertSame(CompanyMemberRole::TeamLeader, $member->fresh()->role);
    }

    public function test_owner_can_remove_member(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();
        $member = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($owner)
            ->delete(route('company.members.destroy', [$company, $member]))
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertDatabaseMissing('company_members', [
            'id' => $member->id,
        ]);
    }

    public function test_owner_cannot_remove_themselves_or_change_owner_role(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $ownerMembership = $owner->membershipFor($company);

        $this->actingAs($owner)
            ->delete(route('company.members.destroy', [$company, $ownerMembership]))
            ->assertRedirect()
            ->assertSessionHasErrors('member');

        $this->actingAs($owner)
            ->patch(route('company.members.role', [$company, $ownerMembership]), [
                'role' => CompanyMemberRole::Employee->value,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('role');
    }

    public function test_employee_cannot_manage_roles(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();
        $other = User::factory()->create();

        $employeeMembership = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $otherMembership = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $other->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($employee)
            ->patch(route('company.members.role', [$company, $otherMembership]), [
                'role' => CompanyMemberRole::TeamLeader->value,
            ])
            ->assertForbidden();

        $this->actingAs($employee)
            ->delete(route('company.members.destroy', [$company, $otherMembership]))
            ->assertForbidden();

        $this->assertDatabaseHas('company_members', [
            'id' => $employeeMembership->id,
        ]);
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
