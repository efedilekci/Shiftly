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
                ->where('previous_month', '2026-09')
                ->where('next_month', null)
                ->where('month_entry_count', 0)
                ->where('month_minutes', 0)
                ->where('month_earnings_cents', 0)
                ->where('month_breakdown', [])
                ->has('hours_chart', 6)
                ->where('hours_chart.5.month', '2026-10')
                ->where('hours_chart.5.minutes', 0)
                ->where('hours_chart.5.hours', 0)
                ->where('hours_chart.5.percent', 0)
                ->where('recent_entries', []));
    }

    public function test_dashboard_can_show_totals_for_a_selected_month(): void
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

        $this->actingAs($user)
            ->get('/dashboard?month=2026-09')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('month', '2026-09')
                ->where('previous_month', '2026-08')
                ->where('next_month', '2026-10')
                ->where('month_entry_count', 1)
                ->where('month_minutes', 120)
                ->where('month_earnings_cents', 3100)
                ->has('month_breakdown', 1)
                ->where('month_breakdown.0.baan_name', 'Winkel'));
    }

    public function test_dashboard_falls_back_to_the_current_month_for_invalid_or_future_months(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $this->actingAs(User::factory()->create())
            ->get('/dashboard?month=not-a-month')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('month', '2026-10')
                ->where('next_month', null));

        $this->get('/dashboard?month=2026-11')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('month', '2026-10')
                ->where('next_month', null));
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

    public function test_dashboard_shows_the_five_most_recent_entries(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $user = User::factory()->create();
        $other = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $otherBaan = $other->banen()->create(['name' => 'Horeca', 'hourly_wage' => '20.00']);

        foreach (range(1, 6) as $day) {
            $this->actingAs($user)->post('/uren', [
                'baan_id' => $baan->id,
                'work_date' => sprintf('2026-10-%02d', $day),
                'start_time' => '09:00',
                'end_time' => '10:00',
                'break_minutes' => 0,
            ])->assertRedirect('/uren');
        }

        $this->actingAs($other)->post('/uren', [
            'baan_id' => $otherBaan->id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren');

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('recent_entries', 5)
                ->where('recent_entries.0.work_date', '2026-10-06')
                ->where('recent_entries.0.baan_name', 'Winkel')
                ->where('recent_entries.0.start_time', '09:00')
                ->where('recent_entries.0.end_time', '10:00')
                ->where('recent_entries.0.duration_minutes', 60)
                ->where('recent_entries.0.earnings_cents', 1550)
                ->where('recent_entries.4.work_date', '2026-10-02'));
    }

    public function test_dashboard_shows_clock_status_and_jobs(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-19 12:00:00', 'Europe/Amsterdam'));

        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('activeClock', null)
                ->has('banen', 1)
                ->where('banen.0.id', $baan->id)
                ->where('timezone', 'Europe/Amsterdam'));

        $this->post('/klok/in', ['baan_id' => $baan->id, 'redirect' => 'dashboard'])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/dashboard');

        $this->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('activeClock.baan_name', 'Winkel')
                ->where('activeClock.started_at', now()->timestamp));
    }
}
