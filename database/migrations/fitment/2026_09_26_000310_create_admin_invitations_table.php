<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Invitations into the admin — the only way a new account comes to exist (docs/admin/BRIEF.md §2).
 *
 * The link in the e-mail carries a random token; this table keeps only its SHA-256, so a leaked
 * database row cannot be turned back into a working link. A row is never deleted: revoking sets
 * `revoked_at`, accepting sets `accepted_at`, and the history of who invited whom with which role
 * stays readable beside the Protokoll.
 *
 * `role_id` is RESTRICT: the role an invitation promises cannot vanish underneath it. `invited_by`
 * nulls out rather than blocking, because accounts are never hard-deleted anyway and the audit
 * trail keeps the inviter's address on its own row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_invitations', function (Blueprint $table): void {
            $table->id();
            $table->string('email');
            $table->string('name')->nullable();
            $table->foreignId('role_id')->constrained('roles')->restrictOnDelete()->restrictOnUpdate();
            $table->char('token_hash', 64)->unique();
            $table->foreignId('invited_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_invitations');
    }
};
