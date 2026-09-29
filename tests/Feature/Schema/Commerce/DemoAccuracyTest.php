<?php

declare(strict_types=1);

use App\Enums\ApprovalKind;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\Brand;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\BrandLogoSeeder;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tests\Support\DemoWheelFixtures;

/*
 * The accuracy pass on the demo data (docs/phase0/ACCURACY.md §1 D1–D3, §3): the demo documents
 * name no real organisation, a demo fitment never pairs a wheel with a car it cannot bolt onto, a
 * demo tyre size is plausible for the car or absent, and a database seeded before all this is put
 * right in place — same ids, nothing deleted — and stays put on every later run.
 */

beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

/**
 * Every live (not retired) fitment of a demo document, with what the filter looks at.
 *
 * @return Collection<int, object>
 */
function liveDemoFitments(): Collection
{
    return DB::table('fitments as f')
        ->join('approval_documents as d', 'd.id', '=', 'f.approval_document_id')
        ->join('vehicles as v', 'v.id', '=', 'f.vehicle_id')
        ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
        ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
        ->where('d.issuer', ApprovalSeeder::ISSUER)
        ->where('f.status', '!=', FitmentStatus::Retired->value)
        ->get([
            'f.id', 'f.status', 'd.report_number', 'wm.slug',
            // The bore the document states for THIS car, beside the rim's own: two different
            // claims, and the filter below is about the one that governs (R-06).
            'f.centre_bore_mm as stated_bore_mm',
            'v.make', 'v.model', 'v.variant', 'v.type_designation',
            'wc.bolt_holes', 'wc.bolt_circle_mm', 'wc.centre_bore_mm', 'wc.diameter_in', 'wc.width_in',
        ]);
}

it('names no real organisation, no real report number and no KBA number on a demo document', function (): void {
    $this->seed(ApprovalSeeder::class);

    $documents = ApprovalDocument::query()->get();

    expect($documents)->toHaveCount(9);

    foreach ($documents as $document) {
        expect($document->issuer)->toBe('Prüfstelle (Demodaten)')
            ->and($document->report_number)->toMatch('/^DEMO-\d{4}$/')
            ->and($document->kba_number)->toBeNull()
            ->and($document->approval_mark)->toBeNull()
            // An ABE is defined by its KBA number; a document without one is never called one.
            ->and($document->kind)->toBe(ApprovalKind::Teilegutachten);
    }

    $text = json_encode([
        ApprovalDocument::query()->get(['issuer', 'report_number', 'pdf_key'])->toArray(),
        FitmentConflict::query()->pluck('detail')->all(),
    ], JSON_UNESCAPED_UNICODE);

    expect($text)->not->toMatch('/T[ÜU]V|DEKRA|GT[ÜU]|K[ÜU]S\b|Kraftfahrt|KBA|TG-2026|ABE-/i');
});

it('never pairs a wheel with a car of another bolt pattern, or with a hub its bore cannot take', function (): void {
    $this->seed(ApprovalSeeder::class);

    $live = liveDemoFitments();

    expect($live->count())->toBeGreaterThan(500);

    foreach ($live as $row) {
        $factory = ApprovalSeeder::VEHICLES[$row->make.'|'.$row->model.'|'.$row->type_designation] ?? null;

        // Where the document states its own bore for this car that figure governs, and the rim's
        // catalogue number is not the claim being tested: Bergsteig Gipfel is catalogued at 66,5 mm
        // in 5 × 112 and the ninth document states 66,6 mm for some makes' cars.
        $bore = $row->stated_bore_mm === null ? (float) $row->centre_bore_mm : (float) $row->stated_bore_mm;

        expect($factory)->not->toBeNull("{$row->make} {$row->variant} has no asserted bolt pattern, so no fitment")
            ->and($factory[2])->not->toBeNull()
            ->and((int) $row->bolt_holes)->toBe($factory[0], "fitment {$row->id}: {$row->make} {$row->variant}")
            ->and((float) $row->bolt_circle_mm)->toBe($factory[1], "fitment {$row->id}: {$row->make} {$row->variant}")
            ->and($bore)->toBeGreaterThanOrEqual($factory[2], "fitment {$row->id}: bore smaller than the hub");
    }

    // The cars no demo wheel fits keep no demo fitment at all: 5 × 130, 5 × 100, 4 × 100,
    // 4 × 108, 5 × 105, and the two whose pattern is not certain.
    foreach (['911 Carrera S', 'Cayenne', '718 Cayman', 'Polo GTI', 'Fabia 1.0 TSI', 'Fox 1.2', 'Corsa 1.2', 'Fiesta ST', 'Astra 1.4 Turbo', 'Mokka-e', 'Puma ST', 'Z8 4.9'] as $variant) {
        expect($live->where('variant', $variant))->toBeEmpty("{$variant} must have no demo fitment");
    }

    // The BMW E36 is 5 × 120: only the 5 × 120 wheels.
    expect($live->where('variant', '3er Coupé')->pluck('bolt_circle_mm')->map(fn ($c): float => (float) $c)->unique()->values()->all())->toBe([120.0]);
});

it('limits the ninth document to the makes it names for each bolt pattern', function (): void {
    $this->seed(ApprovalSeeder::class);

    $ninth = liveDemoFitments()->where('slug', 'bergsteig-gipfel');

    expect($ninth)->not->toBeEmpty();

    foreach ($ninth as $row) {
        $allowed = ApprovalSeeder::RANGE9_MAKES[number_format((float) $row->bolt_circle_mm, 1, '.', '')];

        expect($allowed)->toContain($row->make);
    }

    // Porsche is in none of its lists, although the Macan has 5 × 112; the 5 × 120 execution is
    // BMW and MINI only, so the Opel Insignia gets none of it.
    expect($ninth->where('make', 'Porsche'))->toBeEmpty()
        ->and($ninth->where('make', 'Opel'))->toBeEmpty();
});

it('states a bore on a fitment row only where the document states one for that car', function (): void {
    $this->seed(ApprovalSeeder::class);

    $live = liveDemoFitments();

    // Only the ninth document states a bore, and only in its 5 × 112 execution for the makes it
    // lists. Every other demo document is silent, and silence is NULL — never the rim's own figure
    // copied onto the row.
    foreach ($live as $row) {
        if ($row->stated_bore_mm === null) {
            continue;
        }

        expect($row->slug)->toBe('bergsteig-gipfel')
            ->and((float) $row->bolt_circle_mm)->toBe(112.0)
            ->and((float) $row->stated_bore_mm)->toBe(ApprovalSeeder::RANGE9_STATED_BORE_MM)
            ->and(ApprovalSeeder::RANGE9_STATED_BORE_MAKES)->toContain($row->make);
    }

    $mercedes = $live
        ->where('slug', 'bergsteig-gipfel')
        ->where('make', 'Mercedes-Benz')
        ->filter(static fn (object $row): bool => (float) $row->bolt_circle_mm === 112.0);

    // One casting, 66,5 mm in the catalogue and 66,6 mm in the document for a car whose hub is
    // 66,6 — and the pairing stands because the document wins (R-06).
    expect($mercedes)->not->toBeEmpty();

    foreach ($mercedes as $row) {
        expect((float) $row->centre_bore_mm)->toBe(66.5)
            ->and((float) $row->stated_bore_mm)->toBe(66.6);
    }

    // Audi is ambiguous in the document, so the row states nothing at all.
    foreach ($live->where('make', 'Audi') as $row) {
        expect($row->stated_bore_mm)->toBeNull("fitment {$row->id}: Audi is ambiguous in the document");
    }
});

it('names a tyre size only where it is plausible for the car, and otherwise none', function (): void {
    $this->seed(ApprovalSeeder::class);

    $live = liveDemoFitments()->keyBy('id');

    $sizes = DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $live->keys())->get();

    expect($sizes)->not->toBeEmpty();

    foreach ($sizes as $size) {
        $row = $live[$size->fitment_id];
        $plausible = ApprovalSeeder::tyreSizes($row->make, $row->variant, (float) $row->diameter_in, (float) $row->width_in);

        // Never a tyre far from the car's own: within −2,5 % … +1,5 % of the factory diameter.
        $factory = ApprovalSeeder::TYRES[$row->make.'|'.$row->variant];
        $delta = ApprovalSeeder::tyreDiameterMm((int) $size->width_mm, (int) $size->aspect, (float) $size->diameter_in)
            / ApprovalSeeder::tyreDiameterMm($factory[0][0], $factory[0][1], (float) $factory[0][2]) - 1;

        expect($delta)->toBeGreaterThanOrEqual(-0.025)->toBeLessThanOrEqual(0.015)
            ->and((float) $size->diameter_in)->toBeGreaterThanOrEqual((float) $factory[1]);

        expect(in_array([(int) $size->width_mm, (int) $size->aspect], $plausible, true))
            ->toBeTrue("fitment {$row->id}: {$size->width_mm}/{$size->aspect} R{$size->diameter_in} on {$row->make} {$row->variant}");
    }

    // No 16-inch compact-car size on a car whose factory rim is larger (the Cayenne case).
    expect(ApprovalSeeder::tyreSizes('BMW', '520d Limousine', 16.0, 7.0))->toBe([])
        ->and(ApprovalSeeder::tyreSizes('Audi', 'RS 4 Avant Quattro', 18.0, 8.0))->toBe([])
        // An unknown factory size is no size at all, never a guess.
        ->and(ApprovalSeeder::tyreSizes('Volkswagen', 'Tiguan R 4MOTION', 20.0, 8.5))->toBe([])
        // The factory size first, then the nearest that suits the rim.
        ->and(ApprovalSeeder::tyreSizes('BMW', '330i Limousine', 18.0, 8.0))->toBe([[225, 45], [245, 40]])
        // A 9,5J rim is too wide for every tyre of the car's diameter in that pool.
        ->and(ApprovalSeeder::tyreSizes('BMW', '330i Limousine', 18.0, 9.5))->toBe([]);
});

it('keeps the deliberate conflict, and a car Bergsteig Gipfel may go on', function (): void {
    $this->seed(ApprovalSeeder::class);

    $conflict = FitmentConflict::query()->where('status', 'open')->where('blocking', true)->with('candidateFitment.approvalDocument', 'existingFitment.approvalDocument')->first();

    expect($conflict)->not->toBeNull()
        ->and($conflict->candidateFitment->approvalDocument->report_number)->toBe('DEMO-0005')
        ->and($conflict->candidateFitment->status)->toBe(FitmentStatus::Draft)
        ->and($conflict->existingFitment->approvalDocument->report_number)->toBe('DEMO-0001');

    $gipfelWithTyres = liveDemoFitments()
        ->where('slug', 'bergsteig-gipfel')
        ->where('status', FitmentStatus::Published->value)
        ->filter(fn (object $row): bool => DB::table('fitment_tyre_sizes')->where('fitment_id', $row->id)->exists());

    expect($gipfelWithTyres)->not->toBeEmpty();
});

it('covers the test anchor car, the BMW 330i G20, with plenty of sellable wheels', function (): void {
    $this->seed(ApprovalSeeder::class);

    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();

    $withTyres = DB::table('fitments as f')
        ->join('approval_documents as d', 'd.id', '=', 'f.approval_document_id')
        ->where('f.vehicle_id', $vehicle->id)
        ->where('f.status', FitmentStatus::Published->value)
        ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('fitment_tyre_sizes as t')->whereColumn('t.fitment_id', 'f.id'))
        ->count();

    expect($withTyres)->toBeGreaterThanOrEqual(10);
});

it('renames a catalogue seeded before the accuracy pass in place, retires rather than deletes, and then holds still', function (): void {
    $this->seed(ApprovalSeeder::class);

    $models = WheelModel::query()->pluck('id', 'slug')->all();
    $skus = WheelConfig::query()->pluck('sku', 'id')->all();
    $documents = ApprovalDocument::query()->pluck('id', 'report_number')->all();
    // Bergsteig Gipfel, once the MOTEC MCR4 Ultimate.
    $motec = WheelModel::query()->where('slug', 'bergsteig-gipfel')->firstOrFail();
    $motecFinish = WheelFinish::query()->where('wheel_model_id', $motec->id)->firstOrFail();
    $g20 = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $carrera = Vehicle::query()->where('variant', '911 Carrera S')->firstOrFail();

    // ── Put the database back the way the preview was seeded before the accuracy pass ─────────
    $former = [
        'borbet' => 'BORBET', 'oz-racing' => 'OZ Racing', 'alutec' => 'ALUTEC', 'bbs' => 'BBS', 'yido' => 'YIDO',
        'rotiform' => 'Rotiform', 'brock' => 'Brock', 'mam' => 'MAM', 'dezent' => 'Dezent', 'aez' => 'AEZ',
    ];
    $oldBrands = [];

    foreach ($former as $prefix => $name) {
        $oldBrands[$prefix] = Brand::query()->create(['name' => $name, 'slug' => $prefix, 'sort_order' => 100]);
    }

    foreach (CatalogueSeeder::slugs() as $slug => $formerSlugs) {
        // The oldest name: the real maker's, before the accuracy pass. The Gipfel had none.
        $formerSlug = $formerSlugs === [] ? null : $formerSlugs[count($formerSlugs) - 1];
        $prefix = $formerSlug === null ? null : collect(array_keys($former))->first(fn (string $p): bool => str_starts_with($formerSlug, $p.'-'));

        if ($prefix === null) {
            continue;
        }

        WheelModel::query()->where('slug', $slug)->update([
            'slug' => $formerSlug,
            'name' => 'Früherer Name',
            'brand_id' => $oldBrands[$prefix]->id,
            'type_designation' => 'XX-OLD',
            'rating' => 4.8,
            'rating_count' => 555,
        ]);
    }

    WheelConfig::query()->update(['kba_number' => '46001']);
    $motecBrand = Brand::query()->create(['name' => 'MOTEC', 'slug' => 'motec', 'sort_order' => 5]);
    $motec->forceFill(['slug' => 'motec-mcr4-ultimate', 'name' => 'MCR4 Ultimate', 'brand_id' => $motecBrand->id, 'type_designation' => 'MO-MCR4', 'rating' => 4.7, 'rating_count' => 64])->save();
    $motecFinish->forceFill(['name_de' => 'Light Grey'])->save();

    foreach ([
        'DEMO-0001' => ['TG-2026-0001', 'TÜV Rheinland', 'TEILEGUTACHTEN', null],
        'DEMO-0003' => ['ABE-46120', 'Kraftfahrt-Bundesamt', 'ABE', '46120'],
        'DEMO-0009' => ['TG-2026-0009', 'TÜV SÜD', 'TEILEGUTACHTEN', null],
    ] as $number => [$old, $issuer, $kind, $kba]) {
        DB::table('approval_documents')->where('report_number', $number)->update(['report_number' => $old, 'issuer' => $issuer, 'kind' => $kind, 'kba_number' => $kba]);
    }

    // A size the seed no longer lists, sold on a car, and a demo fitment on a car it cannot fit.
    $ghost = WheelConfig::query()->create([
        'wheel_model_id' => $motec->id, 'wheel_finish_id' => $motecFinish->id, 'diameter_in' => 19.0, 'width_in' => 9.5,
        'et_mm' => 40, 'bolt_holes' => 5, 'bolt_circle_mm' => 112.0, 'centre_bore_mm' => 66.6, 'sku' => 'RMF-000097',
        'kba_number' => '46097', 'price_cents' => 91_600, 'currency' => 'EUR', 'stock_qty' => 3, 'weight_g' => 15_480,
    ]);
    $motecDocument = $documents['DEMO-0009'];
    $ghostFitment = Fitment::query()->create([
        'approval_document_id' => $motecDocument, 'vehicle_id' => $g20->id, 'wheel_config_id' => $ghost->id, 'axle' => 'ALL',
        'requires_entry' => false, 'status' => FitmentStatus::Published->value,
    ]);
    $wrongFitment = Fitment::query()->create([
        'approval_document_id' => $documents['DEMO-0001'], 'vehicle_id' => $carrera->id,
        'wheel_config_id' => WheelConfig::query()->orderBy('id')->value('id'), 'axle' => 'ALL',
        'requires_entry' => false, 'status' => FitmentStatus::Published->value,
    ]);

    // And a compact-car tyre size on a surviving fitment of the anchor car.
    $survivor = Fitment::query()->where('vehicle_id', $g20->id)->where('approval_document_id', $documents['DEMO-0001'])->firstOrFail();
    DB::table('fitment_tyre_sizes')->insert([
        'fitment_id' => $survivor->id, 'width_mm' => 205, 'aspect' => 55, 'diameter_in' => 16.0, 'axle' => 'ALL',
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $fitmentsBefore = Fitment::query()->count();

    // ── The release seed ────────────────────────────────────────────────────────────────────────
    $this->seed(CatalogueSeeder::class);
    $this->seed(ApprovalSeeder::class);

    // Every model, configuration and document keeps its id; only its names changed.
    expect(WheelModel::query()->pluck('id', 'slug')->all())->toBe($models);

    foreach ($skus as $id => $sku) {
        expect(WheelConfig::query()->whereKey($id)->value('sku'))->toBe($sku);
    }

    expect(ApprovalDocument::query()->pluck('id', 'report_number')->all())->toBe($documents);

    foreach (WheelModel::query()->with('brand')->get() as $model) {
        expect($model->brand->name)->toBeIn(CatalogueSeeder::BRANDS)
            ->and($model->type_designation)->toBeNull()
            ->and($model->rating)->toBeNull()
            ->and($model->rating_count)->toBe(0);
    }

    expect(WheelConfig::query()->whereNotNull('kba_number')->exists())->toBeFalse()
        ->and($motecFinish->fresh()->name_de)->toBe('Hellgrau')
        ->and(ApprovalDocument::query()->where('issuer', '!=', ApprovalSeeder::ISSUER)->exists())->toBeFalse()
        ->and(ApprovalDocument::query()->whereNotNull('kba_number')->exists())->toBeFalse();

    // The former brands are gone from every page, and still in the table. The ones BrandLogoSeeder
    // now maintains as researched manufacturers stay as live rows without a single product, which
    // no storefront gate lists (a brand needs a published model with stock); the rest are retired.
    $created = [...array_values($former), 'MOTEC'];
    $kept = array_values(array_filter($created, BrandLogoSeeder::maintains(...)));
    $retired = array_values(array_diff($created, $kept));

    expect($retired)->not->toBeEmpty()
        ->and(Brand::query()->whereIn('name', $retired)->exists())->toBeFalse()
        ->and(Brand::onlyTrashed()->whereIn('name', $retired)->count())->toBe(count($retired))
        ->and(Brand::withTrashed()->whereIn('name', $created)->count())->toBe(count($created))
        ->and(Brand::query()->whereIn('name', $kept)->whereHas('wheelModels')->exists())->toBeFalse()
        ->and(Brand::query()->whereIn('name', $kept)->whereHas('tyreVariants')->exists())->toBeFalse();

    // Retired, never deleted: the size no document covers and the fitment on the wrong car.
    expect(WheelConfig::withTrashed()->find($ghost->id)?->trashed())->toBeTrue()
        ->and($ghostFitment->fresh()?->status)->toBe(FitmentStatus::Retired)
        ->and($wrongFitment->fresh()?->status)->toBe(FitmentStatus::Retired)
        ->and(Fitment::query()->count())->toBe($fitmentsBefore)
        ->and(DB::table('fitment_tyre_sizes')->where('fitment_id', $survivor->id)->where('diameter_in', 16.0)->exists())->toBeFalse();

    // ── And again: nothing moves ────────────────────────────────────────────────────────────────
    $state = fn (): array => [
        WheelModel::withTrashed()->count(),
        WheelFinish::withTrashed()->count(),
        WheelConfig::withTrashed()->orderBy('id')->pluck('sku', 'id')->all(),
        Brand::withTrashed()->count(),
        ApprovalDocument::query()->count(),
        Fitment::query()->orderBy('id')->pluck('status', 'id')->map(fn ($s) => $s instanceof FitmentStatus ? $s->value : $s)->all(),
        DB::table('fitment_tyre_sizes')->count(),
    ];

    $settled = $state();

    $this->seed(CatalogueSeeder::class);
    $this->seed(ApprovalSeeder::class);

    expect($state())->toBe($settled);
});
