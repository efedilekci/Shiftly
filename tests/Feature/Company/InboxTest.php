<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_sees_pending_invitations_for_their_email(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $invitee = User::factory()->create(['email' => 'medewerker@shiftly.test']);

        CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($invitee)
            ->get(route('inbox.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inbox/index')
                ->has('invitations', 1)
                ->where('invitations.0.company_name', $company->name)
                ->where('invitations.0.role', CompanyMemberRole::Employee->value));
    }

    public function test_user_can_accept_invitation_from_inbox(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $invitee = User::factory()->create(['email' => 'medewerker@shiftly.test']);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $this->actingAs($invitee)
            ->post(route('inbox.accept', $invitation))
            ->assertRedirect(route('company.dashboard', $company, absolute: false));

        $this->assertDatabaseHas('company_members', [
            'company_id' => $company->id,
            'user_id' => $invitee->id,
            'role' => CompanyMemberRole::TeamLeader->value,
        ]);

        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_employee_accept_redirects_to_app_dashboard(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $invitee = User::factory()->create(['email' => 'werknemer@shiftly.test']);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($invitee)
            ->post(route('inbox.accept', $invitation))
            ->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_user_cannot_accept_invitation_for_another_email(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $invitee = User::factory()->create(['email' => 'medewerker@shiftly.test']);
        $outsider = User::factory()->create(['email' => 'anders@shiftly.test']);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($outsider)
            ->post(route('inbox.accept', $invitation))
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
