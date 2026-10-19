<?php

namespace Tests\Feature;

use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EarningsTest extends TestCase
{
    use RefreshDatabase;

    private function createEntry(User $user): HourEntry
    {
        $baan = $user->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);

        $this->actingAs($user)->post('/uren', [
            'baan_id' => $baan->id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertRedirect('/uren');

        return $user->hourEntries()->firstOrFail();
    }

    public function test_earnings_use_net_minutes_and_round_half_cents_up(): void
    {
        foreach ([
            ['15.50', 450, 11625],
            ['15.50', 465, 12013],
            ['0.30', 1, 1],
            ['0.29', 1, 0],
            ['0.00', 450, 0],
        ] as [$rate, $minutes, $expectedCents]) {
            $entry = new HourEntry(['hourly_wage' => $rate, 'duration_minutes' => $minutes]);
            $this->assertSame($expectedCents, $entry->earningsCents());
        }
    }

    public function test_the_overview_keeps_historical_earnings_after_a_job_changes_or_is_deleted(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $entry->baan->update(['hourly_wage' => '25.00']);
        $this->get('/uren')->assertInertia(fn (Assert $page) => $page->component('uren/index')->where('entries.0.earnings_cents', 11625));
        $entry->baan->delete();
        $this->get('/uren')->assertInertia(fn (Assert $page) => $page->component('uren/index')->where('entries.0.earnings_cents', 11625));
    }

    public function test_changing_hours_recalculates_earnings_and_ignores_submitted_amounts(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $this->put(route('uren.update', $entry), [
            'baan_id' => $entry->baan_id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'break_minutes' => 0,
            'hourly_wage' => '999.00',
            'earnings_cents' => 999999,
        ])->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertSame(3100, $entry->fresh()->earningsCents());
        $this->get('/uren')->assertInertia(fn (Assert $page) => $page->component('uren/index')->where('entries.0.earnings_cents', 3100));
    }

    public function test_switching_jobs_uses_the_new_jobs_hourly_wage(): void
    {
        $user = User::factory()->create();
        $entry = $this->createEntry($user);
        $baan = $user->banen()->create(['name' => 'Bakkerij', 'hourly_wage' => '20.00']);
        $this->put(route('uren.update', $entry), [
            'baan_id' => $baan->id,
            'work_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'break_minutes' => 0,
        ])->assertSessionHasNoErrors()->assertRedirect('/uren');
        $this->assertSame(4000, $entry->fresh()->earningsCents());
    }
}
