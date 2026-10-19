<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('running_clocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('baan_id')->nullable()->constrained('banen')->nullOnDelete();
            $table->string('baan_name');
            $table->decimal('hourly_wage', 7, 2);
            $table->unsignedBigInteger('started_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('running_clocks');
    }
};
