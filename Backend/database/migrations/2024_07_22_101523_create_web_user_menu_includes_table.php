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
        Schema::create('web_user_menu_includes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->nullable();
            $table->bigInteger('menu_id')->nullable();
            $table->text('description')->nullable();
            $table->boolean('read')->nullable()->default(true);
            $table->boolean('write')->nullable()->default(true);
            $table->boolean('delete')->nullable()->default(true);
            $table->boolean('update')->nullable()->default(true);
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
        Schema::dropIfExists('web_user_menu_includes');
    }
};
