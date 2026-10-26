<?php

namespace App\Http\Controllers\Company;

use App\Enums\CompanyHourApprovalMode;
use App\Enums\CompanyMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Company\TransferCompanyOwnershipRequest;
use App\Http\Requests\Company\UpdateCompanySettingsRequest;
use App\Models\Company;
use App\Models\CompanyMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'transferCandidates' => $company->members()
                ->with('user:id,name,email')
                ->where('role', '!=', CompanyMemberRole::Owner)
                ->orderBy('role')
                ->get()
                ->sortBy(fn (CompanyMember $member) => $member->user?->name ?? '')
                ->values()
                ->map(fn (CompanyMember $member) => [
                    'id' => $member->id,
                    'name' => $member->user?->name ?? 'Onbekend',
                    'email' => $member->user?->email,
                    'role_label' => $member->role->label(),
                ]),
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

    public function transferOwnership(TransferCompanyOwnershipRequest $request, Company $company): RedirectResponse
    {
        /** @var CompanyMember $currentOwnerMembership */
        $currentOwnerMembership = $request->attributes->get('companyMember');
        $newOwnerMembership = $request->member();
        $newOwnerMembership->loadMissing('user:id,name');

        DB::transaction(function () use ($company, $currentOwnerMembership, $newOwnerMembership): void {
            $newOwnerMembership->forceFill([
                'role' => CompanyMemberRole::Owner,
            ])->save();

            $currentOwnerMembership->forceFill([
                'role' => CompanyMemberRole::TeamLeader,
            ])->save();

            $company->forceFill([
                'owner_user_id' => $newOwnerMembership->user_id,
            ])->save();
        });

        return to_route('company.dashboard', $company)
            ->with('status', 'Eigendom overgedragen aan '.$newOwnerMembership->user?->name.'. Je bent nu teamleider.');
    }
}
