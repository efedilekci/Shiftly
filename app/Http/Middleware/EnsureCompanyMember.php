<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\CompanyMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $company = $request->route('company');

        if (! $user || ! $company instanceof Company) {
            abort(Response::HTTP_FORBIDDEN);
        }

        $member = CompanyMember::query()
            ->where('company_id', $company->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $member) {
            abort(Response::HTTP_FORBIDDEN);
        }

        $request->attributes->set('companyMember', $member);

        return $next($request);
    }
}
