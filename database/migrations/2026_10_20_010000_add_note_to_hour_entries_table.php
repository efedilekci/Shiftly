<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hour_entries', function (Blueprint $table) {
            $table->string('note', 500)->nullable()->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('hour_entries', function (Blueprint $table) {
            $table->dropColumn('note');
        });
    }
};
