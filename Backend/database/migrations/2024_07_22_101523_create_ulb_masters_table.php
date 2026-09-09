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
        Schema::create('ulb_masters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->text('ulb_name');
            $table->string('short_name', 20);
            $table->bigInteger('ulb_type_id')->nullable();
            $table->text('logo_img')->nullable();
            $table->text('water_mark_img')->nullable();
            $table->text('toll_free_no')->nullable();
            $table->text('ulb_url')->nullable();
            $table->string('city', 200)->nullable();
            $table->string('district', 200)->nullable();
            $table->string('state', 200)->nullable();
            $table->text('collaboration')->nullable();
            $table->text('hindi_ulb_name')->nullable();
            $table->string('hindi_ulb_short_name', 30)->nullable();
            $table->boolean('lock_status')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ulb_masters');
    }
};
