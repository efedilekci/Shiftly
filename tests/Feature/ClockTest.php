<?php

namespace Tests\Feature;

use App\Models\Baan;
use App\Models\HourEntry;
use App\Models\RunningClock;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClockTest extends TestCase
{
    use RefreshDatabase;

    private function startClock(User $user): Baan
    {
        $this->travelTo(Carbon::parse('2026-10-19 09:00:00'));
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $this->actingAs($user)->post(route('clock.start'), ['baan_id' => $baan->id])
            ->assertSessionHasNoErrors()->assertRedirect('/klok');

        return $baan;
    }

    public function test_guests_cannot_use_clock_routes(): void
    {
        $this->get('/klok')->assertRedirect('/login');
        $this->post('/klok/in', [])->assertRedirect('/login');
        $this->post('/klok/uit', [])->assertRedirect('/login');
        $this->delete('/klok')->assertRedirect('/login');
        $this->assertDatabaseCount('running_clocks', 0);
        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_the_clock_persists_between_page_visits_and_only_shows_the_current_users_data(): void
    {
        $user = User::factory()->create();
        $baan = $this->startClock($user);
        $timestamp = now()->timestamp;
        for ($i = 0; $i < 2; $i++) {
            $this->get('/klok')->assertInertia(fn (Assert $page) => $page->component('klok/index')
                ->where('activeClock.baan_name', 'Winkel')->where('activeClock.started_at', $timestamp)
                ->has('banen', 1)->where('banen.0.id', $baan->id));
        }
        $this->actingAs(User::factory()->create())->get('/klok')
            ->assertInertia(fn (Assert $page) => $page->component('klok/index')->where('activeClock', null)->has('banen', 0));
    }

    public function test_users_cannot_clock_in_for_another_users_job(): void
    {
        $baan = User::factory()->create()->banen()->create(['name' => 'Prive', 'hourly_wage' => '99.00']);
        $this->actingAs(User::factory()->create())->post('/klok/in', ['baan_id' => $baan->id])
            ->assertSessionHasErrors('baan_id');
        $this->assertDatabaseCount('running_clocks', 0);
    }

    public function test_start_times_and_owners_are_set_by_the_server_and_double_clock_in_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-10-19 09:00:00'));
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $this->actingAs($user)->post('/klok/in', ['baan_id' => $baan->id, 'user_id' => 999, 'started_at' => 1, 'hourly_wage' => '999.00'])
            ->assertSessionHasNoErrors()->assertRedirect('/klok');
        $clock = RunningClock::firstOrFail();
        $this->assertSame($user->id, $clock->user_id);
        $this->assertSame(now()->timestamp, $clock->started_at);
        $this->assertSame('15.50', $clock->hourly_wage);
        $this->post('/klok/in', ['baan_id' => $baan->id])->assertSessionHasErrors('clock');
        $this->assertDatabaseCount('running_clocks', 1);
    }

    public function test_clocking_out_saves_one_registration_and_prevents_duplicate_submissions(): void
    {
        $user = User::factory()->create();
        $baan = $this->startClock($user);
        $this->travel(8)->hours();
        $this->post('/klok/uit', ['break_minutes' => 30, 'duration_minutes' => 9999, 'started_at' => 1])
            ->assertSessionHasNoErrors()->assertRedirect('/klok');
        $entry = HourEntry::firstOrFail();
        $this->assertSame($user->id, $entry->user_id);
        $this->assertSame($baan->id, $entry->baan_id);
        $this->assertSame('2026-10-19', $entry->work_date->format('Y-m-d'));
        $this->assertSame('09:00', substr($entry->start_time, 0, 5));
        $this->assertSame('17:00', substr($entry->end_time, 0, 5));
        $this->assertSame(450, $entry->duration_minutes);
        $this->assertSame(11625, $entry->earningsCents());
        $this->assertDatabaseCount('running_clocks', 0);
        $this->post('/klok/uit', ['break_minutes' => 0])->assertSessionHasErrors('clock');
        $this->assertDatabaseCount('hour_entries', 1);
    }

    public function test_a_clock_can_stop_after_its_job_is_changed_and_deleted(): void
    {
        $user = User::factory()->create();
        $baan = $this->startClock($user);
        $baan->update(['name' => 'Nieuwe naam', 'hourly_wage' => '25.00']);
        $baan->delete();
        $this->travel(1)->hours();
        $this->post('/klok/uit', ['break_minutes' => 0])->assertSessionHasNoErrors()->assertRedirect('/klok');
        $entry = HourEntry::firstOrFail();
        $this->assertNull($entry->baan_id);
        $this->assertSame('Winkel', $entry->baan_name);
        $this->assertSame('15.50', $entry->hourly_wage);
        $this->assertSame(60, $entry->duration_minutes);
    }

    public function test_invalid_breaks_keep_the_clock_running_without_creating_hours(): void
    {
        $this->startClock(User::factory()->create());
        $this->travel(10)->minutes();
        foreach ([-1, 10, 11, '1.5', ''] as $pause) {
            $this->post('/klok/uit', ['break_minutes' => $pause])->assertSessionHasErrors('break_minutes');
            $this->assertDatabaseCount('running_clocks', 1);
            $this->assertDatabaseCount('hour_entries', 0);
        }
    }

    public function test_clocking_out_too_soon_keeps_the_clock_running(): void
    {
        $this->startClock(User::factory()->create());
        $this->travel(59)->seconds();
        $this->post('/klok/uit', ['break_minutes' => 0])->assertSessionHasErrors('clock');
        $this->assertDatabaseCount('running_clocks', 1);
        $this->travel(1)->seconds();
        $this->post('/klok/uit', ['break_minutes' => 0])->assertSessionHasNoErrors()->assertRedirect('/klok');
        $this->assertSame(1, HourEntry::firstOrFail()->duration_minutes);
    }

    public function test_cancelling_a_clock_does_not_save_hours_or_affect_other_users(): void
    {
        $user = User::factory()->create();
        $this->startClock($user);
        $otherUser = User::factory()->create();
        $this->startClock($otherUser);
        $this->actingAs($user)->delete('/klok')->assertRedirect('/klok');
        $this->assertDatabaseMissing('running_clocks', ['user_id' => $user->id]);
        $this->assertDatabaseHas('running_clocks', ['user_id' => $otherUser->id]);
        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_an_overnight_clock_uses_the_start_date(): void
    {
        $this->startClock(User::factory()->create());
        $this->travelTo(Carbon::parse('2026-10-19 22:00:00'));
        RunningClock::firstOrFail()->update(['started_at' => now()->timestamp]);
        $this->travel(8)->hours();
        $this->post('/klok/uit', ['break_minutes' => 30])->assertSessionHasNoErrors();
        $entry = HourEntry::firstOrFail();
        $this->assertSame('2026-10-19', $entry->work_date->format('Y-m-d'));
        $this->assertSame(450, $entry->duration_minutes);
        $this->assertSame('06:00', substr($entry->end_time, 0, 5));
    }

    public function test_elapsed_time_remains_correct_when_daylight_saving_time_ends(): void
    {
        $this->startClock(User::factory()->create());
        $this->travelTo(Carbon::parse('2026-10-25T01:30:00+02:00'));
        RunningClock::firstOrFail()->update(['started_at' => now()->timestamp]);
        $this->travelTo(Carbon::parse('2026-10-25T03:30:00+01:00'));
        $this->post('/klok/uit', ['break_minutes' => 0])->assertSessionHasNoErrors();
        $this->assertSame(180, HourEntry::firstOrFail()->duration_minutes);
    }
}
