<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCompanyInvitationRequest;
use App\Models\Company;
use App\Models\CompanyInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function store(StoreCompanyInvitationRequest $request, Company $company): RedirectResponse
    {
        $data = $request->validated();

        CompanyInvitation::query()->updateOrCreate(
            [
                'company_id' => $company->id,
                'email' => $data['email'],
            ],
            [
                'invited_by' => $request->user()->id,
                'role' => $data['role'],
                'token' => Str::random(64),
                'accepted_at' => null,
                'expires_at' => now()->addDays(14),
            ],
        );

        return back()->with('status', 'Uitnodiging geplaatst in de inbox van '.$data['email'].'.');
    }

    public function destroy(Company $company, CompanyInvitation $invitation): RedirectResponse
    {
        abort_unless($invitation->company_id === $company->id, 404);

        $invitation->delete();

        return back()->with('status', 'Uitnodiging ingetrokken.');
    }
}
