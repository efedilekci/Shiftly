<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_regular_users_cannot_visit_the_admin_area(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_admins_see_platform_stats_and_recent_entries(): void
    {
        $admin = User::factory()->admin()->create();
        $sara = User::factory()->create(['name' => 'Sara Bakker']);
        User::factory()->create();

        $baan = $sara->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $this->actingAs($sara)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => now()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        $sara->runningClock()->create([
            'baan_id' => $baan->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'started_at' => now()->timestamp,
        ]);

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('month', now()->format('Y-m'))
                ->where('stats.users_count', 3)
                ->where('stats.month_entry_count', 1)
                ->where('stats.month_minutes', 450)
                ->where('stats.month_earnings_cents', 11625)
                ->where('stats.active_clocks_count', 1)
                ->has('recent_entries', 1)
                ->where('recent_entries.0.user_name', 'Sara Bakker')
                ->where('recent_entries.0.baan_name', 'Winkel')
                ->where('recent_entries.0.duration_minutes', 450));
    }
}
