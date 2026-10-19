<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBaanRequest;
use App\Http\Requests\UpdateBaanRequest;
use App\Models\Baan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BaanController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('banen/index', [
            'banen' => $request->user()->banen()->orderBy('name')->orderBy('id')->get(['id', 'name', 'hourly_wage']),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(StoreBaanRequest $request): RedirectResponse
    {
        $request->user()->banen()->create($request->validated());

        return to_route('banen.index')->with('status', 'Baan toegevoegd.');
    }

    public function update(UpdateBaanRequest $request, Baan $baan): RedirectResponse
    {
        $baan->update($request->validated());

        return to_route('banen.index')->with('status', 'Baan bijgewerkt.');
    }

    public function destroy(Request $request, Baan $baan): RedirectResponse
    {
        abort_unless($baan->user_id === $request->user()->id, 403);

        $baan->delete();

        return to_route('banen.index')->with('status', 'Baan verwijderd.');
    }
}
