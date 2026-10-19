<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClockController extends Controller
{
    public function index(Request $request): Response
    {
        $clock = $request->user()->runningClock()->first();

        return Inertia::render('klok/index', [
            'activeClock' => $clock ? ['baan_name' => $clock->baan_name, 'started_at' => $clock->started_at] : null,
            'banen' => $request->user()->banen()->orderBy('name')->get(['id', 'name', 'hourly_wage']),
            'serverNow' => now()->timestamp,
            'timezone' => config('app.timezone'),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function start(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'baan_id' => ['required', 'integer', Rule::exists('banen', 'id')->where('user_id', $request->user()->id)],
        ], [
            'baan_id.required' => 'Kies een baan.',
            'baan_id.integer' => 'Kies een geldige baan.',
            'baan_id.exists' => 'Deze baan is niet beschikbaar.',
        ]);

        DB::transaction(function () use ($request, $data) {
            // Lock the user so simultaneous requests cannot start two clocks.
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            if ($user->runningClock()->exists()) {
                throw ValidationException::withMessages(['clock' => 'Je bent al ingeklokt.']);
            }
            $baan = $user->banen()->findOrFail($data['baan_id']);
            $user->runningClock()->create([
                'baan_id' => $baan->id,
                'baan_name' => $baan->name,
                'hourly_wage' => $baan->hourly_wage,
                'started_at' => now()->timestamp,
            ]);
        });

        return to_route('clock.index');
    }

    public function stop(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'break_minutes' => ['required', 'integer', 'min:0', 'max:1439'],
        ], [
            'break_minutes.required' => 'Vul de pauze in minuten in, of 0 als je geen pauze had.',
            'break_minutes.integer' => 'Vul een heel aantal minuten in.',
            'break_minutes.min' => 'De pauze mag niet negatief zijn.',
            'break_minutes.max' => 'De pauze moet korter zijn dan een dag.',
        ]);

        DB::transaction(function () use ($request, $data) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $clock = $user->runningClock()->first();
            if (! $clock) {
                throw ValidationException::withMessages(['clock' => 'Je bent niet ingeklokt.']);
            }
            $end = now();
            $grossMinutes = intdiv(max(0, $end->timestamp - $clock->started_at), 60);
            if ($grossMinutes < 1) {
                throw ValidationException::withMessages(['clock' => 'Je kunt na Ã©Ã©n minuut uitklokken.']);
            }
            if ($grossMinutes > 65535) {
                throw ValidationException::withMessages(['clock' => 'Deze dienst is te lang. Voeg de uren handmatig toe en annuleer de dienst.']);
            }
            if ((int) $data['break_minutes'] >= $grossMinutes) {
                throw ValidationException::withMessages(['break_minutes' => 'De pauze moet korter zijn dan de dienst.']);
            }
            $start = CarbonImmutable::createFromTimestampUTC($clock->started_at)->setTimezone(config('app.timezone'));
            $user->hourEntries()->create([
                'baan_id' => $clock->baan_id,
                'baan_name' => $clock->baan_name,
                'hourly_wage' => $clock->hourly_wage,
                'work_date' => $start->toDateString(),
                'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s'),
                'break_minutes' => (int) $data['break_minutes'],
                'duration_minutes' => $grossMinutes - (int) $data['break_minutes'],
            ]);
            $clock->delete();
        });

        return to_route('clock.index')->with('status', 'Uitgeklokt. Je uren zijn opgeslagen.');
    }

    public function cancel(Request $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $user->runningClock()->delete();
        });

        return to_route('clock.index')->with('status', 'Dienst geannuleerd.');
    }
}
