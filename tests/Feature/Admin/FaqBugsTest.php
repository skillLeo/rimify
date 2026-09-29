<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\FaqEntry;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;

/*
 * Bug tests of review FAQ-2026-09-26 (docs/qa/BUGS.md) whose fault is on the server. A browser test
 * would have to run the release seeder against the dev database, so these run on the test database.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

/*
 * FAQ-03 (S2) — a question the team deleted is back, published, after the next release.
 *
 * FragenController::destroy() stamps no `team_edited_at`. ContentSeeder leaves the FAQ alone only
 * when some row carries that stamp, and deploy/remote.sh runs `php artisan db:seed --force` on every
 * release. If deleting was the team's only change so far, the seeder re-inserts the question
 * (matched on its words) with the seed's `published` flag.
 */
it('FAQ-03 keeps a deleted seeded question deleted through the next release', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $question = 'Kann ich Felgen zurückgeben?';
    $entry = FaqEntry::query()->where('question_de', $question)->firstOrFail();

    // The team's first change in Inhalte › FAQ: this answer goes.
    $this->actingAs($admin, 'admin')->delete('/admin/faq/'.$entry->id)->assertRedirect();

    expect(FaqEntry::query()->where('question_de', $question)->exists())->toBeFalse();

    // The next release.
    $this->seed(ContentSeeder::class);

    expect(FaqEntry::query()->where('question_de', $question)->exists())
        ->toBeFalse('the deleted question is back after the release seed');
});

/*
 * FAQ-08 (S3) — a question moved to the other group in its dialog keeps its old sort_order:
 * from „Kompatibilität & Freigabe" it lands at the TOP of „Bestellung & Versand" (a new question
 * goes to the end), and the stored order no longer follows the groups, so the homepage — the first
 * five by sort_order alone — shows it among the compatibility answers. update() never renumbers.
 */
it('FAQ-08 files a question moved to the other group at the end of that group, and the stored order follows the groups', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $entry = FaqEntry::query()->where('question_de', 'Was ist RIMIFY?')->firstOrFail();

    $this->actingAs($admin, 'admin')->put('/admin/faq/'.$entry->id, [
        'group' => 'BESTELLUNG & VERSAND',
        'question' => $entry->question_de,
        'answer' => $entry->answer_de,
        'published' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $bestellung = FaqEntry::query()->where('group_key', 'BESTELLUNG & VERSAND')->orderBy('sort_order')->orderBy('id')->pluck('question_de')->all();

    expect($bestellung[array_key_last($bestellung)])->toBe('Was ist RIMIFY?');

    $order = FaqEntry::query()->orderBy('sort_order')->orderBy('id')->pluck('group_key')->all();

    expect($order)->toBe([
        ...array_fill(0, 4, 'KOMPATIBILITÄT & FREIGABE'),
        ...array_fill(0, 4, 'BESTELLUNG & VERSAND'),
    ]);
});
