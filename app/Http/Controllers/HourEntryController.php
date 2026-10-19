<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHourEntryRequest;
use App\Http\Requests\UpdateHourEntryRequest;
use App\Models\HourEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HourEntryController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('uren/index', [
            'entries' => $request->user()->hourEntries()->orderByDesc('work_date')->orderByDesc('start_time')->orderByDesc('id')
                ->get()->map(fn (HourEntry $entry) => [
                    'id' => $entry->id,
                    'baan_id' => $entry->baan_id,
                    'baan_name' => $entry->baan_name,
                    'work_date' => $entry->work_date->format('Y-m-d'),
                    'start_time' => substr($entry->start_time, 0, 5),
                    'end_time' => substr($entry->end_time, 0, 5),
                    'break_minutes' => $entry->break_minutes,
                    'duration_minutes' => $entry->duration_minutes,
                ]),
            'banen' => $request->user()->banen()->orderBy('name')->get(['id', 'name', 'hourly_wage']),
            'today' => now()->toDateString(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(StoreHourEntryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $baan = $request->user()->banen()->findOrFail($data['baan_id']);

        $request->user()->hourEntries()->create([
            ...$data,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'duration_minutes' => HourEntry::grossMinutes($data['start_time'], $data['end_time']) - (int) $data['break_minutes'],
        ]);

        return to_route('uren.index')->with('status', 'Uren toegevoegd.');
    }

    public function update(UpdateHourEntryRequest $request, HourEntry $hourEntry): RedirectResponse
    {
        $data = $request->validated();
        $baanId = isset($data['baan_id']) ? (int) $data['baan_id'] : null;
        $data['baan_id'] = $baanId;

        if ($baanId !== $hourEntry->baan_id) {
            $baan = $request->user()->banen()->findOrFail($baanId);
            $data['baan_name'] = $baan->name;
            $data['hourly_wage'] = $baan->hourly_wage;
        }

        $hourEntry->update([
            ...$data,
            'duration_minutes' => HourEntry::grossMinutes($data['start_time'], $data['end_time']) - (int) $data['break_minutes'],
        ]);

        return to_route('uren.index')->with('status', 'Uren bijgewerkt.');
    }

    public function destroy(Request $request, HourEntry $hourEntry): RedirectResponse
    {
        abort_unless($hourEntry->user_id === $request->user()->id, 403);

        $hourEntry->delete();

        return to_route('uren.index')->with('status', 'Uren verwijderd.');
    }
}
