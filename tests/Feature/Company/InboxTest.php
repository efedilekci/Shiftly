<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyHourApprovalMode;
use App\Enums\CompanyMemberRole;
use App\Enums\HourEntryApprovalStatus;
use App\Enums\InboxMessageType;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use App\Models\InboxMessage;
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
                ->has('items', 1)
                ->where('invitations.0.company_name', $company->name)
                ->where('invitations.0.role', CompanyMemberRole::Employee->value)
                ->where('items.0.kind', 'invitation'));
    }

    public function test_employee_gets_inbox_message_when_hours_are_approved_or_rejected(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::Owner);
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '15.00');
        $approved = HourEntry::query()->create([
            'user_id' => $employee->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'work_date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 60,
            'note' => null,
            'approval_status' => HourEntryApprovalStatus::Pending,
        ]);
        $rejected = HourEntry::query()->create([
            'user_id' => $employee->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'work_date' => now()->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '12:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 60,
            'note' => null,
            'approval_status' => HourEntryApprovalStatus::Pending,
        ]);

        $this->actingAs($owner)
            ->post(route('company.hours.approve', [$company, $approved]))
            ->assertRedirect();

        $this->actingAs($owner)
            ->post(route('company.hours.reject', [$company, $rejected]), [
                'reason' => 'Pauze klopt niet',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('inbox_messages', [
            'user_id' => $employee->id,
            'type' => InboxMessageType::HoursApproved->value,
        ]);
        $this->assertDatabaseHas('inbox_messages', [
            'user_id' => $employee->id,
            'type' => InboxMessageType::HoursRejected->value,
        ]);

        $rejectedMessage = InboxMessage::query()
            ->where('user_id', $employee->id)
            ->where('type', InboxMessageType::HoursRejected)
            ->first();

        $this->assertNotNull($rejectedMessage);
        $this->assertSame(
            route('uren.index', ['edit' => $rejected->id], absolute: false),
            $rejectedMessage->action_url,
        );

        $this->actingAs($employee)
            ->get(route('inbox.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inbox/index')
                ->has('items', 2)
                ->where('items.0.kind', 'message'));

        $this->actingAs($employee)
            ->get(route('uren.index', ['edit' => $rejected->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('uren/index')
                ->where('editEntryId', $rejected->id));
    }

    public function test_approvers_get_inbox_message_when_hours_are_submitted(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::Owner);
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '15.00');

        $this->actingAs($employee)
            ->post(route('uren.store'), [
                'baan_id' => $baan->id,
                'work_date' => now()->toDateString(),
                'start_time' => '09:00',
                'end_time' => '17:00',
                'break_minutes' => 30,
                'note' => null,
            ])
            ->assertRedirect(route('uren.index', absolute: false));

        $this->assertDatabaseHas('inbox_messages', [
            'user_id' => $owner->id,
            'type' => InboxMessageType::HoursPendingReview->value,
        ]);
        $this->assertDatabaseMissing('inbox_messages', [
            'user_id' => $employee->id,
            'type' => InboxMessageType::HoursPendingReview->value,
        ]);
    }

    public function test_user_can_mark_inbox_message_as_read(): void
    {
        $user = User::factory()->create();
        $message = InboxMessage::notify(
            $user,
            InboxMessageType::HoursApproved,
            'Uren goedgekeurd',
            'Je uren zijn goedgekeurd.',
        );

        $this->actingAs($user)
            ->post(route('inbox.messages.read', $message))
            ->assertRedirect();

        $this->assertNotNull($message->fresh()->read_at);
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
    private function createCompanyWithOwner(CompanyHourApprovalMode $mode = CompanyHourApprovalMode::Owner): array
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create([
            'owner_user_id' => $owner->id,
            'hour_approval_mode' => $mode,
        ]);

        CompanyMember::factory()->owner()->create([
            'company_id' => $company->id,
            'user_id' => $owner->id,
        ]);

        return [$owner, $company];
    }
}
