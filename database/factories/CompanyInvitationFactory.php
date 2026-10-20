<?php

namespace Database\Factories;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CompanyInvitation>
 */
class CompanyInvitationFactory extends Factory
{
    protected $model = CompanyInvitation::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'invited_by' => User::factory(),
            'email' => fake()->unique()->safeEmail(),
            'role' => CompanyMemberRole::Employee,
            'token' => Str::random(64),
            'accepted_at' => null,
            'expires_at' => now()->addDays(14),
        ];
    }
}
