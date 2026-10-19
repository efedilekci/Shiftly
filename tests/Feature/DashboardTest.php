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
                ->where('month_earnings_cents', 0)
                ->where('month_breakdown', [])
                ->has('hours_chart', 6)
                ->where('hours_chart.5.month', '2026-10')
                ->where('hours_chart.5.minutes', 0)
                ->where('hours_chart.5.hours', 0)
                ->where('hours_chart.5.percent', 0));
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
                ->where('month_earnings_cents', 14725)
                ->has('month_breakdown', 1)
                ->where('month_breakdown.0.baan_name', 'Winkel')
                ->where('month_breakdown.0.entry_count', 2)
                ->where('month_breakdown.0.minutes', 570)
                ->where('month_breakdown.0.earnings_cents', 14725));
    }

    public function test_dashboard_breaks_down_month_totals_per_job(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $user = User::factory()->create();
        $winkel = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $bakkerij = $user->banen()->create(['name' => 'Bakkerij', 'hourly_wage' => '20.00']);

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $winkel->id,
            'work_date' => '2026-10-05',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $bakkerij->id,
            'work_date' => '2026-10-06',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        // Highest earnings first: Winkel 11625, then Bakkerij 4000.
        $this->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('month_breakdown', 2)
                ->where('month_breakdown.0.baan_name', 'Winkel')
                ->where('month_breakdown.0.minutes', 450)
                ->where('month_breakdown.0.earnings_cents', 11625)
                ->where('month_breakdown.1.baan_name', 'Bakkerij')
                ->where('month_breakdown.1.minutes', 120)
                ->where('month_breakdown.1.earnings_cents', 4000));
    }

    public function test_dashboard_hours_chart_covers_last_six_months(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-09-15',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-10-05',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        // Outside the 6-month window.
        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-03-01',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        $this->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('hours_chart', 6)
                ->where('hours_chart.0.month', '2026-05')
                ->where('hours_chart.4.month', '2026-09')
                ->where('hours_chart.4.minutes', 120)
                ->where('hours_chart.4.hours', 2)
                ->where('hours_chart.4.percent', 27)
                ->where('hours_chart.5.month', '2026-10')
                ->where('hours_chart.5.minutes', 450)
                ->where('hours_chart.5.hours', 7.5)
                ->where('hours_chart.5.percent', 100));
    }
}
