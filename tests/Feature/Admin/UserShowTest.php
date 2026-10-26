<?php

namespace Tests\Feature\Admin;

use App\Enums\CompanyMemberRole;
use App\Enums\Role;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $user = User::factory()->create();

        $this->get(route('admin.users.show', $user))->assertRedirect('/login');
    }

    public function test_regular_users_cannot_view_another_user(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($actor)
            ->get(route('admin.users.show', $target))
            ->assertForbidden();
    }

    public function test_admins_can_view_a_user_summary(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create(['name' => 'Bert User', 'email' => 'bert@example.com']);
        $baan = $target->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);

        $company = Company::factory()->create([
            'name' => 'Bert BV',
            'owner_user_id' => $target->id,
        ]);
        CompanyMember::factory()->owner()->create([
            'company_id' => $company->id,
            'user_id' => $target->id,
            'role' => CompanyMemberRole::Owner,
        ]);

        $this->actingAs($target)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        $this->actingAs($admin)
            ->get(route('admin.users.show', $target))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/show')
                ->where('user.name', 'Bert User')
                ->where('user.email', 'bert@example.com')
                ->where('user.role', Role::User->value)
                ->where('stats.banen_count', 1)
                ->where('stats.entry_count', 1)
                ->where('stats.total_minutes', 450)
                ->where('stats.total_earnings_cents', 11625)
                ->has('banen', 1)
                ->where('banen.0.name', 'Winkel')
                ->has('companies', 1)
                ->where('companies.0.name', 'Bert BV')
                ->where('companies.0.role', CompanyMemberRole::Owner->value)
                ->where('companies.0.is_owner', true)
                ->has('recent_entries', 1)
                ->where('recent_entries.0.baan_name', 'Winkel')
                ->where('recent_entries.0.duration_minutes', 450)
                ->where('can_delete', true)
                ->where('delete_blocked_reason', null));
    }
}
