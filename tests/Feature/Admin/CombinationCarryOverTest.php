<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Enums\DocumentStatus;
use App\Models\ApprovalDocument;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\CombinationCensus;
use App\Services\Admin\Approvals\CombinationEntries;
use App\Support\EgNumber;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * His admin item 19, the migration (the operator's brief of 29.10.2026, Batch 2, §4; D-358): the lists entered per
 * document move onto every entry of that document, marked „übernommen, bitte prüfen“, without changing a single verdict.
 * Every car × rim pair — of the demo data, and of lists shaped as the preview's (a released Gutachten's two rows, a
 * superseded one's single row) — is read as the shop read the lists before and per entry after, and the two must be
 * identical. Where one answer would differ, nothing moves.
 */

// The demo data as the storefront tests have it — published, so its verdicts are answers and not a draft's refusal.
beforeEach(function (): void {
    CatalogueSeeder::$shopFixture = true;
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
});

afterEach(function (): void {
    CatalogueSeeder::$shopFixture = false;
});

const CARRY_CAR_K = 'e1*2001/116*0287*05';

const CARRY_OTHER_K = 'e1*2001/116*0300*02';

/** A list as it was entered before item 19: no entry on its rows. */
function carryOverRow(ApprovalDocument $document, int $number, TyreSize $front, TyreSize $rear, int $page): DocumentTyreCombination
{
    return DocumentTyreCombination::query()->create([
        'approval_document_id' => $document->id, 'number' => $number,
        'front_width_mm' => $front->widthMm, 'front_aspect' => $front->aspect, 'front_diameter_in' => $front->diameterIn,
        'rear_width_mm' => $rear->widthMm, 'rear_aspect' => $rear->aspect, 'rear_diameter_in' => $rear->diameterIn,
        'source_page' => $page,
    ]);
}

/**
 * The fixture's released Gutachten with two vehicle types under it — the fixture's car and the same car under another
 * make, each with its own field K — and a list of two: Nr. 1 the fixture's size on both axles, Nr. 2 a wider one at the
 * rear, which the cars' rows list for the rear axle. Beside it a superseded Gutachten with a list of one.
 *
 * @return array{0: KomplettradFixture, 1: Vehicle, 2: list<DocumentTyreCombination>, 3: ApprovalDocument}
 */
function carryOverSetup(): array
{
    $fx = KomplettradFixture::permitted();
    $front = $fx->size;
    $rear = new TyreSize($front->widthMm + 30, $front->aspect - 5, $front->diameterIn);

    foreach (Fitment::query()->where('vehicle_id', $fx->vehicle->id)->where('wheel_config_id', $fx->config->id)->get() as $row) {
        FitmentTyreSize::query()->create(['fitment_id' => $row->id, 'width_mm' => $rear->widthMm, 'aspect' => $rear->aspect, 'diameter_in' => $rear->diameterIn, 'axle' => 'REAR']);
    }

    $fx->vehicle->forceFill(['eg_nummer_raw' => CARRY_CAR_K, 'eg_nummer_norm' => CARRY_CAR_K])->save();
    $other = $fx->vehicleOfMake('Mini');
    $other->forceFill(['eg_nummer_raw' => CARRY_OTHER_K, 'eg_nummer_norm' => CARRY_OTHER_K])->save();

    $rows = [carryOverRow($fx->document, 1, $front, $front, 5), carryOverRow($fx->document, 2, $front, $rear, 5)];

    // Another released Gutachten of the demo data, superseded since, with a list of one.
    $old = ApprovalDocument::query()->whereKeyNot($fx->document->id)->where('status', DocumentStatus::Published)->whereHas('fitments')->orderBy('id')->firstOrFail();
    carryOverRow($old, 1, $front, $front, 9);
    $old->forceFill(['status' => DocumentStatus::Superseded])->save();

    // Every car under a list with a field K that reads, as on the preview (all five there): a car without one would lose
    // its document's list, and the carry-over refuses that (the last test).
    $cars = Vehicle::query()->whereIn('id', Fitment::query()->whereIn('approval_document_id', [$fx->document->id, $old->id])->select('vehicle_id'))->get();

    foreach ($cars as $car) {
        if (EgNumber::parse($car->eg_nummer_norm) === null) {
            $car->forceFill(['eg_nummer_raw' => 'e1*2007/46*0316*11', 'eg_nummer_norm' => 'e1*2007/46*0316*11'])->save();
        }
    }

    return [$fx, $other, $rows, $old];
}

it('moves a document\'s list onto every one of its entries, marked, and changes not one verdict of the demo data @admin-219', function (): void {
    [$fx, $other, $rows, $old] = carryOverSetup();
    $census = app(CombinationCensus::class);
    $before = $census->take(EloquentFitmentRepository::beforeEntries());
    $listed = $census->take(EloquentFitmentRepository::beforeEntries(), listedOnly: true);

    // The precondition: the comparison reads lists — both types sold the list of two —, never two empty answers.
    foreach ([$fx->vehicle, $other] as $car) {
        expect($before[$car->id.':'.$fx->config->id]['combinations'])->toMatchArray(['listed' => true, 'sourcePage' => 5])
            ->and($before[$car->id.':'.$fx->config->id]['combinations']['pairs'])->toHaveCount(2);
    }

    // A document's entries are its cars' field K: its rows on the first, a copy on each further one.
    $fxEntries = CombinationEntries::of($fx->document->id);
    $oldEntries = CombinationEntries::of($old->id);

    expect(count($before))->toBeGreaterThan(count($listed))
        ->and(count($listed))->toBeGreaterThanOrEqual(3)
        ->and($fxEntries)->toContain(CARRY_CAR_K, CARRY_OTHER_K)
        ->and($oldEntries)->not->toBe([]);

    $moved = (new CombinationEntries)->carryOverWithoutChange($census);

    // Every car × rim pair of the demo data, the same answer after as before — not only those a list reaches.
    expect($census->take(new EloquentFitmentRepository))->toBe($before)
        ->and($moved)->toMatchArray([
            'documents' => 2,
            'copied' => 2 * (count($fxEntries) - 1) + (count($oldEntries) - 1),
            'unassigned' => 0,
            'pairs' => count($listed),
        ]);

    // Each entry with the whole list, every row marked; the rows themselves on the first entry, ids kept — what an order
    // froze still names its row.
    $list = DocumentTyreCombination::query()->where('approval_document_id', $fx->document->id)->orderBy('id')->get();

    expect($list)->toHaveCount(2 * count($fxEntries))
        ->and($list->groupBy('eg_number_norm')->map(static fn ($rows): array => $rows->pluck('number')->all())->all())
        ->toBe(array_fill_keys($fxEntries, [1, 2]))
        ->and($list->pluck('carried_over')->unique()->all())->toBe([true])
        ->and($list->take(2)->map(static fn (DocumentTyreCombination $c): array => [$c->id, $c->eg_number_norm])->all())
        ->toBe([[$rows[0]->id, $fxEntries[0]], [$rows[1]->id, $fxEntries[0]]])
        ->and($list->pluck('source_page')->unique()->all())->toBe([5])
        // The superseded Gutachten's list moves too, on the entries of its own cars.
        ->and(DocumentTyreCombination::query()->where('approval_document_id', $old->id)->whereNull('eg_number_norm')->count())->toBe(0)
        ->and(DocumentTyreCombination::query()->where('approval_document_id', $old->id)->where('carried_over', false)->count())->toBe(0);
});

it('moves nothing twice: a row with an entry is left as it is @admin-219', function (): void {
    carryOverSetup();
    $entries = new CombinationEntries;
    $census = app(CombinationCensus::class);

    $entries->carryOverWithoutChange($census);
    $after = DocumentTyreCombination::query()->orderBy('id')->get()->map(static fn (DocumentTyreCombination $c): array => $c->getAttributes())->all();

    expect($entries->carryOverWithoutChange($census))->toMatchArray(['documents' => 0, 'copied' => 0])
        ->and(DocumentTyreCombination::query()->orderBy('id')->get()->map(static fn (DocumentTyreCombination $c): array => $c->getAttributes())->all())->toBe($after);
});

it('moves nothing where a car without a field K would lose its document\'s list — and names the pair @admin-219', function (): void {
    [$fx, $other, $rows] = carryOverSetup();
    $other->forceFill(['eg_nummer_raw' => null, 'eg_nummer_norm' => null])->save();
    $state = static fn (): array => DocumentTyreCombination::query()->where('approval_document_id', $fx->document->id)->orderBy('id')->get()
        ->map(static fn (DocumentTyreCombination $c): array => [$c->id, $c->eg_number_norm, $c->carried_over])->all();

    // The precondition: the list is there, without an entry, and the car without K is sold it today.
    expect($state())->toBe([[$rows[0]->id, null, false], [$rows[1]->id, null, false]])
        ->and(app(CombinationCensus::class)->take(EloquentFitmentRepository::beforeEntries(), listedOnly: true)[$other->id.':'.$fx->config->id]['combinations']['listed'])->toBeTrue();

    expect(fn () => (new CombinationEntries)->carryOverWithoutChange(app(CombinationCensus::class)))
        ->toThrow(RuntimeException::class, $other->id.':'.$fx->config->id);

    expect($state())->toBe([[$rows[0]->id, null, false], [$rows[1]->id, null, false]])
        ->and(DocumentTyreCombination::query()->whereNotNull('eg_number_norm')->count())->toBe(0);
});
