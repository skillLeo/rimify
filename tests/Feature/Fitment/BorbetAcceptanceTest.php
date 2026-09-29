<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Storage;
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
        // A Nachtrag to ABE 53841, which we do not hold: said on the record and to the customer.
        ->and($nachtrag->baseMissingDe())->toBe('Grundgutachten ABE 53841 liegt uns nicht vor – dieser Nachtrag allein ist nicht die ganze Freigabe.');

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

    // The Verwendungsbereich: BMW and MINI — on the 19″ the Countryman UKL/X, the Countryman JCW and the Paceman UKL-C/X.
    $cars = Vehicle::query()->whereIn('id', Fitment::query()->where('approval_document_id', $this->entry->documents['55255'])->pluck('vehicle_id'))->get();

    expect($cars->pluck('make')->unique()->sort()->values()->all())->toBe(['BMW', 'MINI'])
        ->and($cars->where('make', 'MINI')->map(static fn (Vehicle $v): string => $v->model.' '.$v->type_designation)->unique()->sort()->values()->all())
        ->toBe(['Countryman JCW UKL/X', 'Countryman UKL-N1', 'Countryman UKL/X', 'Paceman JCW UKL-C/X', 'Paceman UKL-C/X']);
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
        ->and($verdict->requiresEntry)->toBeTrue();

    // Every sentence is ABE 55255's own, word for word — never a code, never another document's.
    foreach ([...$verdict->conditions, ...($size?->conditions ?? [])] as $condition) {
        if (str_starts_with($condition->code, 'KW ')) {
            continue;
        }

        expect($condition->sentenceDe())->toContain(printedSentence('abe-55255.json', $condition->code));
    }

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
