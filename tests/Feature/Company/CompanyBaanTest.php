<?php

namespace Tests\Feature\Company;

use App\Enums\CompanyMemberRole;
use App\Models\Baan;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyBaanTest extends TestCase
{
    use RefreshDatabase;

    public function test_accepting_invitation_creates_company_baan(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $invitee = User::factory()->create(['email' => 'medewerker@shiftly.test']);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'role' => CompanyMemberRole::Employee,
        ]);

        $this->actingAs($invitee)
            ->post(route('inbox.accept', $invitation))
            ->assertRedirect();

        $this->assertDatabaseHas('banen', [
            'user_id' => $invitee->id,
            'company_id' => $company->id,
            'name' => $company->name,
        ]);
    }

    public function test_removing_member_removes_company_baan_but_keeps_hours(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $employee = User::factory()->create();
        $member = CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '15.00');

        $entry = HourEntry::query()->create([
            'user_id' => $employee->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => '15.00',
            'work_date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'break_minutes' => 30,
            'duration_minutes' => 450,
        ]);

        $this->actingAs($owner)
            ->delete(route('company.members.destroy', [$company, $member]))
            ->assertRedirect();

        $this->assertDatabaseMissing('banen', [
            'id' => $baan->id,
        ]);

        $this->assertDatabaseHas('hour_entries', [
            'id' => $entry->id,
            'company_id' => $company->id,
            'baan_name' => $company->name,
            'duration_minutes' => 450,
        ]);

        $this->assertNull($entry->fresh()->baan_id);
    }

    public function test_company_dashboard_only_counts_company_hours(): void
    {
        [$owner, $company] = $this->createCompanyWithOwner();
        $companyBaan = $company->ensureBaanFor($owner, '20.00');
        $personalBaan = Baan::query()->create([
            'user_id' => $owner->id,
            'name' => 'Bijbaan',
            'hourly_wage' => '12.00',
        ]);

        HourEntry::query()->create([
            'user_id' => $owner->id,
            'baan_id' => $companyBaan->id,
            'company_id' => $company->id,
            'baan_name' => $companyBaan->name,
            'hourly_wage' => '20.00',
            'work_date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 60,
        ]);

        HourEntry::query()->create([
            'user_id' => $owner->id,
            'baan_id' => $personalBaan->id,
            'company_id' => null,
            'baan_name' => $personalBaan->name,
            'hourly_wage' => '12.00',
            'work_date' => now()->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '14:00:00',
            'break_minutes' => 0,
            'duration_minutes' => 180,
        ]);

        $this->actingAs($owner)
            ->get(route('company.dashboard', $company))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.month_minutes', 60)
                ->has('recentEntries', 1)
                ->where('recentEntries.0.baan_name', $company->name));
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
