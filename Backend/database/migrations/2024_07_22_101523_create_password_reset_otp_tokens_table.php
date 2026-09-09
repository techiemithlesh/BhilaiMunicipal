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
        Schema::create('password_reset_otp_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->text('tokenable_type')->nullable();
            $table->bigInteger('tokenable_id')->nullable();
            $table->text('token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('user_type')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->smallInteger('status')->nullable()->default(0);
            $table->timestamp('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_otp_tokens');
    }
};
