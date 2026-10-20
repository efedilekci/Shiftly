<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banen', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->unique(['user_id', 'company_id']);
        });

        Schema::table('hour_entries', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('baan_id')->constrained()->nullOnDelete();
            $table->index(['company_id', 'work_date']);
        });
    }

    public function down(): void
    {
        Schema::table('hour_entries', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'work_date']);
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('banen', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'company_id']);
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
