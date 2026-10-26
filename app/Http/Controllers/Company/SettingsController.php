<?php

namespace App\Http\Controllers\Company;

use App\Enums\CompanyHourApprovalMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Company\UpdateCompanySettingsRequest;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request, Company $company): Response
    {
        return Inertia::render('company/settings', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'hour_approval_mode' => $company->hour_approval_mode->value,
            ],
            'hourApprovalModes' => collect(CompanyHourApprovalMode::cases())
                ->map(fn (CompanyHourApprovalMode $mode) => [
                    'value' => $mode->value,
                    'label' => $mode->label(),
                    'description' => $mode->description(),
                ])
                ->values(),
        ]);
    }

    public function update(UpdateCompanySettingsRequest $request, Company $company): RedirectResponse
    {
        $data = $request->validated();

        $company->forceFill([
            'name' => $data['name'],
            'hour_approval_mode' => $data['hour_approval_mode'],
        ])->save();

        $company->banen()->update(['name' => $company->name]);

        return back()->with('status', 'Bedrijfsinstellingen opgeslagen.');
    }
}
