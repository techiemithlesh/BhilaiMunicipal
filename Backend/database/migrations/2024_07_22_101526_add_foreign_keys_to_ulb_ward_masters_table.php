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
        Schema::table('ulb_ward_masters', function (Blueprint $table) {
            $table->foreign(['ulb_id'], 'ulb_ward_masters_ulb_id_fkey')->references(['id'])->on('ulb_masters')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ulb_ward_masters', function (Blueprint $table) {
            $table->dropForeign('ulb_ward_masters_ulb_id_fkey');
        });
    }
};
