<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CompanyInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_an_invitation_without_sending_mail(): void
    {
        Notification::fake();

        [$owner, $company] = $this->createCompanyWithOwner();

        $this->actingAs($owner)
            ->post(route('company.invitations.store', $company), [
                'email' => 'medewerker@shiftly.test',
                'role' => CompanyMemberRole::Employee->value,
            ])
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertDatabaseHas('company_invitations', [
            'company_id' => $company->id,
            'email' => 'medewerker@shiftly.test',
            'role' => CompanyMemberRole::Employee->value,
            'accepted_at' => null,
        ]);

        Notification::assertNothingSent();
    }

    public function test_owner_can_revoke_an_invitation(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => 'medewerker@shiftly.test',
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $this->actingAs($owner)
            ->delete(route('company.invitations.destroy', [$company, $invitation]))
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertDatabaseMissing('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_team_leader_can_invite_employees_only(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $teamLeader = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $this->actingAs($teamLeader)
            ->post(route('company.invitations.store', $company), [
                'email' => 'medewerker@shiftly.test',
                'role' => CompanyMemberRole::Employee->value,
            ])
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertDatabaseHas('company_invitations', [
            'company_id' => $company->id,
            'email' => 'medewerker@shiftly.test',
            'role' => CompanyMemberRole::Employee->value,
        ]);

        $this->actingAs($teamLeader)
            ->post(route('company.invitations.store', $company), [
                'email' => 'leider@shiftly.test',
                'role' => CompanyMemberRole::TeamLeader->value,
            ])
            ->assertSessionHasErrors('role');
    }

    public function test_employee_cannot_create_invitations(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($employee)
            ->post(route('company.invitations.store', $company), [
                'email' => 'iemand@shiftly.test',
                'role' => CompanyMemberRole::Employee->value,
            ])
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
