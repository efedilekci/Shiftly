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
    public function create(): Response
    {
        return Inertia::render('company/create');
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
}
