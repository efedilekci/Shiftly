<?php

namespace Tests\Feature\Admin;

use App\Enums\CompanyHourApprovalMode;
use App\Enums\CompanyMemberRole;
use App\Enums\HourEntryApprovalStatus;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompanyShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        [, $company] = $this->createCompanyWithOwner();

        $this->get(route('admin.companies.show', $company))->assertRedirect('/login');
    }

    public function test_regular_users_cannot_view_a_company(): void
    {
        [, $company] = $this->createCompanyWithOwner();

        $this->actingAs(User::factory()->create())
            ->get(route('admin.companies.show', $company))
            ->assertForbidden();
    }

    public function test_admins_can_view_company_details(): void
    {
        $admin = User::factory()->admin()->create();
        [$owner, $company] = $this->createCompanyWithOwner(CompanyHourApprovalMode::Owner);
        $employee = User::factory()->create(['name' => 'Medewerker Mia']);

        CompanyMember::factory()->create([
            'company_id' => $company->id,
            'user_id' => $employee->id,
            'role' => CompanyMemberRole::Employee,
        ]);

        CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
            'email' => 'lisa@shiftly.test',
            'role' => CompanyMemberRole::Employee,
        ]);

        $baan = $company->ensureBaanFor($employee, '18.00');
        HourEntry::query()->create([
            'user_id' => $employee->id,
            'baan_id' => $baan->id,
            'company_id' => $company->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'work_date' => '2026-10-20',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
            'duration_minutes' => 450,
            'approval_status' => HourEntryApprovalStatus::Pending,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.companies.show', $company))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/companies/show')
                ->where('company.name', $company->name)
                ->where('company.slug', $company->slug)
                ->where('company.hour_approval_mode', CompanyHourApprovalMode::Owner->value)
                ->where('company.members_count', 2)
                ->where('company.pending_invitations_count', 1)
                ->where('owner.name', $owner->name)
                ->has('members', 2)
                ->has('invitations', 1)
                ->where('invitations.0.email', 'lisa@shiftly.test')
                ->has('recent_entries', 1)
                ->where('recent_entries.0.user_name', 'Medewerker Mia')
                ->where('recent_entries.0.approval_status', HourEntryApprovalStatus::Pending->value));
    }

    /** @return array{0: User, 1: Company} */
    private function createCompanyWithOwner(CompanyHourApprovalMode $mode = CompanyHourApprovalMode::Auto): array
    {
        $owner = User::factory()->create(['name' => 'Eigenaar Eva']);
        $company = Company::factory()->create([
            'name' => 'Demo BV',
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
