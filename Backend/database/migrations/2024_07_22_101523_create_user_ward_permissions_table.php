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
        Schema::create('user_ward_permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('ward_mstr_id')->index('inx_ward_mstr_id_on_user_ward_permissions');
            $table->bigInteger('user_id')->index('inx_user_id_on_user_ward_permissions');
            $table->bigInteger('created_by_user_id');
            $table->boolean('lock_status')->default(false);
            $table->timestamp('created_at')->default(DB::raw("now()"));
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_ward_permissions');
    }
};
