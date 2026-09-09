<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('ulb_id')->nullable();
            $table->boolean('can_switch_multi_ulb')->default(false);
            $table->string('employee_code', 100)->nullable();
            $table->string('user_name', 200)->nullable()->unique('users_user_name_key');
            $table->string('email')->unique('users_email_key');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('user_for', 100)->default('AGENCY');
            $table->text('name');
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('phone_no', 20)->nullable();
            $table->string('designation', 100)->nullable();
            $table->text('user_img')->nullable();
            $table->text('unique_ref_no')->nullable();
            $table->text('signature_img')->nullable();
            $table->text('signature_unique_ref_no')->nullable();
            $table->rememberToken();
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('report_to')->nullable();
            $table->boolean('lock_status')->default(false);
            $table->bigInteger('old_id')->nullable();
            $table->text('old_pass')->nullable();
            $table->timestamps();
            $table->integer('max_login_allow')->nullable()->default(1);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
