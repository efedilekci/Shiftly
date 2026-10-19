<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClockPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_clock_preferences(): void
    {
        $this->get(route('clock-preferences.edit'))->assertRedirect('/login');
    }

    public function test_users_can_view_clock_preferences(): void
    {
        $user = User::factory()->create([
            'open_clock_reminder_after_minutes' => 120,
        ]);

        $this->actingAs($user)
            ->get(route('clock-preferences.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/klok')
                ->where('reminder_amount', 2)
                ->where('reminder_unit', 'hours'));
    }

    public function test_users_can_save_reminder_in_minutes_and_hours(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('clock-preferences.update'), [
                'reminder_amount' => 45,
                'reminder_unit' => 'minutes',
            ])
            ->assertRedirect(route('clock-preferences.edit'))
            ->assertSessionHas('status', 'Klokherinnering bijgewerkt.');

        $this->assertSame(45, $user->fresh()->open_clock_reminder_after_minutes);

        $this->patch(route('clock-preferences.update'), [
            'reminder_amount' => 3,
            'reminder_unit' => 'hours',
        ])->assertRedirect(route('clock-preferences.edit'));

        $this->assertSame(180, $user->fresh()->open_clock_reminder_after_minutes);
    }

    public function test_reminder_above_24_hours_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('clock-preferences.edit'))
            ->patch(route('clock-preferences.update'), [
                'reminder_amount' => 25,
                'reminder_unit' => 'hours',
            ])
            ->assertRedirect(route('clock-preferences.edit'))
            ->assertSessionHasErrors('reminder_amount');

        $this->assertSame(0, $user->fresh()->open_clock_reminder_after_minutes);
    }
}
