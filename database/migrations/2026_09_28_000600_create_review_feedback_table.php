<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The client's review of the admin (the review release §3): one row per point he makes from the
 * feedback button — where he was (URL, screen, viewport, browser, role), what he saw (a screenshot),
 * what he said in one sentence and what kind of point it is — and our answer to it, with who took it
 * and when it was closed. `review:report` writes the open points out as docs/review/OPEN-POINTS.md.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_feedback', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->string('type', 16)->comment('fehler | design | text | wunsch');
            $table->text('sentence');
            $table->string('url', 500);
            $table->string('screen', 120)->comment('the page as the rail names it');
            $table->string('viewport', 32);
            $table->string('browser', 120);
            $table->string('role', 120)->nullable();
            $table->string('screenshot_path', 200)->nullable()->comment('private disk; served only to the panel');
            $table->string('status', 16)->default('neu')->comment('neu | angenommen | erledigt | abgelehnt');
            $table->text('answer')->nullable()->comment('our answer; the reason, when refused');
            $table->foreignId('assignee_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'idx_review_feedback_status');
            $table->index('screen', 'idx_review_feedback_screen');
        });

        Constraints::enum('review_feedback', 'type', ['fehler', 'design', 'text', 'wunsch']);
        Constraints::enum('review_feedback', 'status', ['neu', 'angenommen', 'erledigt', 'abgelehnt']);
    }

    public function down(): void
    {
        Schema::dropIfExists('review_feedback');
    }
};
