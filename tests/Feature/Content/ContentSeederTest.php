<?php

declare(strict_types=1);

use App\Models\Setting;
use App\Models\WheelModel;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The seeded content after the accuracy pass (docs/phase0/ACCURACY.md D5, D7, D8): no phone and no
 * reply-time promise in any row, an FAQ whose unpublished answers stay unpublished, guides seeded
 * with the status the legal research gives them, and the MOTEC as the hero unless the client has
 * chosen a real product.
 */

/** Every text value the content tables hold, as `table#id: value`, for scanning. */
function seededContentText(): array
{
    $columns = [
        'pages' => ['title', 'meta_description'],
        'page_blocks' => ['data'],
        'nav_items' => ['label', 'href', 'icon'],
        'faq_entries' => ['question_de', 'answer_de'],
    ];

    $out = [];

    foreach ($columns as $table => $fields) {
        foreach (DB::table($table)->get(['id', ...$fields]) as $row) {
            foreach ($fields as $field) {
                $value = $row->{$field};

                if (is_string($value)) {
                    // JSON rows are decoded, so an escaped `ü` cannot hide a word from the scan.
                    $decoded = $field === 'data' ? json_decode($value, true) : null;
                    $out[] = $table.'#'.$row->id.': '.(is_array($decoded) ? json_encode($decoded, JSON_UNESCAPED_UNICODE) : $value);
                }
            }
        }
    }

    return $out;
}

it('seeds no phone number, no WhatsApp and no reply-time promise anywhere, even with a phone configured', function (): void {
    // The old seeder copied the configured numbers into content rows. Configure some, and prove
    // none of them lands in a row: contact details render from config, at request time (D-023).
    config()->set('rimify.contact.phone', '0800 000 00 00');
    config()->set('rimify.contact.phone_intl', '+49 800 0000000');
    config()->set('rimify.contact.whatsapp', '+49 170 0000000');

    $this->seed(ContentSeeder::class);

    $offenders = collect(seededContentText())->filter(fn (string $line): bool => preg_match(
        '/(\+49[\s\d-]{6,}|\b0\d{2,4}[\s\/]\d{3,}|tel:|wa\.me|whatsapp|telefon|ruf einfach an|am selben werktag|mo–fr 9:00–18:00)/iu',
        $line,
    ) === 1)->values()->all();

    expect($offenders)->toBe([]);
});

it('removes the retired blocks from a database seeded before, and keeps an editor\'s own', function (): void {
    $this->seed(ContentSeeder::class);

    $kontakt = (int) DB::table('pages')->where('slug', 'kontakt')->value('id');
    $startseite = (int) DB::table('pages')->where('slug', 'startseite')->value('id');

    // The rows a pre-accuracy seed left behind (#25), and one block nobody seeded.
    DB::table('page_blocks')->insert([
        ['page_id' => $kontakt, 'type' => 'contact_info', 'sort_order' => 20, 'data' => json_encode(['phone' => '0211 1255555', 'hours' => 'Mo–Fr 9:00–18:00 Uhr']), 'created_at' => now(), 'updated_at' => now()],
        ['page_id' => $startseite, 'type' => 'feature_panels', 'sort_order' => 80, 'data' => json_encode(['body' => 'Fragen beantworten wir am Telefon']), 'created_at' => now(), 'updated_at' => now()],
        ['page_id' => $startseite, 'type' => 'editor_note', 'sort_order' => 99, 'data' => json_encode(['text' => 'eigener Block']), 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->seed(ContentSeeder::class);

    expect(DB::table('page_blocks')->where('page_id', $kontakt)->count())->toBe(0)
        ->and(DB::table('page_blocks')->where('page_id', $startseite)->pluck('type')->sort()->values()->all())
        ->toBe(['editor_note', 'hero', 'promise_row']);
});

it('gives Kontakt the envelope in the phone\'s bottom bar', function (): void {
    $this->seed(ContentSeeder::class);

    expect(DB::table('nav_items')->where('menu', 'mobile_bottom')->where('label', 'Kontakt')->value('icon'))->toBe('mail')
        ->and(DB::table('nav_items')->where('icon', 'phone')->exists())->toBeFalse();
});

it('promises in the promise row only what the client has confirmed', function (): void {
    $this->seed(ContentSeeder::class);

    $data = json_decode((string) DB::table('page_blocks as b')
        ->join('pages as p', 'p.id', '=', 'b.page_id')
        ->where('p.slug', 'startseite')
        ->where('b.type', 'promise_row')
        ->value('b.data'), true);

    $titles = array_column($data['items'], 'title');
    $lines = implode(' ', array_column($data['items'], 'text'));

    // The client's four titles stay; our lines lose the PDF, the dispatch time and "unser Haus".
    expect($titles)->toBe(['Garantierte Passgenauigkeit', 'Gutachten zu jeder Felge', 'Montiert und gewuchtet', 'Express-Versand aus Deutschland'])
        ->and($lines)->not->toContain('PDF')
        ->not->toContain('Werktag')
        ->not->toContain('unser Haus')
        ->toContain('Kompletträder kommen fertig montiert und gewuchtet bei dir an.');
});

it('gives every FAQ entry its own published flag, and a re-seed keeps an unpublished one unpublished', function (): void {
    $this->seed(ContentSeeder::class);

    $delivery = DB::table('faq_entries')->where('question_de', 'Wie lange dauert die Lieferung?')->first();

    expect($delivery)->not->toBeNull()
        ->and((bool) $delivery->published)->toBeFalse()
        ->and($delivery->answer_de)->not->toContain('Werktag')->not->toContain('Warenkorb');

    // Someone switches it on; the next seed switches it off again until the client confirms.
    DB::table('faq_entries')->where('id', $delivery->id)->update(['published' => true]);
    $this->seed(ContentSeeder::class);

    expect((bool) DB::table('faq_entries')->where('id', $delivery->id)->value('published'))->toBeFalse();

    $this->get('/faq')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('groups', fn ($groups) => collect($groups)->flatMap(fn ($g) => collect($g['entries'])->pluck('question'))->doesntContain('Wie lange dauert die Lieferung?'))
    );
});

it('answers the return question only with a pointer to the Widerrufsbelehrung', function (): void {
    $this->seed(ContentSeeder::class);

    $answer = (string) DB::table('faq_entries')->where('question_de', 'Kann ich Felgen zurückgeben?')->value('answer_de');

    expect($answer)->toContain('Widerrufsbelehrung')
        ->not->toContain('14 Tagen')
        ->not->toContain('Widerrufsrecht')
        ->not->toContain('unbenutzt')
        ->and((bool) DB::table('faq_entries')->where('question_de', 'Kann ich Felgen zurückgeben?')->value('published'))->toBeTrue();
});

it('names only the two categories the client sells, and no unconfirmed Komplettrad contents', function (): void {
    $this->seed(ContentSeeder::class);

    $about = (string) DB::table('faq_entries')->where('question_de', 'Was ist RIMIFY?')->value('answer_de');
    $komplettrad = (string) DB::table('faq_entries')->where('question_de', 'Was ist ein Komplettrad und was ist enthalten?')->value('answer_de');

    expect($about)->toContain('ohne Reifen oder als Komplettrad')
        ->not->toContain('Reifen und fertig montierte Kompletträder bekommst du auf Wunsch dazu')
        ->and($komplettrad)->not->toContain('Anbauset')
        ->not->toContain('Ventile')
        ->not->toContain('ABE')
        ->not->toContain('nur noch anschrauben');
});

it('seeds each guide with the status the legal research gives it, and corrected', function (): void {
    $this->seed(ContentSeeder::class);

    expect(DB::table('pages')->where('kind', 'guide')->orderBy('slug')->pluck('status', 'slug')->all())->toBe([
        'abe-teilegutachten-ece' => 'draft',
        'einpresstiefe-et-erklaert' => 'published',
        'hsn-und-tsn-finden' => 'published',
    ]);

    $text = fn (string $slug): string => DB::table('page_blocks as b')
        ->join('pages as p', 'p.id', '=', 'b.page_id')
        ->where('p.slug', $slug)
        ->where('b.type', 'prose')
        ->pluck('b.data')
        ->map(fn ($data) => (string) (json_decode((string) $data, true)['text'] ?? ''))
        ->implode("\n");

    expect($text('hsn-und-tsn-finden'))
        ->not->toContain('Kontaktformular')
        ->not->toContain('in der Leistung')
        ->not->toContain('Leistung in kW')
        ->toContain('schreibst uns eine E-Mail')
        ->and($text('einpresstiefe-et-erklaert'))->toContain('Mit Gutachten meinen wir hier jedes dieser Dokumente')
        ->and($text('abe-teilegutachten-ece'))->not->toContain('herunterladen');

    // A draft that someone published by hand goes back to draft on the next seed.
    DB::table('pages')->where('slug', 'abe-teilegutachten-ece')->update(['status' => 'published']);
    $this->seed(ContentSeeder::class);

    expect(DB::table('pages')->where('slug', 'abe-teilegutachten-ece')->value('status'))->toBe('draft');
});

it('makes the MOTEC the hero when none is set, or a demo model is', function (): void {
    $motec = WheelModel::factory()->create(['slug' => ContentSeeder::HERO_SLUG, 'name' => 'MCR4 Ultimate', 'is_demo' => true]);
    $demo = WheelModel::factory()->create(['is_demo' => true]);

    $this->seed(ContentSeeder::class);
    expect(Setting::get('hero_product_id'))->toBe($motec->id);

    Setting::set('hero_product_id', $demo->id);
    $this->seed(ContentSeeder::class);
    expect(Setting::get('hero_product_id'))->toBe($motec->id);

    // A setting naming a model that no longer exists is no choice at all.
    Setting::set('hero_product_id', 999_999);
    $this->seed(ContentSeeder::class);
    expect(Setting::get('hero_product_id'))->toBe($motec->id);
});

it('keeps a real product the client has chosen as the hero', function (): void {
    WheelModel::factory()->create(['slug' => ContentSeeder::HERO_SLUG, 'is_demo' => true]);
    $real = WheelModel::factory()->create(['is_demo' => false]);

    Setting::set('hero_product_id', $real->id);
    $this->seed(ContentSeeder::class);

    expect(Setting::get('hero_product_id'))->toBe($real->id);
});

it('leaves the hero setting alone before the catalogue exists', function (): void {
    $this->seed(ContentSeeder::class);

    expect(Setting::get('hero_product_id'))->toBeNull();
});

it('duplicates nothing and loses nothing when it runs twice', function (): void {
    WheelModel::factory()->create(['slug' => ContentSeeder::HERO_SLUG, 'is_demo' => true]);

    $counts = fn (): array => collect(['pages', 'page_blocks', 'nav_items', 'faq_entries', 'settings'])
        ->mapWithKeys(fn (string $table): array => [$table => DB::table($table)->count()])
        ->all();

    $this->seed(ContentSeeder::class);
    $first = $counts();

    $this->seed(ContentSeeder::class);

    expect($counts())->toBe($first);
});
