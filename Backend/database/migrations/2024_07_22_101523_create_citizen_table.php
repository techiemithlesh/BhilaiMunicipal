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
        Schema::create('citizen', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->text('name');
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('guardian_name')->nullable();
            $table->bigInteger('phone_no')->nullable()->unique('citizen_phone_no_key');
            $table->string('email')->nullable()->unique('citizen_email_key');
            $table->text('user_img')->nullable();
            $table->text('unique_ref_no')->nullable();
            $table->rememberToken();
            $table->integer('max_login_allow')->nullable()->default(1);
            $table->boolean('lock_status')->default(false);
            $table->timestamp('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citizen');
    }
};
