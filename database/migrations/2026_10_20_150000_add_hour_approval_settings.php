<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('hour_approval_mode')->default('auto')->after('owner_user_id');
        });

        Schema::table('hour_entries', function (Blueprint $table) {
            $table->string('approval_status')->default('approved')->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('hour_entries', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('hour_approval_mode');
        });
    }
};
