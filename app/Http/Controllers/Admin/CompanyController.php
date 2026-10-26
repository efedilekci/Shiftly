<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/companies/index', [
            'companies' => Company::query()
                ->with('owner:id,name,email')
                ->withCount('members')
                ->orderBy('name')
                ->get()
                ->map(fn (Company $company) => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'slug' => $company->slug,
                    'members_count' => $company->members_count,
                    'hour_approval_mode' => $company->hour_approval_mode->value,
                    'hour_approval_mode_label' => $company->hour_approval_mode->label(),
                    'owner_id' => $company->owner_user_id,
                    'owner_name' => $company->owner?->name ?? 'Onbekend',
                    'owner_email' => $company->owner?->email,
                    'created_at' => $company->created_at?->toDateString(),
                ]),
        ]);
    }
}
