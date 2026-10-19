<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/admin/users')->assertRedirect('/login');
    }

    public function test_regular_users_cannot_view_the_users_list(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin/users')
            ->assertForbidden();
    }

    public function test_admins_see_users_ordered_by_name(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Admin Anna', 'email' => 'anna@example.com']);
        User::factory()->create(['name' => 'Zara User', 'email' => 'zara@example.com']);
        User::factory()->create(['name' => 'Bert User', 'email' => 'bert@example.com']);

        $this->actingAs($admin)
            ->get('/admin/users')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/index')
                ->has('users', 3)
                ->where('users.0.name', 'Admin Anna')
                ->where('users.0.role', Role::Admin->value)
                ->where('users.1.name', 'Bert User')
                ->where('users.1.role', Role::User->value)
                ->where('users.2.name', 'Zara User'));
    }
}
