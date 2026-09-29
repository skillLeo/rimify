<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The team's own notifications — the bell in the admin's top bar and /admin/benachrichtigungen
 * (docs/admin/rest-build-plan.md, step 1). Laravel's database channel, unchanged: one row per
 * recipient, `read_at` set when that person has seen it.
 *
 * Not the customers' „Sag mir Bescheid“ subscriptions: those are `fitment_subscriptions`, shown
 * under Verkauf › Anfragen.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // The bell asks "how many unread for me" on every admin page.
            $table->index(['notifiable_type', 'notifiable_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
