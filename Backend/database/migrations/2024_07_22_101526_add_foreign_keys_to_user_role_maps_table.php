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
        Schema::table('user_role_maps', function (Blueprint $table) {
            $table->foreign(['role_id'], 'user_role_maps_role_id_fkey')->references(['id'])->on('role_type_mstrs')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['user_id'], 'user_role_maps_user_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_role_maps', function (Blueprint $table) {
            $table->dropForeign('user_role_maps_role_id_fkey');
            $table->dropForeign('user_role_maps_user_id_fkey');
        });
    }
};
