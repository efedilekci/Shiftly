<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyHourApprovalMode;
use App\Enums\CompanyMemberRole;
use App\Enums\HourEntryApprovalStatus;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyHourApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_approve_and_reject_pending_hours(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::TeamLeader);
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '15.00');
        $pending = $this->createEntry($employee, $company, $baan->id, HourEntryApprovalStatus::Pending);
        $other = $this->createEntry($employee, $company, $baan->id, HourEntryApprovalStatus::Pending, '11:00', '12:00');

        $this->actingAs($owner)
            ->post(route('company.hours.approve', [$company, $pending]))
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertSame(HourEntryApprovalStatus::Approved, $pending->fresh()->approval_status);

        $this->actingAs($owner)
            ->post(route('company.hours.reject', [$company, $other]))
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertSame(HourEntryApprovalStatus::Rejected, $other->fresh()->approval_status);
    }

    public function test_team_leader_can_approve_when_mode_allows_it(): void
    {
        [, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::TeamLeader);
        $teamLeader = User::factory()->create();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '15.00');
        $entry = $this->createEntry($employee, $company, $baan->id, HourEntryApprovalStatus::Pending);

        $this->actingAs($teamLeader)
            ->post(route('company.hours.approve', [$company, $entry]))
            ->assertRedirect();

        $this->assertSame(HourEntryApprovalStatus::Approved, $entry->fresh()->approval_status);
    }

    public function test_team_leader_cannot_approve_when_only_owner_may(): void
    {
        [, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::Owner);
        $teamLeader = User::factory()->create();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '15.00');
        $entry = $this->createEntry($employee, $company, $baan->id, HourEntryApprovalStatus::Pending);

        $this->actingAs($teamLeader)
            ->post(route('company.hours.approve', [$company, $entry]))
            ->assertForbidden();

        $this->assertSame(HourEntryApprovalStatus::Pending, $entry->fresh()->approval_status);
    }

    public function test_employee_cannot_access_company_hours_page(): void
    {
        [, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::TeamLeader);
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($employee)
            ->get(route('company.hours.index', $company))
            ->assertForbidden();
    }

    public function test_cannot_approve_already_approved_hours(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::Owner);
        $baan = $company->ensureBaanFor($owner, '20.00');
        $entry = $this->createEntry($owner, $company, $baan->id, HourEntryApprovalStatus::Approved);

        $this->actingAs($owner)
            ->post(route('company.hours.reject', [$company, $entry]))
            ->assertForbidden();
    }

    /** @return array{0: User, 1: Company} */
    private function createCompanyWithOwner(CompanyHourApprovalMode $mode = CompanyHourApprovalMode::Auto): array
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

    private function createEntry(
        User $user,
        Company $company,
        int $baanId,
        HourEntryApprovalStatus $status,
        string $start = '09:00',
        string $end = '10:00',
    ): HourEntry {
        return HourEntry::query()->create([
            'user_id' => $user->id,
            'baan_id' => $baanId,
            'company_id' => $company->id,
            'baan_name' => $company->name,
            'hourly_wage' => '15.00',
            'work_date' => now()->toDateString(),
            'start_time' => $start.':00',
            'end_time' => $end.':00',
            'break_minutes' => 0,
            'duration_minutes' => 60,
            'approval_status' => $status,
        ]);
    }
}
