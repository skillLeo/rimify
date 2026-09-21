<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Sag mir Bescheid, wenn es passt" (F2): an e-mail address that wants to hear when a document
 * first names a vehicle. Double opt-in: a row exists from the first request, but nothing is ever
 * sent to it until `confirmed_at` is set by the link in the confirmation mail.
 *
 * The vehicle key is RESTRICT, like every reference to a vehicle: vehicles are soft-deleted and
 * never removed (R-04), and a subscription must not vanish because a catalogue row was tidied.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fitment_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->string('email');
            $table->foreignId('vehicle_id')->constrained('vehicles')->restrictOnDelete();

            $table->char('confirm_token', 64)->unique();
            $table->char('unsubscribe_token', 64)->unique();

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamp('notified_at')->nullable()->comment('the last time a match was mailed');
            $table->foreignId('notified_document_id')->nullable()->constrained('approval_documents')->nullOnDelete();

            $table->string('source', 32)->default('startseite')->comment('where the request came from');
            $table->timestamps();

            $table->unique(['email', 'vehicle_id'], 'uq_subscription_email_vehicle');
            $table->index(['vehicle_id', 'confirmed_at', 'unsubscribed_at'], 'idx_subscription_match');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fitment_subscriptions');
    }
};
