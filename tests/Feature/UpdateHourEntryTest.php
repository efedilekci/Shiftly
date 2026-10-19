<?php

namespace Tests\Feature;

use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateHourEntryTest extends TestCase
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

    private function entryData(HourEntry $entry, array $overrides = []): array
    {
        return array_replace([
            'baan_id' => $entry->baan_id,
            'work_date' => '2026-10-20',
            'start_time' => '22:15',
            'end_time' => '06:45',
            'break_minutes' => 45,
        ], $overrides);
    }

    public function test_users_can_update_their_own_hours_and_minutes_are_recalculated(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $otherUser = User::factory()->create();

        $this->actingAs($user)->put(route('uren.update', $entry), $this->entryData($entry, [
            'user_id' => $otherUser->id,
            'duration_minutes' => 9999,
            'baan_name' => 'Vervalst',
            'hourly_wage' => '999.00',
        ]))->assertSessionHasNoErrors()->assertRedirect('/uren')->assertSessionHas('status', 'Uren bijgewerkt.');

        $entry->refresh();
        $this->assertSame('2026-10-20', $entry->work_date->format('Y-m-d'));
        $this->assertSame('22:15', substr($entry->start_time, 0, 5));
        $this->assertSame('06:45', substr($entry->end_time, 0, 5));
        $this->assertSame(45, $entry->break_minutes);
        $this->assertSame(465, $entry->duration_minutes);
        $this->assertSame($user->id, $entry->user_id);
        $this->assertSame('Winkel', $entry->baan_name);
        $this->assertSame('15.00', $entry->hourly_wage);
        $this->assertDatabaseCount('hour_entries', 1);
    }

    public function test_users_cannot_update_another_users_hours(): void
    {
        $entry = $this->createEntry(User::factory()->create());
        $this->actingAs(User::factory()->create())->put(route('uren.update', $entry), $this->entryData($entry))
            ->assertForbidden();
        $this->assertSame(450, $entry->fresh()->duration_minutes);
        $this->assertSame('2026-10-19', $entry->fresh()->work_date->format('Y-m-d'));
    }

    public function test_guests_cannot_update_hours(): void
    {
        $entry = $this->createEntry(User::factory()->create());
        $this->put(route('uren.update', $entry), $this->entryData($entry))->assertRedirect('/login');
        $this->assertSame(450, $entry->fresh()->duration_minutes);
    }

    public function test_invalid_updates_do_not_change_the_existing_registration(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $this->actingAs($user);
        foreach ([
            ['work_date', '2026-02-30'], ['start_time', '25:00'], ['end_time', '22:15'],
            ['break_minutes', 510], ['break_minutes', -1], ['break_minutes', '1.5'],
            ['baan_id', null],
        ] as [$field, $value]) {
            $this->from('/uren')->put(route('uren.update', $entry), $this->entryData($entry, [$field => $value]))
                ->assertRedirect('/uren')->assertSessionHasErrors($field);
        }
        $this->assertSame(450, $entry->fresh()->duration_minutes);
        $this->assertSame('2026-10-19', $entry->fresh()->work_date->format('Y-m-d'));
    }

    public function test_users_can_switch_to_another_own_job_but_not_someone_elses_job(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $otherJob = User::factory()->create()->banen()->create(['name' => 'Prive', 'hourly_wage' => '99.00']);
        $ownJob = $user->banen()->create(['name' => 'Bakkerij', 'hourly_wage' => '17.50']);

        $this->actingAs($user)->put(route('uren.update', $entry), $this->entryData($entry, ['baan_id' => $otherJob->id]))
            ->assertSessionHasErrors('baan_id');
        $this->assertSame('Winkel', $entry->fresh()->baan_name);

        $this->put(route('uren.update', $entry), $this->entryData($entry, ['baan_id' => $ownJob->id]))
            ->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertSame($ownJob->id, $entry->fresh()->baan_id);
        $this->assertSame('Bakkerij', $entry->fresh()->baan_name);
        $this->assertSame('17.50', $entry->fresh()->hourly_wage);
    }

    public function test_changing_times_preserves_the_original_job_details_and_hourly_wage(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $entry->baan->update(['name' => 'Nieuwe naam', 'hourly_wage' => '20.00']);

        $this->actingAs($user)->put(route('uren.update', $entry), $this->entryData($entry))
            ->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertSame('Winkel', $entry->fresh()->baan_name);
        $this->assertSame('15.00', $entry->fresh()->hourly_wage);
    }

    public function test_hours_for_a_deleted_job_can_still_be_updated(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $entry->baan->delete();
        $entry->refresh();
        $data = $this->entryData($entry);
        unset($data['baan_id']);

        $this->actingAs($user)->put(route('uren.update', $entry), $data)
            ->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertNull($entry->fresh()->baan_id);
        $this->assertSame('Winkel', $entry->fresh()->baan_name);
        $this->assertSame('15.00', $entry->fresh()->hourly_wage);
        $this->assertSame(465, $entry->fresh()->duration_minutes);
    }

    public function test_updating_missing_hours_returns_not_found(): void
    {
        $this->actingAs(User::factory()->create())->put('/uren/999999', [])->assertNotFound();
    }

    public function test_updates_that_overlap_another_registration_are_rejected(): void
    {
        $user = User::factory()->create();
        $first = $this->createEntry($user);
        $second = $user->hourEntries()->create([
            'baan_id' => $first->baan_id,
            'baan_name' => $first->baan_name,
            'hourly_wage' => $first->hourly_wage,
            'work_date' => '2026-10-19',
            'start_time' => '18:00',
            'end_time' => '20:00',
            'break_minutes' => 0,
            'duration_minutes' => 120,
        ]);

        $this->actingAs($user)->from('/uren')->put(route('uren.update', $second), [
            'baan_id' => $second->baan_id,
            'work_date' => '2026-10-19',
            'start_time' => '16:00',
            'end_time' => '19:00',
            'break_minutes' => 0,
        ])->assertRedirect('/uren')->assertSessionHasErrors('start_time');

        $this->assertSame('18:00', substr($second->fresh()->start_time, 0, 5));

        $this->put(route('uren.update', $first), [
            'baan_id' => $first->baan_id,
            'work_date' => '2026-10-19',
            'start_time' => '10:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ])->assertSessionHasNoErrors()->assertRedirect('/uren');
    }
}
