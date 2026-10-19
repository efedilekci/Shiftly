<?php

namespace Tests\Feature;

use App\Models\Baan;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HourEntryTest extends TestCase
{
    use RefreshDatabase;

    private function entryData(Baan $baan, array $overrides = []): array
    {
        return array_replace([
            'baan_id' => $baan->id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ], $overrides);
    }

    public function test_guests_cannot_view_or_add_hours(): void
    {
        $this->get('/uren')->assertRedirect('/login');
        $this->post('/uren', [])->assertRedirect('/login');
        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_users_without_jobs_can_view_an_empty_overview(): void
    {
        $this->actingAs(User::factory()->create())->get('/uren')
            ->assertInertia(fn (Assert $page) => $page->component('uren/index')->has('entries', 0)->has('banen', 0));
    }

    public function test_worked_minutes_are_calculated_on_the_server_and_job_details_are_saved(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);

        $this->actingAs($user)->post('/uren', $this->entryData($baan, [
            'user_id' => $other->id,
            'duration_minutes' => 9999,
            'baan_name' => 'Vervalst',
            'hourly_wage' => '999.00',
        ]))->assertSessionHasNoErrors()->assertRedirect('/uren')->assertSessionHas('status', 'Uren toegevoegd.');

        $entry = HourEntry::firstOrFail();
        $this->assertSame($user->id, $entry->user_id);
        $this->assertSame('Winkel', $entry->baan_name);
        $this->assertSame('15.50', $entry->hourly_wage);
        $this->assertSame(450, $entry->duration_minutes);
        $this->assertSame(30, $entry->break_minutes);
    }

    public function test_users_only_see_their_own_hours_and_jobs_with_latest_dates_first(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $other = User::factory()->create();
        $otherBaan = $other->banen()->create(['name' => 'Prive', 'hourly_wage' => '20.00']);
        $this->actingAs($other)->post('/uren', $this->entryData($otherBaan))->assertRedirect('/uren');
        $this->actingAs($user)->post('/uren', $this->entryData($baan, ['work_date' => '2026-10-18']))->assertRedirect('/uren');
        $this->post('/uren', $this->entryData($baan))->assertRedirect('/uren');

        $this->get('/uren')->assertInertia(fn (Assert $page) => $page
            ->component('uren/index')
            ->has('entries', 2)
            ->where('entries.0.work_date', '2026-10-19')
            ->where('entries.0.baan_name', 'Winkel')
            ->where('entries.0.start_time', '09:00')
            ->where('entries.0.duration_minutes', 450)
            ->where('entries.1.work_date', '2026-10-18')
            ->has('banen', 1)
            ->where('banen.0.id', $baan->id)
        );
    }

    public function test_overnight_shifts_and_a_one_minute_shift_are_calculated_correctly(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $this->actingAs($user);

        $this->post('/uren', $this->entryData($baan, ['start_time' => '22:15', 'end_time' => '06:45', 'break_minutes' => 45]))
            ->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertSame(465, HourEntry::firstOrFail()->duration_minutes);

        $this->post('/uren', $this->entryData($baan, [
            'work_date' => '2026-10-20',
            'start_time' => '23:59',
            'end_time' => '00:00',
            'break_minutes' => 0,
        ]))->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertSame(1, HourEntry::latest('id')->firstOrFail()->duration_minutes);
    }

    public function test_equal_start_and_end_times_are_rejected(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->actingAs($user)->from('/uren')->post('/uren', $this->entryData($baan, ['end_time' => '09:00']))
            ->assertRedirect('/uren')->assertSessionHasErrors('end_time');
        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_invalid_dates_times_and_breaks_are_rejected_without_saving_hours(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $this->actingAs($user);

        foreach ([
            ['work_date', '2026-02-30'], ['work_date', ''],
            ['start_time', '25:00'], ['start_time', ['09:00']], ['end_time', '17:99'],
            ['break_minutes', -1], ['break_minutes', 480], ['break_minutes', 500],
            ['break_minutes', '1.5'], ['break_minutes', ''],
        ] as [$field, $value]) {
            $this->from('/uren')->post('/uren', $this->entryData($baan, [$field => $value]))
                ->assertRedirect('/uren')->assertSessionHasErrors($field);
        }

        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_hours_cannot_be_added_to_another_users_or_a_missing_job(): void
    {
        $user = User::factory()->create();
        $otherBaan = User::factory()->create()->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->actingAs($user)->post('/uren', $this->entryData($otherBaan))->assertSessionHasErrors('baan_id');
        $this->post('/uren', $this->entryData($otherBaan, ['baan_id' => 999999]))->assertSessionHasErrors('baan_id');
        $this->assertDatabaseCount('hour_entries', 0);
    }

    public function test_overlapping_hours_are_rejected_but_adjacent_hours_are_allowed(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $this->actingAs($user)->post('/uren', $this->entryData($baan, [
            'start_time' => '09:00',
            'end_time' => '13:00',
            'break_minutes' => 0,
        ]))->assertSessionHasNoErrors()->assertRedirect('/uren');

        $this->from('/uren')->post('/uren', $this->entryData($baan, [
            'start_time' => '12:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ]))->assertRedirect('/uren')->assertSessionHasErrors('start_time');

        $this->assertDatabaseCount('hour_entries', 1);

        $this->post('/uren', $this->entryData($baan, [
            'start_time' => '13:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ]))->assertSessionHasNoErrors()->assertRedirect('/uren');

        $this->assertDatabaseCount('hour_entries', 2);
    }

    public function test_overnight_hours_overlap_the_next_morning(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $this->actingAs($user)->post('/uren', $this->entryData($baan, [
            'work_date' => '2026-10-19',
            'start_time' => '22:00',
            'end_time' => '06:00',
            'break_minutes' => 0,
        ]))->assertSessionHasNoErrors()->assertRedirect('/uren');

        $this->from('/uren')->post('/uren', $this->entryData($baan, [
            'work_date' => '2026-10-20',
            'start_time' => '05:00',
            'end_time' => '08:00',
            'break_minutes' => 0,
        ]))->assertRedirect('/uren')->assertSessionHasErrors('start_time');

        $this->assertDatabaseCount('hour_entries', 1);
    }

    public function test_optional_notes_are_trimmed_and_limited(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);

        $this->actingAs($user)->post('/uren', $this->entryData($baan, ['note' => '  Avonddienst  ']))
            ->assertSessionHasNoErrors()
            ->assertRedirect('/uren');

        $this->assertSame('Avonddienst', HourEntry::firstOrFail()->note);

        $this->get('/uren')->assertInertia(fn (Assert $page) => $page
            ->component('uren/index')
            ->where('entries.0.note', 'Avonddienst'));

        $this->post('/uren', $this->entryData($baan, [
            'work_date' => '2026-10-20',
            'note' => '',
        ]))->assertSessionHasNoErrors()
            ->assertRedirect('/uren');
        $this->assertNull(HourEntry::latest('id')->firstOrFail()->note);

        $this->from('/uren')->post('/uren', $this->entryData($baan, [
            'work_date' => '2026-10-21',
            'note' => str_repeat('a', 501),
        ]))->assertRedirect('/uren')
            ->assertSessionHasErrors('note');
    }

    public function test_recorded_hours_keep_the_original_job_details_when_a_job_changes_or_is_deleted(): void
    {
        $user = User::factory()->create();
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.00']);
        $this->actingAs($user)->post('/uren', $this->entryData($baan))->assertRedirect('/uren');
        $this->put(route('banen.update', $baan), ['name' => 'Nieuwe naam', 'hourly_wage' => '20.00'])->assertRedirect('/banen');
        $this->delete(route('banen.destroy', $baan))->assertRedirect('/banen');

        $entry = HourEntry::firstOrFail();
        $this->assertNull($entry->baan_id);
        $this->assertSame('Winkel', $entry->baan_name);
        $this->assertSame('15.00', $entry->hourly_wage);
        $this->assertSame(450, $entry->duration_minutes);
        $this->get('/uren')->assertInertia(fn (Assert $page) => $page
            ->component('uren/index')->has('entries', 1)->where('entries.0.baan_name', 'Winkel')->has('banen', 0));
    }
}
