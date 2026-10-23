<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\FaqEntry;
use App\Services\Admin\AdminErrorPage;
use App\Services\Admin\AuditDescriber;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * Inhalte › FAQ. There is no draft, so the line that matters is the one between preparing words and
 * putting them in front of visitors: a visible answer, its place and its visibility take the right
 * to publish. And a release never brings the seeded questions back over the team's.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

function faqAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function faqEntry(string $question): FaqEntry
{
    return FaqEntry::query()->where('question_de', $question)->firstOrFail();
}

/** Takes the right to publish from the Inhalte role, leaving it the right to create and edit. */
function faqWithoutPublish(): AdminUser
{
    $role = (int) DB::table('roles')->where('name', 'content-editor')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'publish')->update(['allowed' => false]);

    return faqAdmin('content-editor');
}

it('lists the questions by group and marks the five the homepage shows', function (): void {
    $this->actingAs(faqAdmin(), 'admin')->get('/admin/faq')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Faq/Index')
            ->where('groups.0.key', 'KOMPATIBILITÄT & FREIGABE')
            ->has('groups.0.entries', 5)
            ->has('groups.1.entries', 3)
            ->has('onHome', 5)
            ->where('limits.question', FaqEntry::QUESTION_MAX)
            ->where('can.publish', true));
});

it('puts a new visible question on the shop, at the end of its group', function (): void {
    $this->actingAs(faqAdmin(), 'admin')->post('/admin/faq', [
        'group' => 'BESTELLUNG & VERSAND',
        'question' => 'Kann ich per Rechnung zahlen?',
        'answer' => 'Das klären wir gerade.',
        'published' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    // Compatibility first, as the page is written: it answers what this audience arrives with.
    $this->get('/faq')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('groups.0.key', 'KOMPATIBILITÄT & FREIGABE')
        ->where('groups.1.key', 'BESTELLUNG & VERSAND')
        ->where('groups.1.entries.2.question', 'Kann ich per Rechnung zahlen?'));

    expect(AuditLog::query()->where('description', 'faq.created')->exists())->toBeTrue();
});

it('changes a visible answer on the shop and says so in the Protokoll', function (): void {
    $entry = faqEntry('Kann ich Felgen zurückgeben?');

    $this->actingAs(faqAdmin(), 'admin')->put('/admin/faq/'.$entry->id, [
        'group' => $entry->group_key,
        'question' => $entry->question_de,
        'answer' => 'Ja, innerhalb der gesetzlichen Frist.',
        'published' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->get('/faq')->assertSee('Ja, innerhalb der gesetzlichen Frist.');

    $entry = AuditLog::query()->where('description', 'faq.updated')->sole();
    expect((new AuditDescriber)->describe($entry)['sentence'])->toBe('Die Frage „Kann ich Felgen zurückgeben?“ wurde geändert: Antwort.');
});

it('refuses a question the accordion cannot hold, or a group the page does not have', function (): void {
    $this->actingAs(faqAdmin(), 'admin')->from('/admin/faq')->post('/admin/faq', [
        'group' => 'SONSTIGES',
        'question' => str_repeat('a', FaqEntry::QUESTION_MAX + 1),
        'answer' => '',
        'published' => false,
    ])->assertSessionHasErrors(['group', 'question', 'answer']);

    expect(FaqEntry::query()->count())->toBe(8);
});

it('lets a role without the right to publish prepare a hidden answer, and nothing a visitor would see', function (): void {
    $editor = faqWithoutPublish();
    $hidden = faqEntry('Wie lange dauert die Lieferung?');
    $visible = faqEntry('Kann ich Felgen zurückgeben?');

    // Hidden, and staying hidden: preparing words.
    $this->actingAs($editor, 'admin')->put('/admin/faq/'.$hidden->id, [
        'group' => $hidden->group_key, 'question' => $hidden->question_de, 'answer' => 'Entwurf der Antwort.', 'published' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    // Showing it, changing a visible one, creating a visible one, reordering, deleting a visible one.
    $this->actingAs($editor, 'admin')->put('/admin/faq/'.$hidden->id, [
        'group' => $hidden->group_key, 'question' => $hidden->question_de, 'answer' => 'Entwurf der Antwort.', 'published' => true,
    ])->assertForbidden();
    $this->actingAs($editor, 'admin')->put('/admin/faq/'.$visible->id, [
        'group' => $visible->group_key, 'question' => $visible->question_de, 'answer' => 'Anders.', 'published' => true,
    ])->assertForbidden();
    $this->actingAs($editor, 'admin')->post('/admin/faq', [
        'group' => 'BESTELLUNG & VERSAND', 'question' => 'Neu?', 'answer' => 'Neu.', 'published' => true,
    ])->assertForbidden();
    $this->actingAs($editor, 'admin')->put('/admin/faq/reihenfolge', ['ids' => FaqEntry::query()->orderByDesc('id')->pluck('id')->all()])->assertForbidden();
    $this->actingAs($editor, 'admin')->delete('/admin/faq/'.$visible->id)->assertForbidden();

    expect($hidden->refresh()->published)->toBeFalse()
        ->and($visible->refresh()->answer_de)->not->toBe('Anders.');
});

it('answers a refused save from the page with one sentence, never a page over the typed words', function (): void {
    $editor = faqWithoutPublish();
    $visible = faqEntry('Kann ich Felgen zurückgeben?');

    // As the admin's own page sends it (Inertia): the page stays, the layout says the sentence.
    $this->actingAs($editor, 'admin')
        ->withHeaders(['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])
        ->put('/admin/faq/'.$visible->id, ['group' => $visible->group_key, 'question' => 'Neu', 'answer' => 'Neu.', 'published' => true])
        ->assertForbidden()
        ->assertHeaderMissing('X-Inertia')
        ->assertExactJson(['message' => 'Dafür fehlt dir inzwischen das Recht. Es wurde nichts gespeichert.']);

    // Signed out meanwhile (the session ran out): no redirect to the sign-in page over the form.
    auth('admin')->logout();
    $this->withHeaders(['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])
        ->put('/admin/faq/'.$visible->id, ['group' => $visible->group_key, 'question' => 'Neu', 'answer' => 'Neu.', 'published' => true])
        ->assertUnauthorized()
        ->assertJsonPath('message', AdminErrorPage::EXPIRED_KEPT);

    // Signing out with an expired session still lands on the sign-in page: it is not a form.
    $this->withHeaders(['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])
        ->post('/admin/abmelden')
        ->assertRedirect('/admin/anmelden');

    // A record that is gone meanwhile.
    $this->actingAs(faqAdmin(), 'admin')
        ->withHeaders(['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])
        ->delete('/admin/faq/999999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Das gibt es nicht mehr – vielleicht hat es gerade jemand gelöscht. Es wurde nichts gespeichert.');
});

it('refuses the FAQ to a role without content rights', function (): void {
    $this->actingAs(faqAdmin('support-agent'), 'admin')->get('/admin/faq')->assertForbidden();
    $this->actingAs(faqAdmin('support-agent'), 'admin')->delete('/admin/faq/'.faqEntry('Was ist RIMIFY?')->id)->assertForbidden();
});

it('deletes a question, and the Protokoll keeps its words', function (): void {
    $entry = faqEntry('Kann ich Felgen zurückgeben?');

    $this->actingAs(faqAdmin(), 'admin')->delete('/admin/faq/'.$entry->id)->assertRedirect();

    expect(FaqEntry::query()->whereKey($entry->id)->exists())->toBeFalse();
    $log = AuditLog::query()->where('description', 'faq.deleted')->sole();
    expect($log->properties['answer'])->toBe($entry->answer_de);
});

it('reorders the whole list at once, and refuses a list that is out of date', function (): void {
    $ids = FaqEntry::query()->orderBy('sort_order')->pluck('id')->map(fn (mixed $id): int => (int) $id)->all();
    [$ids[0], $ids[1]] = [$ids[1], $ids[0]];

    $this->actingAs(faqAdmin(), 'admin')->put('/admin/faq/reihenfolge', ['ids' => $ids])->assertRedirect()->assertSessionHasNoErrors();

    expect(FaqEntry::query()->orderBy('sort_order')->pluck('id')->map(fn (mixed $id): int => (int) $id)->all())->toBe($ids);

    $this->actingAs(faqAdmin(), 'admin')->from('/admin/faq')->put('/admin/faq/reihenfolge', ['ids' => array_slice($ids, 1)])
        ->assertSessionHasErrors(['ids']);
});

it('shows or hides an entry by its visibility alone, never writing its words back', function (): void {
    $entry = faqEntry('Kann ich Felgen zurückgeben?');

    // Meanwhile a colleague rewrote the answer; this list still holds the old one.
    $entry->forceFill(['answer_de' => 'Die neue Antwort der Kollegin.'])->save();

    $this->actingAs(faqAdmin(), 'admin')->patch('/admin/faq/'.$entry->id.'/sichtbarkeit', ['visible' => false])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect($entry->refresh()->published)->toBeFalse()
        ->and($entry->answer_de)->toBe('Die neue Antwort der Kollegin.');

    $this->actingAs(faqWithoutPublish(), 'admin')->patch('/admin/faq/'.$entry->id.'/sichtbarkeit', ['visible' => true])->assertForbidden();
});

it('puts an interleaved order from an out-of-date page back in group order', function (): void {
    $kompatibel = FaqEntry::query()->where('group_key', 'KOMPATIBILITÄT & FREIGABE')->orderBy('sort_order')->pluck('id')->all();
    $bestellung = FaqEntry::query()->where('group_key', 'BESTELLUNG & VERSAND')->orderBy('sort_order')->pluck('id')->all();
    $interleaved = [$bestellung[0], ...$kompatibel, ...array_slice($bestellung, 1)];

    $this->actingAs(faqAdmin(), 'admin')->put('/admin/faq/reihenfolge', ['ids' => $interleaved])->assertSessionHasNoErrors();

    expect(FaqEntry::query()->orderBy('sort_order')->pluck('group_key')->all())
        ->toBe([...array_fill(0, 5, 'KOMPATIBILITÄT & FREIGABE'), ...array_fill(0, 3, 'BESTELLUNG & VERSAND')]);
});

it('keeps an FAQ the team emptied empty through a release', function (): void {
    foreach (FaqEntry::query()->pluck('id') as $id) {
        $this->actingAs(faqAdmin(), 'admin')->delete('/admin/faq/'.$id)->assertSessionHasNoErrors();
    }

    $this->seed(ContentSeeder::class);

    expect(FaqEntry::query()->count())->toBe(0);
});

it('never brings the seeded questions back over the team\'s', function (): void {
    $entry = faqEntry('Was ist RIMIFY?');

    $this->actingAs(faqAdmin(), 'admin')->put('/admin/faq/'.$entry->id, [
        'group' => $entry->group_key, 'question' => 'Wer ist RIMIFY?', 'answer' => $entry->answer_de, 'published' => true,
    ])->assertSessionHasNoErrors();

    $this->seed(ContentSeeder::class);

    expect(FaqEntry::query()->where('question_de', 'Was ist RIMIFY?')->exists())->toBeFalse()
        ->and(FaqEntry::query()->where('question_de', 'Wer ist RIMIFY?')->exists())->toBeTrue()
        ->and(FaqEntry::query()->count())->toBe(8);
});

it('refuses a question saved from a dialog opened before the last save of it, and keeps that save (the admin audit\'s F-25)', function (): void {
    $entry = faqEntry('Kann ich Felgen zurückgeben?');
    $stale = collect($this->actingAs(faqAdmin(), 'admin')->get('/admin/faq')->viewData('page')['props']['groups'])
        ->flatMap(static fn (array $group): array => $group['entries'])->firstWhere('id', $entry->id)['stamp'] ?? null;
    expect($stale)->toBeString()->not->toBe('');

    $form = ['group' => $entry->group_key, 'question' => $entry->question_de, 'published' => true];
    $this->actingAs(faqAdmin(), 'admin')->from('/admin/faq')->put('/admin/faq/'.$entry->id, ['answer' => 'Ja, innerhalb von 14 Tagen.'] + $form)->assertSessionHasNoErrors();
    $this->actingAs(faqAdmin(), 'admin')->from('/admin/faq')->withHeader(EditStamp::HEADER, $stale)
        ->put('/admin/faq/'.$entry->id, ['question' => 'Kann ich Felgen umtauschen?', 'answer' => $entry->answer_de] + $form)
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($entry->fresh()->only(['question_de', 'answer_de']))->toBe(['question_de' => 'Kann ich Felgen zurückgeben?', 'answer_de' => 'Ja, innerhalb von 14 Tagen.']);
});

it('refuses a move from a list in an older order, and keeps the move made meanwhile (the admin audit\'s F-25)', function (): void {
    $stale = $this->actingAs(faqAdmin(), 'admin')->get('/admin/faq')->viewData('page')['props']['orderStamp'] ?? null;
    expect($stale)->toBeString()->not->toBe('');
    $ids = FaqEntry::query()->orderBy('sort_order')->orderBy('id')->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();

    // Tab A swaps the first two; tab B, still on the older order, swaps the third and fourth.
    $moved = [$ids[1], $ids[0], ...array_slice($ids, 2)];
    $this->actingAs(faqAdmin(), 'admin')->from('/admin/faq')->put('/admin/faq/reihenfolge', ['ids' => $moved])->assertSessionHasNoErrors();
    $this->actingAs(faqAdmin(), 'admin')->from('/admin/faq')->withHeader(EditStamp::HEADER, $stale)
        ->put('/admin/faq/reihenfolge', ['ids' => [$ids[0], $ids[1], $ids[3], $ids[2], ...array_slice($ids, 4)]])
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(FaqEntry::query()->orderBy('sort_order')->orderBy('id')->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all())->toBe($moved);
});
