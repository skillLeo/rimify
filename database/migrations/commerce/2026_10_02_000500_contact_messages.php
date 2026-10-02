<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The client's #12 — the contact form (D-123). Every message is kept as well as mailed: where outgoing mail is not
 * configured (a preview writes mail to its log), the team still reads it in Verkauf › Nachrichten, and nothing a
 * customer typed vanishes. A message is pruned after twelve months (ContactMessage::prunable()).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $t): void {
            $t->id();
            $t->string('name', 120);
            $t->string('email', 190);
            $t->string('subject', 150);
            $t->text('message');
            // The car the page knew, as it was named when the message was sent — words, not a key, so the message still
            // reads correctly after the catalogue changed.
            $t->string('vehicle_label', 255)->nullable();
            // Where the form was opened from (a product page, the checkout …), a path only.
            $t->string('from_path', 255)->nullable();
            $t->timestamp('read_at')->nullable();
            $t->foreignId('read_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $t->timestamps();

            $t->index('created_at', 'idx_contact_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
