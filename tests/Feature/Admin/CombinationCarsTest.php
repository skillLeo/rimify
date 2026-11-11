<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Models\ApprovalDocument;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\CombinationCars;
use App\Services\Admin\Approvals\CombinationCensus;
use App\Services\Admin\Approvals\Entry\DocumentEntryProof;
use App\Services\Admin\Approvals\Entry\DocumentEntryReader;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * His round of 08.11, §2, the migration (D-447): the rows of a paper's list, held per entry of its Verwendungsbereich until
 * now, are bound to the cars each entry reaches — the rows themselves to the first car, ids kept, a copy to each further car —
 * without changing a single verdict. Every car × rim pair of the demo data is read before and after, and the two must be
 * identical.
 */

beforeEach(function (): void {
    CatalogueSeeder::$shopFixture = true;
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
});

afterEach(function (): void {
    CatalogueSeeder::$shopFixture = false;
});

const CARS_K = 'e1*2001/116*0287*05';

/** A row as D-358 left it: under its entry, naming no car. */
function carsRow(ApprovalDocument $document, int $number, TyreSize $front, TyreSize $rear, string $k = CARS_K): DocumentTyreCombination
{
    return DocumentTyreCombination::query()->create([
        'approval_document_id' => $document->id, 'eg_number' => $k, 'eg_number_norm' => $k, 'number' => $number,
        'front_width_mm' => $front->widthMm, 'front_aspect' => $front->aspect, 'front_diameter_in' => $front->diameterIn,
        'rear_width_mm' => $rear->widthMm, 'rear_aspect' => $rear->aspect, 'rear_diameter_in' => $rear->diameterIn,
        'source_page' => 5,
    ]);
}

/**
 * The fixture's released Gutachten with two cars under one field K — the fixture's car and the same car under another make —
 * and a list of two: Nr. 1 the fixture's size on both axles, Nr. 2 a wider one at the rear, which the cars' rows carry.
 *
 * @return array{0: KomplettradFixture, 1: Vehicle, 2: list<DocumentTyreCombination>}
 */
function carsSetup(): array
{
    $fx = KomplettradFixture::permitted();
    $front = $fx->size;
    $rear = new TyreSize($front->widthMm + 30, $front->aspect - 5, $front->diameterIn);
    $other = $fx->vehicleOfMake('Mini');

    foreach (Fitment::query()->where('approval_document_id', $fx->document->id)->get() as $row) {
        FitmentTyreSize::query()->create(['fitment_id' => $row->id, 'width_mm' => $rear->widthMm, 'aspect' => $rear->aspect, 'diameter_in' => $rear->diameterIn, 'axle' => 'REAR']);
    }

    foreach (Vehicle::query()->whereIn('id', Fitment::query()->where('approval_document_id', $fx->document->id)->select('vehicle_id'))->get() as $car) {
        $car->forceFill(['eg_nummer_raw' => CARS_K, 'eg_nummer_norm' => CARS_K])->save();
    }

    return [$fx, $other, [carsRow($fx->document, 1, $front, $front), carsRow($fx->document, 2, $front, $rear)]];
}

it('binds a list to every car its entry reaches, ids kept on the first, and changes not one verdict of the demo data', function (): void {
    [$fx, $other, $rows] = carsSetup();
    $census = app(CombinationCensus::class);
    $before = $census->take(new EloquentFitmentRepository);
    $cars = Fitment::query()->where('approval_document_id', $fx->document->id)->distinct()->orderBy('vehicle_id')->pluck('vehicle_id')->map(static fn ($id): int => (int) $id)->all();

    // The precondition: the comparison reads lists — both cars are sold the list of two —, never two empty answers.
    foreach ([$fx->vehicle, $other] as $car) {
        expect($before[$car->id.':'.$fx->config->id]['combinations'])->toMatchArray(['listed' => true, 'sourcePage' => 5])
            ->and($before[$car->id.':'.$fx->config->id]['combinations']['pairs'])->toHaveCount(2);
    }

    expect(count($cars))->toBeGreaterThanOrEqual(2);

    $bound = (new CombinationCars)->bindWithoutChange($census);

    expect($census->take(new EloquentFitmentRepository))->toBe($before)
        ->and($bound)->toMatchArray(['documents' => 1, 'bound' => 2, 'copied' => 2 * (count($cars) - 1)]);

    $list = DocumentTyreCombination::query()->where('approval_document_id', $fx->document->id)->orderBy('id')->get();

    // Each car with the whole list; the rows themselves on the first car, ids kept — what an order froze still names its row.
    expect($list->groupBy('vehicle_id')->map(static fn ($rows): array => $rows->pluck('number')->all())->all())
        ->toBe(array_fill_keys($cars, [1, 2]))
        ->and($list->take(2)->map(static fn (DocumentTyreCombination $c): array => [$c->id, $c->vehicle_id])->all())
        ->toBe([[$rows[0]->id, $cars[0]], [$rows[1]->id, $cars[0]]])
        ->and($list->whereNull('vehicle_id'))->toHaveCount(0);
});

it('binds nothing twice, and nothing on a database without a list', function (): void {
    $census = app(CombinationCensus::class);

    expect((new CombinationCars)->bindWithoutChange($census))->toBe(['documents' => 0, 'bound' => 0, 'copied' => 0, 'pairs' => 0]);

    carsSetup();
    (new CombinationCars)->bindWithoutChange($census);

    expect((new CombinationCars)->bindWithoutChange($census))->toBe(['documents' => 0, 'bound' => 0, 'copied' => 0, 'pairs' => 0])
        ->and((new CombinationCars)->bind())->toBe(['documents' => 0, 'bound' => 0, 'copied' => 0]);
});

it('leaves an entry no car reaches without a car: a car added later with that field K still finds it', function (): void {
    [$fx] = carsSetup();
    $elsewhere = 'e1*2007/46*0750*02';
    carsRow($fx->document, 1, $fx->size, $fx->size, $elsewhere);

    (new CombinationCars)->bindWithoutChange(app(CombinationCensus::class));

    expect(DocumentTyreCombination::query()->where('approval_document_id', $fx->document->id)->where('eg_number_norm', $elsewhere)->pluck('vehicle_id')->all())->toBe([null]);
});

it('takes a paper bound by the car into the five steps and back without a difference (the round trip)', function (): void {
    [$fx] = carsSetup();
    (new CombinationCars)->bindWithoutChange(app(CombinationCensus::class));
    $document = $fx->document;

    (new DocumentEntryReader)->ensure($document);

    expect((new DocumentEntryProof(new DocumentEntryWriter))->differences($document))->toBe([]);
});
