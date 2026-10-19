<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateUserRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_change_roles(): void
    {
        $user = User::factory()->create();

        $this->patch(route('admin.users.role', $user), ['role' => Role::Admin->value])
            ->assertRedirect('/login');

        $this->assertSame(Role::User, $user->fresh()->role);
    }

    public function test_regular_users_cannot_change_roles(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($actor)
            ->patch(route('admin.users.role', $target), ['role' => Role::Admin->value])
            ->assertForbidden();

        $this->assertSame(Role::User, $target->fresh()->role);
    }

    public function test_admins_can_promote_and_demote_users(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin)
            ->patch(route('admin.users.role', $target), ['role' => Role::Admin->value])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHas('status', 'Rol bijgewerkt.');

        $this->assertSame(Role::Admin, $target->fresh()->role);

        $this->patch(route('admin.users.role', $target), ['role' => Role::User->value])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.users.index'));

        $this->assertSame(Role::User, $target->fresh()->role);
    }

    public function test_the_last_admin_cannot_be_demoted(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->from(route('admin.users.index'))
            ->patch(route('admin.users.role', $admin), ['role' => Role::User->value])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasErrors('role');

        $this->assertSame(Role::Admin, $admin->fresh()->role);
    }

    public function test_invalid_roles_are_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin)
            ->from(route('admin.users.index'))
            ->patch(route('admin.users.role', $target), ['role' => 'superadmin'])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasErrors('role');

        $this->assertSame(Role::User, $target->fresh()->role);
    }
}
