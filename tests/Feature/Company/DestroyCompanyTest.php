<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Enums\HourEntryApprovalStatus;
use App\Models\Baan;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DestroyCompanyTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_destroy_their_company(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $company->ensureBaanFor($employee);
        $baan = Baan::query()->where('company_id', $company->id)->where('user_id', $employee->id)->firstOrFail();

        $hour = HourEntry::query()->create([
            'user_id' => $employee->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => '18.00',
            'work_date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 60,
            'approval_status' => HourEntryApprovalStatus::Approved,
        ]);

        $this->actingAs($owner)
            ->delete(route('company.settings.destroy', $company), [
                'confirmation' => $company->name,
            ])
            ->assertRedirect(route('company.create'))
            ->assertSessionHas('status');

        $this->assertDatabaseMissing('companies', ['id' => $company->id]);
        $this->assertDatabaseMissing('company_members', ['company_id' => $company->id]);
        $this->assertDatabaseHas('hour_entries', ['id' => $hour->id]);
        $this->assertNull($hour->fresh()->company_id);
        $this->assertDatabaseMissing('banen', ['id' => $baan->id]);
    }

    public function test_owner_must_confirm_company_name(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();

        $this->actingAs($owner)
            ->from(route('company.settings.edit', $company))
            ->delete(route('company.settings.destroy', $company), [
                'confirmation' => 'Verkeerde naam',
            ])
            ->assertRedirect(route('company.settings.edit', $company))
            ->assertSessionHasErrors('confirmation');

        $this->assertDatabaseHas('companies', ['id' => $company->id]);
    }

    public function test_team_leader_cannot_destroy_company(): void
    {
        [, $company] = $this->createCompanyWithOwner();
        $teamLeader = User::factory()->create();

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $teamLeader->id,
            'role' => CompanyMemberRole::TeamLeader,
        ]);

        $this->actingAs($teamLeader)
            ->delete(route('company.settings.destroy', $company), [
                'confirmation' => $company->name,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('companies', ['id' => $company->id]);
    }

    /** @return array{0: User, 1: Company} */
    private function createCompanyWithOwner(): array
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create(['owner_user_id' => $owner->id]);

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $owner->id,
            'role' => CompanyMemberRole::Owner,
        ]);

        return [$owner, $company];
    }
}
