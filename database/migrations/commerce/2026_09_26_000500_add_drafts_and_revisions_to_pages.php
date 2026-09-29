<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pages the client's team edits themselves (docs/admin/inhalte-build-plan.md).
 *
 *  - `pages.draft`: the working copy — title, meta description and every block — as the editor last
 *    saved it. The storefront never reads it; only a signed preview does. Publishing writes it into
 *    `page_blocks` and clears it.
 *  - `pages.lawyer_reviewed`: the legal pages' „vom Anwalt geprüft" mark. It is a fact about one
 *    wording, so publishing changed text clears it unless somebody ticks it again.
 *  - `pages.team_edited_at`: the first time the client's team changed the page in the admin. From
 *    then on the page is theirs, and ContentSeeder — which a release re-runs — leaves it alone.
 *  - `page_revisions`: every published state, whole, with who and why. RESTRICT: a revision is the
 *    only way back to yesterday's wording, and it must not vanish with a tidy-up.
 *
 * Author ids are plain columns, not foreign keys, like every cross-slice id in this slice; the
 * e-mail beside them keeps a revision readable after the account is gone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->json('draft')->nullable()->after('published_at');
            $table->timestamp('draft_updated_at')->nullable()->after('draft');
            $table->string('draft_author_email')->nullable()->after('draft_updated_at');
            $table->boolean('lawyer_reviewed')->default(false)->after('draft_author_email');
            $table->timestamp('team_edited_at')->nullable()->after('lawyer_reviewed');
        });

        Schema::create('page_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->restrictOnDelete();
            $table->json('snapshot')->comment('title, meta_description and blocks, as published');
            $table->string('note', 200)->nullable();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('author_email')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['page_id', 'id'], 'idx_page_revision_page');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_revisions');

        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn(['draft', 'draft_updated_at', 'draft_author_email', 'lawyer_reviewed', 'team_edited_at']);
        });
    }
};
