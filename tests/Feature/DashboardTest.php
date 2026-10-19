<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_dashboard_shows_zero_month_totals_without_entries(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $this->actingAs(User::factory()->create())
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('month', '2026-10')
                ->where('month_entry_count', 0)
                ->where('month_minutes', 0)
                ->where('month_earnings_cents', 0));
    }

    public function test_dashboard_sums_only_this_months_entries_for_the_current_user(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $user = User::factory()->create();
        $other = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $otherBaan = $other->banen()->create(['name' => 'Horeca', 'hourly_wage' => '20.00']);

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-10-05',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-10-12',
            'start_time' => '10:00',
            'end_time' => '12:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        // Previous month — must not count.
        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-09-30',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        // Other user's entry — must not count.
        $this->actingAs($other)->post('/uren', [
            'baan_id' => $otherBaan->id,
            'work_date' => '2026-10-10',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        // 450 + 120 = 570 minutes; earnings 11625 + 3100 = 14725
        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('month', '2026-10')
                ->where('month_entry_count', 2)
                ->where('month_minutes', 570)
                ->where('month_earnings_cents', 14725));
    }
}
