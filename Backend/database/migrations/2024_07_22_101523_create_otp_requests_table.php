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
        Schema::create('otp_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('mobile_no')->nullable();
            $table->string('email')->nullable();
            $table->string('otp', 10)->nullable();
            $table->string('otp_type', 100)->nullable();
            $table->timestamp('otp_date_time')->nullable()->default(DB::raw("now()"));
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('use_date_time')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('user_type', 100)->nullable();
            $table->text('ip')->nullable();
            $table->timestamp('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_requests');
    }
};
