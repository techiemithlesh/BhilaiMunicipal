<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personal_access_tokens_log', function (Blueprint $table) {
            $table->string('opration', 50)->nullable();
            $table->bigInteger('id')->primary();
            $table->string('tokenable_type')->nullable();
            $table->bigInteger('tokenable_id');
            $table->string('name')->nullable();
            $table->string('token', 64)->nullable();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->text('latitude')->nullable();
            $table->text('longitude')->nullable();
            $table->text('machine')->nullable();
            $table->text('browser_name')->nullable();
            $table->text('ip')->nullable();
            $table->date('login_date')->nullable();
            $table->time('login_time')->nullable()->default(DB::raw("CURRENT_DATE"));
            $table->date('logout_date')->nullable()->default(DB::raw("CURRENT_TIME"));
            $table->time('logout_time')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens_log');
    }
};
