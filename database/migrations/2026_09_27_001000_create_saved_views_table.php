<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gespeicherte Ansichten (docs/admin/rest-build-plan.md, step 2.2): a list's filters and sort under
 * a name, kept per person and optionally shared with a role.
 *
 * `query` is the list's canonical query string as its Form Request writes it (only the list's own
 * filter keys, never the page) — applying a view is opening that link, so a view can never show
 * something the URL could not. `role_id` shares it with everyone who holds that role; a role that
 * is deleted takes the sharing with it and the view stays its owner's. Deleted views are soft-deleted
 * and can be restored (the Papierkorb rule: nothing is lost without a way back).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_views', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admin_user_id')->constrained('admin_users')->cascadeOnDelete();
            $table->string('list', 32);
            $table->string('name', 60);
            $table->json('query');
            $table->unsignedBigInteger('role_id')->nullable();
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['list', 'admin_user_id']);
            $table->index(['list', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_views');
    }
};
