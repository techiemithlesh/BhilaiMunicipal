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
        Schema::create('old_ward_new_ward_maps', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('old_ward_id')->nullable()->index('index_old_ward_id_on_old_ward_new_ward_maps');
            $table->bigInteger('new_ward_id')->nullable();
            $table->boolean('lock_status')->nullable()->default(false);
            $table->timestamp('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('old_ward_new_ward_maps');
    }
};
