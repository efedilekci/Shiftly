<?php

namespace App\Http\Controllers\Company;

use App\Enums\CompanyMemberRole;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CreateCompanyController extends Controller
{
    public function create(Request $request): Response
    {
        $memberships = $request->user()
            ->companyMemberships()
            ->with('company:id,name,slug')
            ->get()
            ->sortBy(fn (CompanyMember $membership) => $membership->company?->name ?? '')
            ->values()
            ->map(fn (CompanyMember $membership) => [
                'id' => $membership->id,
                'company_id' => $membership->company_id,
                'name' => $membership->company?->name ?? 'Onbekend',
                'slug' => $membership->company?->slug,
                'role' => $membership->role->value,
                'role_label' => $membership->role->label(),
                'can_leave' => $membership->role !== CompanyMemberRole::Owner,
            ]);

        return Inertia::render('company/create', [
            'memberships' => $memberships,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ], [
            'name.required' => 'Vul een bedrijfsnaam in.',
            'name.max' => 'De bedrijfsnaam mag maximaal 255 tekens zijn.',
        ]);

        $user = $request->user();

        $company = DB::transaction(function () use ($user, $data) {
            $company = Company::create([
                'name' => $data['name'],
                'owner_user_id' => $user->id,
            ]);

            CompanyMember::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'role' => CompanyMemberRole::Owner,
            ]);

            $company->ensureBaanFor($user);

            return $company;
        });

        return to_route('company.dashboard', $company)
            ->with('status', 'Bedrijf '.$company->name.' is aangemaakt.');
    }

    public function leave(Request $request, Company $company): RedirectResponse
    {
        /** @var CompanyMember $membership */
        $membership = $request->attributes->get('companyMember');

        if ($membership->role === CompanyMemberRole::Owner) {
            return back()->withErrors([
                'company' => 'Als eigenaar kun je het bedrijf niet verlaten.',
            ]);
        }

        $user = $request->user();
        $membership->delete();
        $company->removeBaanFor($user);

        return to_route('company.create')
            ->with('status', 'Je hebt '.$company->name.' verlaten. Oude uren blijven bewaard.');
    }
}
