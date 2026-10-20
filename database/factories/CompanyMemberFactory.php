<?php

namespace Database\Factories;

use App\Enums\CompanyMemberRole;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyMember>
 */
class CompanyMemberFactory extends Factory
{
    protected $model = CompanyMember::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'role' => CompanyMemberRole::Employee,
        ];
    }

    public function owner(): static
    {
        return $this->state(fn () => ['role' => CompanyMemberRole::Owner]);
    }

    public function teamLeader(): static
    {
        return $this->state(fn () => ['role' => CompanyMemberRole::TeamLeader]);
    }
}
