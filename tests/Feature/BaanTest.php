<?php

namespace Tests\Feature;

use App\Models\Baan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BaanTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_or_add_jobs(): void
    {
        $this->get('/banen')->assertRedirect('/login');
        $this->post('/banen', ['name' => 'Winkel', 'hourly_wage' => '15.50'])->assertRedirect('/login');
        $this->assertDatabaseCount('banen', 0);
    }

    public function test_users_only_see_their_own_jobs_in_name_order(): void
    {
        $user = User::factory()->create();
        $user->banen()->create(['name' => 'Zorg', 'hourly_wage' => '20.00']);
        $user->banen()->create(['name' => 'Bakkerij', 'hourly_wage' => '15.50']);
        User::factory()->create()->banen()->create(['name' => 'Andere gebruiker', 'hourly_wage' => '99.00']);

        $this->actingAs($user)->get('/banen')->assertInertia(fn (Assert $page) => $page
            ->component('banen/index')
            ->has('banen', 2)
            ->where('banen.0.name', 'Bakkerij')
            ->where('banen.0.hourly_wage', '15.50')
            ->where('banen.1.name', 'Zorg')
        );
    }

    public function test_users_without_jobs_see_an_empty_list(): void
    {
        $this->actingAs(User::factory()->create())->get('/banen')
            ->assertInertia(fn (Assert $page) => $page->component('banen/index')->has('banen', 0));
    }

    public function test_a_job_is_saved_for_the_logged_in_user_even_if_another_owner_is_submitted(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->actingAs($user)->post('/banen', [
            'name' => 'Winkel',
            'hourly_wage' => '15,50',
            'user_id' => $otherUser->id,
        ])->assertSessionHasNoErrors()->assertRedirect('/banen')->assertSessionHas('status', 'Baan toegevoegd.');

        $this->assertDatabaseHas('banen', ['user_id' => $user->id, 'name' => 'Winkel', 'hourly_wage' => '15.50']);
        $this->assertDatabaseMissing('banen', ['user_id' => $otherUser->id]);
        $this->assertSame('15.50', Baan::firstOrFail()->hourly_wage);
    }

    public function test_zero_and_the_maximum_hourly_wage_are_accepted(): void
    {
        $this->actingAs(User::factory()->create());

        foreach (['0', '99999.99'] as $wage) {
            $this->post('/banen', ['name' => 'Werk', 'hourly_wage' => $wage])
                ->assertSessionHasNoErrors()->assertRedirect('/banen');
        }

        $this->assertDatabaseCount('banen', 2);
    }

    public function test_invalid_hourly_wages_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());

        foreach (['', '-1', '100000', '15.555', 'geen bedrag', ['15']] as $wage) {
            $this->from('/banen')->post('/banen', ['name' => 'Winkel', 'hourly_wage' => $wage])
                ->assertSessionHasErrors('hourly_wage')->assertRedirect('/banen');
        }

        $this->assertDatabaseCount('banen', 0);
    }

    public function test_a_job_needs_a_valid_name(): void
    {
        $this->actingAs(User::factory()->create());

        foreach (['', '   ', str_repeat('a', 256)] as $name) {
            $this->post('/banen', ['name' => $name, 'hourly_wage' => '15'])
                ->assertSessionHasErrors('name');
        }

        $this->assertDatabaseCount('banen', 0);
    }

    public function test_users_can_update_their_own_job_without_changing_its_owner(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->actingAs($user)->put(route('banen.update', $baan), [
            'name' => 'Bakkerij',
            'hourly_wage' => '17,25',
            'user_id' => $otherUser->id,
        ])->assertSessionHasNoErrors()->assertRedirect('/banen')->assertSessionHas('status', 'Baan bijgewerkt.');

        $baan->refresh();
        $this->assertSame('Bakkerij', $baan->name);
        $this->assertSame('17.25', $baan->hourly_wage);
        $this->assertSame($user->id, $baan->user_id);
        $this->assertDatabaseCount('banen', 1);
    }

    public function test_users_cannot_update_another_users_job(): void
    {
        $baan = User::factory()->create()->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->actingAs(User::factory()->create())->put(route('banen.update', $baan), [
            'name' => 'Aangepast',
            'hourly_wage' => '99.00',
        ])->assertForbidden();

        $this->assertSame('Winkel', $baan->fresh()->name);
        $this->assertSame('15.00', $baan->fresh()->hourly_wage);
    }

    public function test_guests_cannot_update_jobs(): void
    {
        $baan = User::factory()->create()->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->put(route('banen.update', $baan), ['name' => 'Aangepast', 'hourly_wage' => '99.00'])
            ->assertRedirect('/login');

        $this->assertSame('Winkel', $baan->fresh()->name);
        $this->assertSame('15.00', $baan->fresh()->hourly_wage);
    }

    public function test_invalid_updates_leave_the_job_unchanged(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $this->actingAs($user);

        foreach (['', '-1', '100000', '15.555', 'geen bedrag'] as $wage) {
            $this->from('/banen')->put(route('banen.update', $baan), ['name' => 'Aangepast', 'hourly_wage' => $wage])
                ->assertRedirect('/banen')->assertSessionHasErrors('hourly_wage');
        }
        $this->put(route('banen.update', $baan), ['name' => '   ', 'hourly_wage' => '17.25'])
            ->assertSessionHasErrors('name');

        $this->assertSame('Winkel', $baan->fresh()->name);
        $this->assertSame('15.00', $baan->fresh()->hourly_wage);
    }

    public function test_updating_a_missing_job_returns_not_found(): void
    {
        $this->actingAs(User::factory()->create())->put('/banen/999999', [
            'name' => 'Winkel',
            'hourly_wage' => '15.00',
        ])->assertNotFound();
    }

    public function test_users_can_delete_their_own_job_without_deleting_other_jobs(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $ownOtherJob = $user->banen()->create(['name' => 'Bakkerij', 'hourly_wage' => '17.00']);
        $otherJob = User::factory()->create()->banen()->create(['name' => 'Zorg', 'hourly_wage' => '20.00']);

        $this->actingAs($user)->delete(route('banen.destroy', $baan))
            ->assertRedirect('/banen')->assertSessionHas('status', 'Baan verwijderd.');

        $this->assertModelMissing($baan);
        $this->assertModelExists($ownOtherJob);
        $this->assertModelExists($otherJob);
        $this->assertDatabaseCount('banen', 2);
    }

    public function test_users_cannot_delete_another_users_job(): void
    {
        $baan = User::factory()->create()->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->actingAs(User::factory()->create())->delete(route('banen.destroy', $baan))
            ->assertForbidden();

        $this->assertModelExists($baan);
    }

    public function test_guests_cannot_delete_jobs(): void
    {
        $baan = User::factory()->create()->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->delete(route('banen.destroy', $baan))->assertRedirect('/login');

        $this->assertModelExists($baan);
    }

    public function test_deleting_a_missing_job_returns_not_found(): void
    {
        $this->actingAs(User::factory()->create())->delete('/banen/999999')->assertNotFound();
    }
}
