<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OpenClockShareTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_receive_a_null_active_clock(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('activeClock', null)
                ->has('serverNow')
                ->has('timezone'));
    }

    public function test_authenticated_users_without_a_clock_receive_null(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/uren')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('uren/index')
                ->where('activeClock', null));
    }

    public function test_active_clock_is_shared_on_app_pages(): void
    {
        $this->travelTo(now()->startOfMinute());

        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $startedAt = now()->timestamp;

        $user->runningClock()->create([
            'baan_id' => $baan->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'started_at' => $startedAt,
        ]);

        $this->actingAs($user)
            ->get('/uren')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('uren/index')
                ->where('activeClock.baan_name', 'Winkel')
                ->where('activeClock.started_at', $startedAt)
                ->where('openClockReminderAfterMinutes', 0)
                ->where('serverNow', $startedAt)
                ->where('timezone', config('app.timezone')));

        $this->get('/banen')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('banen/index')
                ->where('activeClock.baan_name', 'Winkel')
                ->where('activeClock.started_at', $startedAt));
    }

    public function test_open_clock_reminder_threshold_is_shared_from_user_settings(): void
    {
        $user = User::factory()->create([
            'open_clock_reminder_after_minutes' => 90,
        ]);

        $this->actingAs($user)
            ->get('/uren')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('openClockReminderAfterMinutes', 90));
    }
}
