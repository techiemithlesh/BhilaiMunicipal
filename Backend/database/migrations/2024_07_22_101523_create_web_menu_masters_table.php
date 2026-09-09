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
        Schema::create('web_menu_masters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->text('menu_name')->nullable();
            $table->integer('parent_id')->nullable()->default(0);
            $table->text('url')->nullable();
            $table->text('query_string')->nullable();
            $table->integer('serial_no')->nullable();
            $table->text('icon')->nullable();
            $table->text('description')->nullable();
            $table->boolean('lock_status')->nullable()->default(false);
            $table->timestamp('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestamp('updated_at')->nullable()->default(DB::raw("now()"));
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('web_menu_masters');
    }
};
