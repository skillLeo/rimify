<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\PapersBook;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\CheckResult;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\TranscriptionEntry;

/**
 * Block D, item 16: the Borbet brief's §7 acceptance test, asserted against the two documents as transcribed
 * from their PDFs (docs/gutachten, cross-checked cell by cell against the PDFs' text) — never against the
 * client's summary. Both are typed in through the admin's endpoints and released there, then asked of the
 * engine the shop asks.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    $this->seed(GoldenRecordSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
    // A person types a car a minute at most 30 times; the test types 76.
    $this->withoutMiddleware(ThrottleRequests::class);

    $this->entry = new TranscriptionEntry($this, AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail());
    $this->entry->enterBoth();
});

/** The legend sentence a document prints for a code. */
function printedSentence(string $file, string $code): string
{
    $conditions = TranscriptionEntry::read($file)['conditions'];

    return (string) collect($conditions)->firstWhere('code', $code)['text_de'];
}

function borbetVerdict(Vehicle $vehicle, string $sku): FitmentVerdict
{
    return app(FitmentResolver::class)->resolve($vehicle->id, (int) WheelConfig::query()->where('sku', $sku)->value('id'));
}

it('holds both documents as they print their first page, the wheel as they describe it, and BMW and MINI', function (): void {
    $abe = ApprovalDocument::query()->findOrFail($this->entry->documents['55255']);
    $nachtrag = ApprovalDocument::query()->findOrFail($this->entry->documents['366']);

    expect($abe->status)->toBe(DocumentStatus::Published)
        ->and($abe->kba_number)->toBe('55255')
        ->and($abe->issuer)->toBe('TÜV Rheinland Kraftfahrt GmbH')
        ->and($abe->getAttribute('annex'))->toBe('19')
        ->and($abe->getAttribute('test_report_number'))->toBe('55051823')
        ->and($abe->page_count)->toBe(13)
        ->and($abe->test_date?->format('Y-m-d'))->toBe('2023-11-29')
        ->and($abe->valid_from_production?->format('m/Y'))->toBe('02/2023');

    expect($nachtrag->status)->toBe(DocumentStatus::Published)
        ->and($nachtrag->report_number)->toBe('366-0350-21-WIRD/N1')
        ->and($nachtrag->issuer)->toBe('TÜV AUSTRIA GMBH')
        ->and($nachtrag->getAttribute('annex'))->toBe('16')
        ->and($nachtrag->page_count)->toBe(24)
        ->and($nachtrag->valid_from_production?->format('m/Y'))->toBe('02/2021')
        // A Nachtrag to ABE 53841, which we now hold: linked, no longer „liegt uns nicht vor“ — and holding only
        // Anlage 16 of the 16 its Verwendungsbereich names.
        ->and($nachtrag->supplementTo?->kba_number)->toBe('53841')
        ->and($nachtrag->baseMissingDe())->toBeNull()
        ->and($nachtrag->scopeIncompleteDe())->toBe('Verwendungsbereich unvollständig – Anlagen 1–15 liegen nicht vor.')
        // Point 10 of the base is the Nachtrag's too, once the base is released (§ 15 FZV).
        ->and($nachtrag->papers_correction_required)->toBeNull()
        ->and($nachtrag->papersCorrectionRequired())->toBeFalse();

    // ABE 53841*01 (KBA, 16.07.2025, 13 pages): its own facts, no rows — its Verwendungsbereich is the Anlagen.
    $base = ApprovalDocument::query()->findOrFail($this->entry->documents['53841']);

    expect($base->status)->toBe(DocumentStatus::Published)
        ->and($base->issuer)->toBe('Kraftfahrt-Bundesamt')
        ->and($base->issued_on?->format('Y-m-d'))->toBe('2025-07-16')
        ->and($base->page_count)->toBe(13)
        ->and($base->getAttribute('test_report_number'))->toBe('366-0350-21-WIRD/N1')
        ->and($base->papers_correction_required)->toBeFalse()
        ->and($base->fitments()->count())->toBe(0);

    $nineteen = WheelConfig::query()->where('sku', 'BOR-DB8GT2-8519-SM')->firstOrFail();
    $eighteen = WheelConfig::query()->where('sku', 'BOR-DB8GT2-8518-SM')->firstOrFail();

    expect([(float) $nineteen->width_in, (float) $nineteen->diameter_in, $nineteen->et_mm, (int) $nineteen->bolt_holes, (float) $nineteen->bolt_circle_mm, (float) $nineteen->centre_bore_mm, (int) $nineteen->max_load_kg, $nineteen->hump, $nineteen->kba_number])
        ->toBe([8.5, 19.0, 35, 5, 120.0, 72.6, 700, 'H2', '55255'])
        ->and([(float) $eighteen->width_in, (float) $eighteen->diameter_in, $eighteen->et_mm, (int) $eighteen->bolt_holes, (float) $eighteen->bolt_circle_mm, (float) $eighteen->centre_bore_mm, (int) $eighteen->max_load_kg, $eighteen->hump, $eighteen->kba_number])
        ->toBe([8.5, 18.0, 35, 5, 120.0, 72.5, 650, 'H2', '53841']);

    // What the catalogue holds no column for stands in the transcription's record of page 1.
    expect(implode(' ', TranscriptionEntry::read('abe-55255.json')['read']))
        ->toContain('Typ DB8GT2-8519')->toContain('Radlast 700 kg')->toContain('Abrollumfang 2260 mm')->toContain('„DB8GT2-8519 LK120 / ohne Ring“')
        ->and(implode(' ', TranscriptionEntry::read('366-0350-21-WIRD-N1.json')['read']))
        ->toContain('Radtyp DB8GT2-8518')->toContain('Ausführung 512035725')->toContain('„DB8GT2-8518 LK120 / Ø72,5-60,1“')->toContain('Abrollumfang 2200 mm')->toContain('gültig ab Fertigungsdatum 02/21');

    // Item 14, now closed: the base linked on the record, and the Anlagen we lack said there and in the coverage matrix.
    $this->actingAs(AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail(), 'admin')
        ->get('/admin/gutachten/'.$nachtrag->id)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('document.baseMissing', null)
            ->where('document.supplementTo.label', 'ABE 53841')
            ->where('document.supplementTo.href', '/admin/gutachten/'.$base->id)
            ->where('document.scopeIncomplete', 'Verwendungsbereich unvollständig – Anlagen 1–15 liegen nicht vor.')
            ->where('document.header', fn ($header): bool => collect($header)->contains(
                static fn (array $row): bool => $row['label'] === 'Berichtigung der Fahrzeugpapiere' && str_starts_with($row['value'], 'nicht erforderlich'),
            )));
    $this->actingAs(AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail(), 'admin')
        ->get('/admin/abdeckung')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('matrix.incomplete', 0)
            ->has('matrix.missingAnnexes', 1)
            ->where('matrix.missingAnnexes.0.document', 'Nachtrag 366-0350-21-WIRD/N1')
            ->where('matrix.missingAnnexes.0.annexes', '1–15')
            ->where('matrix.missingAnnexes.0.href', '/admin/gutachten/'.$nachtrag->id));

    // The Verwendungsbereich: BMW and MINI — on the 19″ the Countryman UKL/X, the Countryman JCW and the Paceman UKL-C/X.
    $cars = Vehicle::query()->whereIn('id', Fitment::query()->where('approval_document_id', $this->entry->documents['55255'])->pluck('vehicle_id'))->get();

    expect($cars->pluck('make')->unique()->sort()->values()->all())->toBe(['BMW', 'MINI'])
        ->and($cars->where('make', 'MINI')->map(static fn (Vehicle $v): string => $v->model.' '.$v->type_designation)->unique()->sort()->values()->all())
        ->toBe(['Countryman JCW UKL/X', 'Countryman UKL-N1', 'Countryman UKL/X', 'Paceman JCW UKL-C/X', 'Paceman UKL-C/X']);
});

it('keeps each tyre size’s Auflagen with that size on the BMW X3 X83 — A10 with 235/45 and 245/40, A12 with 255/40, the row’s set for all — on every surface', function (): void {
    // ABE 55255, page 5: the row prints A14 A18 V19 S03; 235/45R19 adds A10 T95 T99, 245/40R19 A10 T94 T98, 255/40R19
    // A01 A12 K1b K2b. A10 allows fine-link chains on the rear axle, A12 forbids chains: the widest size leaves no
    // clearance. Blended, the customer reads both and believes neither.
    $car = $this->entry->vehicle('x3-X83');
    $car->forceFill(['power_kw' => 150, 'axle_load_front_kg' => 1150, 'axle_load_rear_kg' => 1300, 'max_speed_kmh' => 210, 'needs_review' => false])->save();

    $verdict = borbetVerdict($car, 'BOR-DB8GT2-8519-SM');
    $groups = $verdict->conditionGroups();
    $codes = static fn (array $list): array => array_map(static fn (Condition $c): string => $c->code, $list);

    expect($codes($groups->forSize('235/45/19')))->toContain('A10')->not->toContain('A12')
        ->and($codes($groups->forSize('245/40/19')))->toContain('A10')->not->toContain('A12')
        ->and($codes($groups->forSize('255/40/19')))->toContain('A12')->not->toContain('A10');

    foreach (['235/45/19', '245/40/19', '255/40/19'] as $size) {
        expect($codes($groups->forSize($size)))->toContain('A14', 'A18', 'V19', 'S03');
    }

    // The row's set is said once, for the whole combination; each size says only its own.
    $bySize = collect($groups->sizes)->keyBy(static fn (array $s): string => $s['size']->key());

    expect($codes($groups->combination))->toEqualCanonicalizing(['A14', 'A18', 'V19', 'S03'])
        ->and($codes($bySize['235/45/19']['own']))->toEqualCanonicalizing(['A10', 'T95', 'T99'])
        ->and($codes($bySize['245/40/19']['own']))->toEqualCanonicalizing(['A10', 'T94', 'T98'])
        ->and($codes($bySize['255/40/19']['own']))->toEqualCanonicalizing(['A01', 'A12', 'K1b', 'K2b'])
        // The Abnahme (A01) is the 255's alone: the narrower sizes need none.
        ->and($bySize['255/40/19']['entry'])->toBeTrue()
        ->and($bySize['235/45/19']['entry'])->toBeFalse()
        ->and($bySize['245/40/19']['entry'])->toBeFalse()
        ->and($groups->differBySize())->toBeTrue()
        ->and($groups->entryDiffers())->toBeTrue();

    $chains = printedSentence('abe-55255.json', 'A10');
    $noChains = printedSentence('abe-55255.json', 'A12');
    $shape = $groups->toArray();
    $said = collect($shape['sizes'])->keyBy('size');

    // What every surface renders: never both chain sentences in one list.
    expect($shape['combination'])->not->toContain($chains)->not->toContain($noChains)
        ->and($said['235/45 R19']['conditions'])->toContain($chains)->not->toContain($noChains)
        ->and($said['255/40 R19']['conditions'])->toContain($noChains)->not->toContain($chains)
        // A Komplettrad with its tyre chosen says that size's, and the row's.
        ->and($groups->toArray('255/40/19')['combination'])->toContain($noChains)->not->toContain($chains)
        ->and($groups->toArray('255/40/19')['chosen'])->toBe('255/40 R19')
        ->and($groups->toArray('255/40/19')['entry'])->toBeTrue()
        ->and($groups->toArray('235/45/19')['entry'])->toBeFalse();

    // The frozen order snapshot reads back the same groups — and one frozen before the split is read from its sizes.
    $frozen = FitmentVerdict::fromArray($verdict->toArray())->conditionGroups()->toArray();
    $legacy = $verdict->toArray();
    unset($legacy['combinationConditions']);

    expect($frozen)->toBe($shape)
        ->and(FitmentVerdict::fromArray($legacy)->conditionGroups()->toArray())->toBe($shape);

    // The product page, the admin preview and the printable check ship the groups, not one blended list.
    WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->update(['status' => CatalogueStatus::Published->value]);
    $nineteenId = (int) WheelConfig::query()->where('sku', 'BOR-DB8GT2-8519-SM')->value('id');
    $page = $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($car->id, true))->encode()])
        ->get('/felgen/'.GoldenRecordSeeder::SLUG)->assertOk();
    $shown = collect($page->viewData('page')['props']['configs'])->firstWhere('id', $nineteenId)['verdict'];

    expect($shown['conditionGroups'])->toBe($shape);

    $preview = app(DocumentPreview::class)->for(ApprovalDocument::query()->findOrFail($this->entry->documents['55255']), $car->id);

    expect(collect($preview)->firstWhere('config', $nineteenId)['conditionGroups'])->toBe($shape);
});

it('answers BMW 1er 187 at 85–195 kW on 235/35R19 with exactly the codes ABE 55255 prints, each its own sentence, and never another document’s', function (): void {
    // ABE 55255, page 2: 187, e1*2001/116*0287*00-09. The car's own figures for the test: 150 kW, and axle
    // loads and a top speed so the tyre half can be decided.
    $car = $this->entry->vehicle('1er-187-00-09');
    $car->forceFill(['power_kw' => 150, 'axle_load_front_kg' => 880, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 210, 'needs_review' => false])->save();

    $verdict = borbetVerdict($car, 'BOR-DB8GT2-8519-SM');
    $size = collect([...$verdict->front->sizes, ...$verdict->rear->sizes])->first(static fn ($s): bool => $s->key() === '235/35/19');
    $sizeCodes = array_map(static fn (Condition $c): string => $c->code, $size?->conditions ?? []);
    $codes = array_map(static fn (Condition $c): string => $c->code, $verdict->conditions);

    expect($size)->not->toBeNull()
        ->and($sizeCodes)->toEqualCanonicalizing(['G73', 'K14', 'K2b', 'K41', 'K43', 'K46', 'T87'])
        ->and($codes)->toContain('A01', 'A12', 'A14', 'A18', 'K1c', 'K42', 'V19', 'S01')
        // 215/35R19 is printed for 85–125 kW only: not for a 150 kW car, and so neither is its T85.
        ->and(array_map(static fn ($s): string => $s->key(), $verdict->front->sizes))->not->toContain('215/35/19')
        ->and($codes)->not->toContain('T85')
        // The wheel is approved; the Abnahme (A01) and the body work make it „freigegeben mit Auflagen“ — the
        // four states' CONDITIONAL, never a bare PERMITTED while the customer still has to act (R-07).
        ->and($verdict->wheelStatus)->toBe(VerdictStatus::Conditional)
        ->and($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->requiresEntry)->toBeTrue()
        // D-02: the RIMIFY-Check, the order snapshot and the mails name the car as the header does.
        ->and($verdict->toArray()['vehicle']['label'])->toStartWith('BMW 1er-Reihe 187, ')->not->toContain('(187)');

    // Every sentence is ABE 55255's own, word for word — never a code, never another document's.
    foreach ([...$verdict->conditions, ...($size?->conditions ?? [])] as $condition) {
        if (str_starts_with($condition->code, 'KW ')) {
            continue;
        }

        expect($condition->sentenceDe())->toContain(printedSentence('abe-55255.json', $condition->code));
    }

    // Item 15, on the product page: the bolt set its code names (S01: M12x1,5, 110 Nm, Artikel 5248), each size
    // with its axle and band, the Auflagen by section, and the PDF at the page the row stands on (page 2).
    WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->update(['status' => CatalogueStatus::Published->value]);
    $nineteenId = (int) WheelConfig::query()->where('sku', 'BOR-DB8GT2-8519-SM')->value('id');
    $page = $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($car->id, true))->encode()])
        ->get('/felgen/'.GoldenRecordSeeder::SLUG)->assertOk();
    $shown = collect($page->viewData('page')['props']['configs'])->firstWhere('id', $nineteenId)['verdict'];

    // Named as the document names it, never by the Fahrzeugtyp alone.
    expect($page->viewData('page')['props']['vehicle']['label'] ?? null)->toBe('BMW 1er-Reihe 187');

    expect(array_column($shown['detail']['sections'], 'title'))->toBe(['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen', 'Hinweise'])
        ->and($shown['detail']['fasteners'])->toBe([['number' => 'S01', 'thread' => 'Schraube M12x1,5', 'label' => 'Schraube M12x1,5, Kegel 60°, Schaftlänge 30'."\u{00A0}".'mm', 'torque' => '110'."\u{00A0}".'Nm', 'article' => '5248', 'limit' => null]])
        ->and(collect($shown['detail']['tyres'])->firstWhere('label', '235/35 R19'))->toBe(['label' => '235/35 R19', 'axle' => 'Vorder- und Hinterachse', 'minimum' => null, 'band' => '85–195'."\u{00A0}".'kW'])
        ->and(collect($shown['detail']['tyres'])->firstWhere('label', '255/30 R19')['axle'])->toBe('nur Hinterachse')
        ->and($shown['document']['pdf']['page'])->toBe(2)
        // ABE 55255 says nothing of § 15 FZV: no line about the papers beyond its A01.
        ->and($shown['papersExempt'])->toBeFalse()
        ->and(json_encode($shown['detail']))->not->toMatch('/"(A01|K1c|T87)"/');

    // D-04: K14 is printed beside 235/35R19 only, so it says so; A01 is the row's, for every size.
    $items = collect($shown['detail']['sections'])->flatMap(static fn (array $s): array => $s['items']);

    expect($items->firstWhere('text', printedSentence('abe-55255.json', 'K14'))['sizes'] ?? null)->toContain('235/35 R19')
        ->and($items->firstWhere('text', printedSentence('abe-55255.json', 'A01'))['sizes'] ?? null)->toBe([]);

    // The 18″ on a 1K4 from Modelljahr 2012 (page 3): the rework millimetres the Nachtrag prints for type 1K4
    // (page 22), both bolt sets the page gives a 1K4 with what it prints beside each, the 50 km torque check, and
    // the base it lacks. Its row prints „Kombilimousine; Allradantrieb; Heckantrieb“ — this document's word for
    // the 1er hatch (DATA-CONFLICTS Nr. 5): the car is given here as what its owner calls it, a Schrägheck.
    $f20 = $this->entry->vehicle('1er-1K4-04');
    $f20->forceFill(['power_kw' => 100, 'body_form' => 'Schrägheck', 'drive_axle' => 'Hinterachse'])->save();

    // One answer, both documents: the 5-door 1er the owner calls a Schrägheck passes 55255's Y85 and the
    // Nachtrag's „Kombilimousine“ alike — neither word rewritten, each mapped once.
    expect(borbetVerdict($f20, 'BOR-DB8GT2-8519-SM')->reason?->code)->not->toBe(VerdictReason::BODY_OR_DRIVE_EXCLUDED)
        ->and(borbetVerdict($f20, 'BOR-DB8GT2-8518-SM')->reason?->code)->not->toBe(VerdictReason::BODY_OR_DRIVE_EXCLUDED)
        ->and(borbetVerdict($f20, 'BOR-DB8GT2-8518-SM')->status)->toBe(VerdictStatus::Conditional);
    $f20->forceFill(['body_form' => 'Kombi'])->save();
    expect(borbetVerdict($f20, 'BOR-DB8GT2-8518-SM')->reason?->code)->toBe(VerdictReason::BODY_OR_DRIVE_EXCLUDED);
    $f20->forceFill(['body_form' => 'Schrägheck'])->save();
    $eighteenId = (int) WheelConfig::query()->where('sku', 'BOR-DB8GT2-8518-SM')->value('id');
    $page = $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($f20->id, true))->encode()])
        ->get('/felgen/'.GoldenRecordSeeder::SLUG)->assertOk();
    $shown = collect($page->viewData('page')['props']['configs'])->firstWhere('id', $eighteenId)['verdict'];
    $work = collect($shown['detail']['sections'])->firstWhere('title', 'Arbeiten am Fahrzeug')['items'];

    expect(collect($work)->firstWhere('text', printedSentence('366-0350-21-WIRD-N1.json', '26B'))['measures'])->toBe(['Vorderachse: von 190 bis 220'."\u{00A0}".'mm'])
        ->and(collect($work)->firstWhere('text', printedSentence('366-0350-21-WIRD-N1.json', '27F'))['measures'])->toBe(['Hinterachse: von 220 bis 270'."\u{00A0}".'mm · aufgeweitet um 30'."\u{00A0}".'mm'])
        // D-08: page 2 gives 1K4 „Set Nr. 5248 (nur bis Nachtrag 03)“ and „Set Nr. 5276 (ab Nachtrag 04)“; this car
        // is e1*2007/46*0283*04-.., so only the second is its own.
        ->and(array_column($shown['detail']['fasteners'], 'limit'))->toBe(['ab Nachtrag 04'])
        ->and(array_column($shown['detail']['fasteners'], 'torque'))->toBe(['140'."\u{00A0}".'Nm'])
        ->and(array_column($shown['detail']['fasteners'], 'number'))->toBe([null])
        ->and($shown['detail']['notices'])->toContain('Der Fahrzeughalter muss auf die Kontrolle des Anzugsmoments der Befestigungsmittel nach einer Wegstrecke von 50km hingewiesen werden.')
        // D-03: page 24 captions drawings the page does not show and lists codes — it is no Hinweis for the customer.
        ->and(implode(' ', $shown['detail']['notices']))->not->toContain('Hinweisblatt')->not->toContain('24C')
        ->and(implode(' ', $shown['document']['notes'] ?? []))->not->toContain('liegt uns nicht vor')
        // Point 10 of ABE 53841: no correction of the papers — its own line, beside the Abnahme 11A still asks for.
        ->and($shown['requiresEntry'])->toBeTrue()
        ->and($shown['papersExempt'])->toBeTrue();

    // Never a 19″ code read with the 18″ document, nor the other way round.

    $nineteen = collect(TranscriptionEntry::read('abe-55255.json')['conditions'])->pluck('text_de')->all();
    $eighteen = collect(TranscriptionEntry::read('366-0350-21-WIRD-N1.json')['conditions'])->pluck('text_de')->all();
    $verdict = borbetVerdict($car, 'BOR-DB8GT2-8518-SM');
    $said = array_map(static fn (Condition $c): string => $c->textDe, array_filter($verdict->conditions, static fn (Condition $c): bool => ! str_starts_with($c->code, 'KW ')));

    // The Nachtrag's own 187 block (page 4): 4-türig, 11A … — not one sentence of ABE 55255.
    expect($said)->not->toBeEmpty()
        ->and(array_intersect($said, $nineteen))->toBe([])
        ->and(array_diff($said, $eighteen))->toBe([]);
});

/*
 * The operator's last prompt §1.1: a car typed from a Gutachten has no body style or drive, so most of the two
 * documents' rows could not be answered. The answer now says exactly what it waits for; the owner's word (kept
 * beside 8.1, 8.2 and T) answers it; a name that leaves no doubt answers it first; the frozen check says which.
 */
it('asks for exactly the body style and drive a row needs, answers from the owner’s word or an unambiguous name, and freezes which', function (): void {
    WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->update(['status' => CatalogueStatus::Published->value]);
    $eighteen = WheelConfig::query()->where('sku', 'BOR-DB8GT2-8518-SM')->firstOrFail();

    // The Nachtrag's 1er row, page 3: „Kombilimousine; Allradantrieb; Heckantrieb“. The car from the document has neither.
    $f20 = $this->entry->vehicle('1er-1K4-04');
    $f20->forceFill(['power_kw' => 100, 'body_form' => null, 'drive_axle' => null])->save();
    $asked = borbetVerdict($f20, 'BOR-DB8GT2-8518-SM');

    expect($asked->status)->toBe(VerdictStatus::Unknown)
        ->and($asked->reason?->code)->toBe(VerdictReason::BODY_OR_DRIVE_UNKNOWN)
        ->and($asked->missingFacts)->toBe(['bodyForm', 'driveAxle']);

    // The product page asks for them by name.
    $vehicleCookie = [VehicleContext::COOKIE => (new VehicleContext($f20->id, true))->encode()];
    $shown = collect($this->withCookies($vehicleCookie)->get('/felgen/'.GoldenRecordSeeder::SLUG)->viewData('page')['props']['configs'])
        ->firstWhere('id', $eighteen->id)['verdict'];

    expect($shown['status'])->toBe('UNKNOWN')->and($shown['missing'])->toBe(['bodyForm', 'driveAxle']);

    // The owner says: Schrägheck, Heckantrieb — and the same page answers, without the question.
    $saved = $this->from('/felgen/'.GoldenRecordSeeder::SLUG)
        ->post("/fahrzeug/{$f20->id}/aufbau", ['body_form' => 'Schrägheck', 'drive_axle' => 'Hinterachse'])
        ->assertSessionHasNoErrors();
    $papers = collect($saved->headers->getCookies())->first(static fn ($c): bool => $c->getName() === PapersBook::COOKIE)?->getValue();

    expect($papers)->toBe("{$f20->id}-k53");

    $page = $this->withCookies($vehicleCookie)->withUnencryptedCookie(PapersBook::COOKIE, (string) $papers)->get('/felgen/'.GoldenRecordSeeder::SLUG);
    $answered = collect($page->viewData('page')['props']['configs'])->firstWhere('id', $eighteen->id)['verdict'];

    expect($answered['status'])->toBe('CONDITIONAL')
        ->and($answered['missing'])->toBe([])
        ->and($page->viewData('page')['props']['vehicle']['build'])->toMatchArray(['bodyForm' => 'Schrägheck', 'bodySource' => 'customer', 'driveAxle' => 'Hinterachse', 'driveSource' => 'customer']);

    // The printable check freezes which answer it rested on, and where that came from.
    $this->withCookies($vehicleCookie)->withUnencryptedCookie(PapersBook::COOKIE, (string) $papers)
        ->post('/rimify-check/ergebnis', ['wheelConfigId' => $eighteen->id]);

    expect(CheckResult::query()->sole()->verdict['vehicle'])->toMatchArray([
        'bodyForm' => 'Schrägheck', 'bodyFormSource' => 'customer', 'driveAxle' => 'Hinterachse', 'driveAxleSource' => 'customer',
    ]);

    // A Touring whose data has no body style: „Touring“ leaves no doubt — derived, and frozen as derived.
    $touring = $this->entry->vehicle('3tvi-3K-06');
    $touring->forceFill(['body_form' => null])->save();
    $derived = borbetVerdict($touring, 'BOR-DB8GT2-8519-SM')->toArray()['vehicle'];

    expect($derived['bodyForm'])->toBe('Kombi')->and($derived['bodyFormSource'])->toBe('name');
});

/*
 * The Nachtrag prints no table of tyre load at speed (pages 7–17: Auflage 10B sends the speed rating to the car's
 * papers and caps the axle at twice the 650 kg Radlast; 725 asks for metal valves above 210 km/h — neither is a
 * table). So every car faster than 210 km/h answers UNKNOWN for the tyres on the 18″, with the reason as a
 * sentence, and never PERMITTED as a whole (R-03); up to 210 km/h the missing table changes nothing. ABE 55255
 * prints one (page 6). The gap is named in the coverage matrix for whoever runs the shop.
 */
it('answers UNKNOWN for the tyres of every car over 210 km/h on the 18″, in a sentence — and names the gap in the coverage matrix', function (): void {
    $f20 = $this->entry->vehicle('1er-1K4-04');
    $f20->forceFill(['power_kw' => 100, 'body_form' => 'Schrägheck', 'drive_axle' => 'Hinterachse', 'axle_load_front_kg' => 1000, 'axle_load_rear_kg' => 1100, 'max_speed_kmh' => 250, 'needs_review' => false])->save();

    $fast = borbetVerdict($f20, 'BOR-DB8GT2-8518-SM');

    expect($fast->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($fast->tyre?->summary)->toBe('Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit. Für 250 km/h können wir die Reifen deshalb nicht bestätigen.')
        ->and($fast->status)->not->toBe(VerdictStatus::Permitted)
        ->and($fast->status)->toBe(VerdictStatus::Unknown)
        // The wheel itself stays approved by the Nachtrag.
        ->and($fast->wheelStatus)->toBe(VerdictStatus::Conditional);

    // At 210 km/h the missing table has nothing to say.
    $f20->forceFill(['max_speed_kmh' => 210])->save();
    expect(borbetVerdict($f20, 'BOR-DB8GT2-8518-SM')->tyre?->summary ?? '')->not->toContain('keine Tabelle');

    // The 19″ document prints its table: the same car at 250 km/h is answered from it, not refused for its lack.
    $f20->forceFill(['max_speed_kmh' => 250])->save();
    expect(borbetVerdict($f20, 'BOR-DB8GT2-8519-SM')->tyre?->summary ?? '')->not->toContain('keine Tabelle');

    $this->actingAs(AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail(), 'admin')
        ->get('/admin/abdeckung')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('matrix.noSpeedTable', 1)
            ->where('matrix.noSpeedTable.0.document', 'Nachtrag 366-0350-21-WIRD/N1')
            ->where('matrix.noSpeedTable.0.href', '/admin/gutachten/'.$this->entry->documents['366']));
});

/*
 * ABE 53841, point 9: the 18″'s Verwendungsbereich is „Anlage/n zum Prüfbericht 1–16“, and we hold Anlage 16 only (the
 * BMW pages of the Nachtrag). A car those pages do not name may stand in one of the other fifteen — the MINI Paceman,
 * which 55255 names on the 19″, is such a car: „Anlage liegt uns noch nicht vor“, UNKNOWN, never „nicht freigegeben“.
 * ABE 55255 is complete: a car it does not name is refused on the 19″ as before.
 */
it('answers a car the Anlage we hold does not name UNKNOWN on the 18″ — the Anlage is missing — and still refuses it where the document is whole', function (): void {
    $paceman = $this->entry->vehicle('pm-UKLCX-00');
    $eighteen = borbetVerdict($paceman, 'BOR-DB8GT2-8518-SM');

    expect($eighteen->status)->toBe(VerdictStatus::Unknown)
        ->and($eighteen->reason?->code)->toBe(VerdictReason::ANNEX_MISSING)
        ->and($eighteen->reason?->textDe)->toContain('liegt uns die entsprechende Anlage des Gutachtens noch nicht vor')
        ->and($eighteen->papersExempt())->toBeFalse();

    // The BMW Z4 is named by the Nachtrag only: on the whole ABE 55255 it is refused, as the document says.
    $z4 = $this->entry->vehicle('z4-ZR');

    expect(borbetVerdict($z4, 'BOR-DB8GT2-8519-SM')->status)->toBe(VerdictStatus::NotPermitted);
});

it('refuses a Limousine a row the document gives the Coupé only — NOT_PERMITTED, not a note — and keeps apart the cars one approval names twice', function (): void {
    // ABE 55255, page 5: Mini Paceman UKL-C/X, row code „Cpe“ and no other body style.
    $paceman = $this->entry->vehicle('pm-UKLCX-00');

    $paceman->forceFill(['body_form' => 'Limousine'])->save();
    $limousine = borbetVerdict($paceman, 'BOR-DB8GT2-8519-SM');

    $paceman->forceFill(['body_form' => 'Coupe'])->save();
    $coupe = borbetVerdict($paceman, 'BOR-DB8GT2-8519-SM');

    expect($limousine->status)->toBe(VerdictStatus::NotPermitted)
        ->and($limousine->reason?->code)->toBe(VerdictReason::BODY_OR_DRIVE_EXCLUDED)
        ->and($coupe->status)->not->toBe(VerdictStatus::NotPermitted)
        ->and($coupe->status)->not->toBe(VerdictStatus::Unknown);

    // The cars one approval names twice keep their own rows.
    // ABE 55255, page 4: 5L „ohne“ and „mit Allradlenkung“ — L05 and L04, never both on one car. Both rows print
    // „Lim“ and a drive code, so the cars' own body style and drive are given here (a Limousine, rear-wheel drive).
    foreach (['5-5L-ohne', '5-5L-mit'] as $key) {
        $this->entry->vehicle($key)->forceFill(['body_form' => 'Limousine', 'drive_axle' => 'Hinterachse'])->save();
    }

    $without = borbetVerdict($this->entry->vehicle('5-5L-ohne'), 'BOR-DB8GT2-8519-SM');
    $with = borbetVerdict($this->entry->vehicle('5-5L-mit'), 'BOR-DB8GT2-8519-SM');
    $codes = static fn (FitmentVerdict $v): array => array_map(static fn (Condition $c): string => $c->code, $v->conditions);

    expect($codes($without))->toContain('L05')->not->toContain('L04')
        ->and($codes($with))->toContain('L04')->not->toContain('L05');
});
