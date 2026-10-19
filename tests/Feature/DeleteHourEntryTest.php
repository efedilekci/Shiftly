<?php

namespace Tests\Feature;

use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteHourEntryTest extends TestCase
{
    use RefreshDatabase;

    private function createEntry(User $user): HourEntry
    {
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        return $user->hourEntries()->create([
            'baan_id' => $baan->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
            'duration_minutes' => 450,
        ]);
    }

    public function test_users_can_delete_their_own_hours_without_affecting_other_data(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $baan = $entry->baan;
        $ownOtherEntry = $this->createEntry($user);
        $otherEntry = $this->createEntry(User::factory()->create());

        $this->actingAs($user)->delete(route('uren.destroy', $entry))
            ->assertRedirect('/uren')->assertSessionHas('status', 'Uren verwijderd.');

        $this->assertModelMissing($entry);
        $this->assertModelExists($baan);
        $this->assertModelExists($user);
        $this->assertModelExists($ownOtherEntry);
        $this->assertModelExists($otherEntry);
        $this->assertDatabaseCount('hour_entries', 2);
    }

    public function test_users_cannot_delete_another_users_hours(): void
    {
        $entry = $this->createEntry(User::factory()->create());

        $this->actingAs(User::factory()->create())->delete(route('uren.destroy', $entry))
            ->assertForbidden();

        $this->assertModelExists($entry);
    }

    public function test_guests_cannot_delete_hours(): void
    {
        $entry = $this->createEntry(User::factory()->create());

        $this->delete(route('uren.destroy', $entry))->assertRedirect('/login');

        $this->assertModelExists($entry);
    }

    public function test_hours_for_a_deleted_job_can_still_be_deleted(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $entry->baan->delete();
        $this->assertNull($entry->fresh()->baan_id);

        $this->actingAs($user)->delete(route('uren.destroy', $entry))->assertRedirect('/uren');

        $this->assertModelMissing($entry);
        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_deleting_missing_hours_returns_not_found(): void
    {
        $this->actingAs(User::factory()->create())->delete('/uren/999999')->assertNotFound();
    }
}
