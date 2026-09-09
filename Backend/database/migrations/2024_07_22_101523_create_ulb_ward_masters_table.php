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
        Schema::create('ulb_ward_masters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('ulb_id');
            $table->string('ward_no', 30)->index('index_ward_no_on_ulb_ward_masters');
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
        Schema::dropIfExists('ulb_ward_masters');
    }
};
