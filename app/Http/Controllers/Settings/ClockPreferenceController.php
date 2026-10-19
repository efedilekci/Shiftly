<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClockPreferenceController extends Controller
{
    public function edit(Request $request): Response
    {
        $minutes = (int) $request->user()->open_clock_reminder_after_minutes;
        $useHours = $minutes > 0 && $minutes % 60 === 0;

        return Inertia::render('settings/klok', [
            'reminder_amount' => $useHours ? intdiv($minutes, 60) : $minutes,
            'reminder_unit' => $useHours ? 'hours' : 'minutes',
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'reminder_amount' => ['required', 'integer', 'min:0'],
            'reminder_unit' => ['required', Rule::in(['minutes', 'hours'])],
        ], [
            'reminder_amount.required' => 'Vul een aantal in.',
            'reminder_amount.integer' => 'Vul een heel getal in.',
            'reminder_amount.min' => 'Het aantal mag niet negatief zijn.',
            'reminder_unit.in' => 'Kies minuten of uren.',
        ]);

        $amount = (int) $data['reminder_amount'];
        $minutes = $data['reminder_unit'] === 'hours' ? $amount * 60 : $amount;

        if ($minutes > 24 * 60) {
            return back()->withErrors([
                'reminder_amount' => $data['reminder_unit'] === 'hours'
                    ? 'Kies maximaal 24 uur.'
                    : 'Kies maximaal 1440 minuten (24 uur).',
            ]);
        }

        $request->user()->forceFill([
            'open_clock_reminder_after_minutes' => $minutes,
        ])->save();

        return to_route('clock-preferences.edit')->with('status', 'Klokherinnering bijgewerkt.');
    }
}
