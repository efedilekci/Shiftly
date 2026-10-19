<?php

namespace Tests\Feature\Admin;

use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DeleteUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_delete_users(): void
    {
        $user = User::factory()->create();

        $this->delete(route('admin.users.destroy', $user))->assertRedirect('/login');
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_regular_users_cannot_delete_users(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($actor)
            ->delete(route('admin.users.destroy', $target))
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_admins_can_delete_a_user_and_related_data(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create(['name' => 'Sara Bakker']);
        $baan = $target->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
        $target->hourEntries()->create([
            'baan_id' => $baan->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
            'duration_minutes' => 450,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $target))
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHas('status', 'Sara Bakker is verwijderd.');

        $this->get(route('admin.users.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/index')
                ->where('status', 'Sara Bakker is verwijderd.')
                ->where('flash.status', 'Sara Bakker is verwijderd.'));

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
        $this->assertDatabaseMissing('banen', ['id' => $baan->id]);
        $this->assertSame(0, HourEntry::query()->count());
    }

    public function test_admins_can_delete_another_admin_when_one_remains(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create(['name' => 'Admin Demo']);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $otherAdmin))
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHas('status', 'Admin Demo is verwijderd.');

        $this->assertDatabaseMissing('users', ['id' => $otherAdmin->id]);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admins_cannot_delete_themselves(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->admin()->create();

        $this->actingAs($admin)
            ->from(route('admin.users.show', $admin))
            ->delete(route('admin.users.destroy', $admin))
            ->assertRedirect(route('admin.users.show', $admin))
            ->assertSessionHasErrors('user');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_show_page_exposes_delete_guards(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin)
            ->get(route('admin.users.show', $target))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('can_delete', true)
                ->where('delete_blocked_reason', null));

        $this->get(route('admin.users.show', $admin))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('can_delete', false)
                ->where('delete_blocked_reason', 'Je kunt jezelf niet verwijderen.'));
    }
}
