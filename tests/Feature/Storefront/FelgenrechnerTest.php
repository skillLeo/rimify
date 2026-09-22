<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Services\Storefront\CalculatorPrefill;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * /felgenrechner (home-overhaul §3.3, ACCURACY.md §6): one document per device, the smallest size
 * a visible Gutachten names for the car as prefill, a shared comparison parsed on the server — and
 * never an error page for a link that does not parse.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

const RECHNER_EXAMPLE = '7.5x17-45-225-45_8.5x19-35-225-35';

it('renders the desktop document with neither a prefill nor a shared comparison', function (): void {
    $this->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Felgenrechner/Desktop')
            ->where('prefill', null)
            ->where('state', null)
            ->where('routeName', 'felgenrechner.index')
        );
});

it('renders the phone document for a phone', function (): void {
    $mobile = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

    $this->withHeaders(['User-Agent' => $mobile])
        ->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Felgenrechner/Mobile')->where('isMobile', true));
});

it('prefills Aktuell from the vehicle cookie, with the same size the homepage teaser gets', function (): void {
    // A car with a visible fitment that names a tyre size — whichever one the demo seed covers.
    $vehicle = Vehicle::query()->findOrFail(felgenrechnerPrefillVehicle());
    $cookies = [VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()];

    $prefill = $this->withCookies($cookies)
        ->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            // The props travel as JSON: a whole-number float (`18.0`) arrives as an integer.
            ->where('prefill.widthIn', fn ($w) => is_numeric($w) && $w >= 5.5 && $w <= 12)
            ->where('prefill.diameterIn', fn ($d) => is_numeric($d) && $d >= 13 && $d <= 24)
            ->where('prefill.etMm', fn ($et) => is_int($et))
            ->where('prefill.tyreWidth', fn ($tw) => is_int($tw) && $tw >= 135)
            ->where('prefill.aspect', fn ($a) => is_int($a) && $a >= 25)
            ->where('state', null)
        )
        ->viewData('page')['props']['prefill'];

    $home = $this->withCookies($cookies)->get('/')->viewData('page')['props']['calculator']['prefill'];

    expect($home)->toBe($prefill);
});

it('parses a shared comparison so the first paint already shows it', function (): void {
    $this->get('/felgenrechner?rechner='.RECHNER_EXAMPLE)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('state.current.widthIn', 7.5)
            // Whole-number floats arrive as integers through JSON; 7.5 stays a float.
            ->where('state.current.diameterIn', 17)
            ->where('state.current.etMm', 45)
            ->where('state.current.tyreWidthMm', 225)
            ->where('state.current.aspect', 45)
            ->where('state.next.widthIn', 8.5)
            ->where('state.next.diameterIn', 19)
            ->where('state.next.etMm', 35)
            ->where('state.next.tyreWidthMm', 225)
            ->where('state.next.aspect', 35)
        );

    // A whole-number width and a negative ET.
    $this->get('/felgenrechner?rechner=8x17--10-225-45_8x17--20-225-45')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('state.current.widthIn', 8)
            ->where('state.current.etMm', -10)
            ->where('state.next.etMm', -20)
        );
});

it('shows the defaults, never an error page, for a link the form could not have produced', function (string $query): void {
    $this->get('/felgenrechner?'.$query)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Felgenrechner/Desktop')->where('state', null));
})->with([
    'garbage' => ['rechner=unsinn'],
    'old format' => ['rechner=7.5-17-45-225-45_8.5-19-35-225-35'],
    'one side' => ['rechner=7.5x17-45-225-45'],
    'width not offered' => ['rechner=7.3x17-45-225-45_8.5x19-35-225-35'],
    'ET above 70' => ['rechner=7.5x17-71-225-45_8.5x19-35-225-35'],
    'ET below -30' => ['rechner=7.5x17--31-225-45_8.5x19-35-225-35'],
    'tyre width not in tens' => ['rechner=7.5x17-45-226-45_8.5x19-35-225-35'],
    'aspect not in fives' => ['rechner=7.5x17-45-225-45_8.5x19-35-225-36'],
    'diameter 25' => ['rechner=7.5x25-45-225-45_8.5x19-35-225-35'],
    'an array' => ['rechner[]=7.5x17-45-225-45_8.5x19-35-225-35'],
    'empty' => ['rechner='],
]);

it('keeps the header mode of a plain page', function (): void {
    $this->get('/felgenrechner')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('headerMode', 'PLAIN')->where('vehicle', null));
});

/*
 * The prefill (finding C3 and the calculator map §1.6): the smallest size that a Gutachten a
 * customer could be shown names for the car — never a draft, retired, withdrawn, expired or
 * not-yet-valid row, never a withdrawn wheel. The vehicle is the seeded car with the most visible
 * fitments that name a tyre size (a fitment without one cannot prefill the calculator), so the
 * test does not depend on which demo fitments the catalogue seeds.
 */
function felgenrechnerPrefillVehicle(): int
{
    $id = Fitment::query()
        ->visibleToCustomers()
        ->whereHas('tyreSizes')
        ->select('vehicle_id')
        ->groupBy('vehicle_id')
        ->orderByRaw('COUNT(*) DESC')
        ->orderBy('vehicle_id')
        ->value('vehicle_id');

    expect($id)->not->toBeNull();

    return (int) $id;
}

it('prefills the smallest size a visible Gutachten names for the car, read against the model scope', function (): void {
    $vehicleId = felgenrechnerPrefillVehicle();
    $prefill = app(CalculatorPrefill::class)->forVehicle($vehicleId);

    expect($prefill)->not->toBeNull();

    // Every size a customer could be shown, read through Fitment::visibleToCustomers (another code path).
    $sizes = Fitment::query()
        ->visibleToCustomers()
        ->where('vehicle_id', $vehicleId)
        ->whereHas('wheelConfig.wheelModel', fn ($q) => $q->where('status', CatalogueStatus::Published->value))
        ->with(['wheelConfig', 'tyreSizes'])
        ->get()
        ->flatMap(fn (Fitment $f) => $f->tyreSizes->map(fn (FitmentTyreSize $ts): array => [
            'widthIn' => (float) $f->wheelConfig->width_in,
            'diameterIn' => (float) $f->wheelConfig->diameter_in,
            'etMm' => (int) $f->wheelConfig->et_mm,
            'tyreWidth' => (int) $ts->width_mm,
            'aspect' => (int) $ts->aspect,
        ]));

    expect($sizes->contains(fn (array $size): bool => $size == $prefill))->toBeTrue()
        ->and($prefill['diameterIn'])->toBe((float) $sizes->min('diameterIn'))
        ->and($prefill['widthIn'])->toBe((float) $sizes->where('diameterIn', $prefill['diameterIn'])->min('widthIn'));
});

it('prefills nothing when no row of the car is one a customer could be shown', function (string $hide): void {
    $vehicleId = felgenrechnerPrefillVehicle();
    $fitments = DB::table('fitments')->where('vehicle_id', $vehicleId);
    $documents = DB::table('approval_documents')->whereIn('id', (clone $fitments)->select('approval_document_id'));
    $configs = DB::table('wheel_configs')->whereIn('id', (clone $fitments)->select('wheel_config_id'));

    match ($hide) {
        'draft fitments' => $fitments->update(['status' => FitmentStatus::Draft->value]),
        'retired fitments' => $fitments->update(['status' => FitmentStatus::Retired->value]),
        'withdrawn documents' => $documents->update(['status' => DocumentStatus::Withdrawn->value]),
        'expired documents' => $documents->update(['valid_to' => now()->subDay()->toDateString()]),
        'documents not yet valid' => $documents->update(['valid_from' => now()->addDay()->toDateString(), 'valid_to' => null]),
        'archived wheel models' => DB::table('wheel_models')
            ->whereIn('id', (clone $configs)->select('wheel_model_id'))
            ->update(['status' => CatalogueStatus::Archived->value]),
        'deleted wheel models' => DB::table('wheel_models')
            ->whereIn('id', (clone $configs)->select('wheel_model_id'))
            ->update(['deleted_at' => now()]),
        'deleted wheel configs' => $configs->update(['deleted_at' => now()]),
        'no tyre sizes named' => DB::table('fitment_tyre_sizes')->whereIn('fitment_id', (clone $fitments)->select('id'))->delete(),
        default => throw new LogicException("No such case: {$hide}"),
    };

    expect(app(CalculatorPrefill::class)->forVehicle($vehicleId))->toBeNull();
})->with([
    'draft fitments',
    'retired fitments',
    'withdrawn documents',
    'expired documents',
    'documents not yet valid',
    'archived wheel models',
    'deleted wheel models',
    'deleted wheel configs',
    'no tyre sizes named',
]);
