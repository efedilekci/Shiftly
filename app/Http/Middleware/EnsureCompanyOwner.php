<?php

namespace App\Http\Middleware;

use App\Enums\CompanyMemberRole;
use App\Models\CompanyMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $member = $request->attributes->get('companyMember');

        if (! $member instanceof CompanyMember || $member->role !== CompanyMemberRole::Owner) {
            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
