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

class CompanySettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_hour_approval_mode(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();

        $this->actingAs($owner)
            ->put(route('company.settings.update', $company), [
                'hour_approval_mode' => CompanyHourApprovalMode::TeamLeader->value,
            ])
            ->assertRedirect()
            ->assertSessionHas('status');

        $this->assertSame(CompanyHourApprovalMode::TeamLeader, $company->fresh()->hour_approval_mode);
    }

    public function test_team_leader_cannot_update_settings(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $teamLeader = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $this->actingAs($teamLeader)
            ->get(route('company.settings.edit', $company))
            ->assertForbidden();

        $this->actingAs($teamLeader)
            ->put(route('company.settings.update', $company), [
                'hour_approval_mode' => CompanyHourApprovalMode::Owner->value,
            ])
            ->assertForbidden();
    }

    public function test_company_hours_are_pending_when_approval_is_required(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $company->forceFill([
            'hour_approval_mode' => CompanyHourApprovalMode::Owner,
        ])->save();

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
            ->assertRedirect(route('uren.index'));

        $this->assertDatabaseHas('hour_entries', [
            'user_id' => $employee->id,
            'company_id' => $company->id,
            'approval_status' => HourEntryApprovalStatus::Pending->value,
        ]);
    }

    public function test_personal_hours_stay_approved(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create([
            'name' => 'Bijbaan',
            'hourly_wage' => '12.00',
        ]);

        $this->actingAs($user)
            ->post(route('uren.store'), [
                'baan_id' => $baan->id,
                'work_date' => now()->toDateString(),
                'start_time' => '09:00',
                'end_time' => '12:00',
                'break_minutes' => 0,
                'note' => null,
            ])
            ->assertRedirect(route('uren.index'));

        $this->assertDatabaseHas('hour_entries', [
            'user_id' => $user->id,
            'company_id' => null,
            'approval_status' => HourEntryApprovalStatus::Approved->value,
        ]);
    }

    public function test_company_dashboard_counts_only_approved_hours(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $baan = $company->ensureBaanFor($owner, '20.00');

        HourEntry::query()->create([
            'user_id' => $owner->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => '20.00',
            'work_date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 60,
            'approval_status' => HourEntryApprovalStatus::Approved,
        ]);

        HourEntry::query()->create([
            'user_id' => $owner->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => '20.00',
            'work_date' => now()->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '13:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 120,
            'approval_status' => HourEntryApprovalStatus::Pending,
        ]);

        $this->actingAs($owner)
            ->get(route('company.dashboard', $company))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('stats.month_minutes', 60));
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
