<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HourEntryIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('admin.uren.index'))->assertRedirect('/login');
    }

    public function test_regular_users_cannot_view_all_hours(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.uren.index'))
            ->assertForbidden();
    }

    public function test_admins_can_view_hours_across_users(): void
    {
        $admin = User::factory()->admin()->create();
        $sara = User::factory()->create(['name' => 'Sara Bakker']);
        $tom = User::factory()->create(['name' => 'Tom Jansen']);

        $saraBaan = $sara->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $tomBaan = $tom->banen()->create(['name' => 'Zorg', 'hourly_wage' => '22.00']);

        $this->actingAs($sara)->post('/uren', [
            'baan_id' => $saraBaan->id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
            'note' => 'Maandag',
        ])->assertRedirect('/uren');

        $this->actingAs($tom)->post('/uren', [
            'baan_id' => $tomBaan->id,
            'work_date' => '2026-10-18',
            'start_time' => '07:00',
            'end_time' => '15:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        $this->actingAs($admin)
            ->get(route('admin.uren.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/uren/index')
                ->has('entries', 2)
                ->where('entries.0.user_name', 'Sara Bakker')
                ->where('entries.0.baan_name', 'Winkel')
                ->where('entries.0.note', 'Maandag')
                ->where('entries.1.user_name', 'Tom Jansen')
                ->has('users', 3)
                ->where('users', fn ($users) => collect($users)->pluck('name')->sort()->values()->all() === collect([
                    $admin->name,
                    'Sara Bakker',
                    'Tom Jansen',
                ])->sort()->values()->all()));
    }
}
