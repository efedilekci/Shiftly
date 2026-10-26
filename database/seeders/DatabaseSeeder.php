<?php

namespace Database\Seeders;

use App\Enums\CompanyHourApprovalMode;
use App\Enums\CompanyMemberRole;
use App\Enums\HourEntryApprovalStatus;
use App\Enums\Role;
use App\Models\Baan;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\CompanyMember;
use App\Models\HourEntry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedUser('admin@shiftly.test', 'Admin Demo', Role::Admin);
        $sara = $this->seedUser('sara@shiftly.test', 'Sara Bakker', Role::User);
        $tom = $this->seedUser('tom@shiftly.test', 'Tom Jansen', Role::User);
        $lisa = $this->seedUser('lisa@shiftly.test', 'Lisa Leeg', Role::User);

        if ($sara->banen()->doesntExist()) {
            $winkel = $sara->banen()->create(['name' => 'Winkel', 'hourly_wage' => '15.50']);
            $horeca = $sara->banen()->create(['name' => 'Horeca', 'hourly_wage' => '18.00']);

            $this->seedEntry($sara, $winkel, '2026-10-13', '09:00', '17:00', 30, 'Maandag rustig');
            $this->seedEntry($sara, $winkel, '2026-10-14', '09:00', '17:30', 30);
            $this->seedEntry($sara, $horeca, '2026-10-15', '17:00', '23:00', 15, 'Avonddienst');
            $this->seedEntry($sara, $winkel, '2026-10-17', '10:00', '16:00', 0);
            $this->seedEntry($sara, $horeca, '2026-10-18', '18:00', '00:30', 20, 'Weekendshift');
        }

        if ($tom->banen()->doesntExist()) {
            $zorg = $tom->banen()->create(['name' => 'Zorg', 'hourly_wage' => '22.00']);

            $this->seedEntry($tom, $zorg, '2026-10-10', '07:00', '15:00', 30);
            $this->seedEntry($tom, $zorg, '2026-10-12', '07:00', '15:00', 45, 'Overdracht');
            $this->seedEntry($tom, $zorg, '2026-10-16', '14:00', '22:00', 30);
        }

        $this->seedDemoCompany($sara, $tom, $lisa);
    }

    private function seedDemoCompany(User $owner, User $employee, User $invitee): void
    {
        $company = Company::query()->firstOrCreate(
            ['slug' => 'bakkerij-demo'],
            [
                'name' => 'Bakkerij Demo',
                'owner_user_id' => $owner->id,
                'hour_approval_mode' => CompanyHourApprovalMode::Owner,
            ],
        );

        CompanyMember::query()->firstOrCreate(
            [
                'company_id' => $company->id,
                'user_id' => $owner->id,
            ],
            ['role' => CompanyMemberRole::Owner],
        );

        CompanyMember::query()->firstOrCreate(
            [
                'company_id' => $company->id,
                'user_id' => $employee->id,
            ],
            ['role' => CompanyMemberRole::Employee],
        );

        $ownerBaan = $company->ensureBaanFor($owner, '20.00');
        $employeeBaan = $company->ensureBaanFor($employee, '17.50');

        CompanyInvitation::query()->firstOrCreate(
            [
                'company_id' => $company->id,
                'email' => $invitee->email,
            ],
            [
                'invited_by' => $owner->id,
                'role' => CompanyMemberRole::Employee,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(14),
            ],
        );

        if (! HourEntry::query()->where('company_id', $company->id)->exists()) {
            $this->seedEntry(
                $employee,
                $employeeBaan,
                '2026-10-21',
                '08:00',
                '16:00',
                30,
                'Wacht op goedkeuring',
                $company,
                HourEntryApprovalStatus::Pending,
            );
            $this->seedEntry(
                $owner,
                $ownerBaan,
                '2026-10-20',
                '09:00',
                '13:00',
                0,
                null,
                $company,
                HourEntryApprovalStatus::Approved,
            );
        }
    }

    private function seedUser(string $email, string $name, Role $role): User
    {
        $user = User::query()->firstOrNew(['email' => $email]);
        $user->forceFill([
            'name' => $name,
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'role' => $role,
        ])->save();

        return $user->refresh();
    }

    private function seedEntry(
        User $user,
        Baan $baan,
        string $workDate,
        string $startTime,
        string $endTime,
        int $breakMinutes = 0,
        ?string $note = null,
        ?Company $company = null,
        ?HourEntryApprovalStatus $approvalStatus = null,
    ): void {
        $gross = HourEntry::grossMinutes($startTime, $endTime);

        $user->hourEntries()->create([
            'baan_id' => $baan->id,
            'company_id' => $company?->id,
            'baan_name' => $baan->name,
            'hourly_wage' => $baan->hourly_wage,
            'work_date' => $workDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'break_minutes' => $breakMinutes,
            'duration_minutes' => max(0, $gross - $breakMinutes),
            'note' => $note,
            'approval_status' => $approvalStatus ?? HourEntryApprovalStatus::Approved,
        ]);
    }
}
