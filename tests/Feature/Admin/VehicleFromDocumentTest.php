<?php

declare(strict_types=1);

use App\Http\Requests\Admin\VehicleFromDocumentRequest;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Vehicle;
use App\Services\Admin\AuditDescriber;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Block C, item 7: „Fahrzeug aus diesem Gutachten anlegen“ — the car exactly as the document names it, with
 * the document and the page, and no HSN or TSN, because no Gutachten prints them and none is made up.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function vfdAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function vfdDraft(): ApprovalDocument
{
    return ApprovalDocument::query()->create([
        'kind' => 'ABE', 'kba_number' => '55255', 'issuer' => 'Kraftfahrt-Bundesamt', 'revision' => 1,
        'page_count' => 13, 'status' => 'draft',
    ]);
}

/** @return array<string, mixed> */
function vfdCar(array $overrides = []): array
{
    return [
        'make' => 'BMW', 'model' => '4er Coupé', 'variant' => '', 'type_designation' => '3C',
        'eg_number' => 'e1*2007/46*0563*..', 'body_form' => 'Coupe', 'drive_axle' => '', 'source_page' => 4,
        ...$overrides,
    ];
}

it('stores the car as the document names it — source, document, page — with no key numbers and „zur Prüfung“', function (): void {
    $document = vfdDraft();

    $response = $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar())
        ->assertCreated();

    $vehicle = Vehicle::query()->findOrFail($response->json('id'));

    expect($vehicle->source)->toBe('gutachten')
        ->and($vehicle->source_document_id)->toBe($document->id)
        ->and($vehicle->source_page)->toBe(4)
        ->and($vehicle->hsn)->toBeNull()
        ->and($vehicle->tsn)->toBeNull()
        ->and($vehicle->getAttribute('source_vehicle_id'))->toBeNull()
        ->and($vehicle->getAttribute('eg_nummer_norm'))->toBe('e1*2007/46*0563*..')
        // Left empty, the variant is the Fahrzeugtyp.
        ->and($vehicle->variant)->toBe('3C')
        ->and($vehicle->needs_review)->toBeTrue()
        ->and($vehicle->axle_load_front_kg)->toBeNull()
        ->and($vehicle->max_speed_kmh)->toBeNull()
        ->and($response->json('label'))->toContain('BMW 4er Coupé 3C')
        ->and($response->json('label'))->toContain(GermanFormat::KEY_NUMBERS_MISSING)
        ->and($response->json('needsReview'))->toBeTrue()
        ->and(AuditLog::query()->where('description', 'vehicle.created_from_document')->exists())->toBeTrue();

    // The Gutachten team finds it again by the number the documents use.
    $this->actingAs(vfdAdmin(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q='.urlencode('e1*2007/46*0563'))
        ->assertOk()
        ->assertJsonPath('items.0.id', $vehicle->id);
});

it('refuses the same car twice and names the one that is there', function (): void {
    $document = vfdDraft();
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar())->assertCreated();

    // Printed a little differently, the same EG number and Fahrzeugtyp are the same car.
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar(['eg_number' => 'E1*2007/46*0563*..*']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.eg_number.0', 'Dieses Fahrzeug gibt es schon: BMW 4er Coupé 3C. Such es in der Liste oben und wähl es dort.');

    // Without the extension it is the same statement; one extension inside „every extension“ is that car
    // again (EgNumber::overlaps()) — never a second car the later merge could not tell apart.
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar(['eg_number' => 'e1*2007/46*0563']))
        ->assertUnprocessable();
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar(['eg_number' => 'e1*2007/46*0563*11']))
        ->assertUnprocessable();

    expect(Vehicle::query()->where('source', 'gutachten')->count())->toBe(1);
});

it('takes the extensions as the document prints them, and keeps two ranges of one approval apart', function (): void {
    // ABE 55255, page 2: BMW 1er 187 before the facelift (*0287*00-09) and after it (*0287*10-..).
    $document = vfdDraft();
    $early = vfdCar(['model' => '1er-Reihe', 'type_designation' => '187', 'eg_number' => 'e1*2001/116*0287*00-09', 'body_form' => '', 'source_page' => 2]);
    $late = [...$early, 'variant' => '187 ab Facelift 2007', 'eg_number' => 'e1*2001/116*0287*10-..'];

    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", $early)->assertCreated();
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", $late)->assertCreated();

    // A single extension inside the first range is that car again.
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$early, 'eg_number' => 'e1*2001/116*0287*05'])
        ->assertUnprocessable();

    expect(Vehicle::query()->where('type_designation', '187')->pluck('eg_nummer_norm')->all())
        ->toEqualCanonicalizing(['e1*2001/116*0287*00-09', 'e1*2001/116*0287*10-..']);
});

it('keeps apart the cars a document names apart under one approval, and knows one car spelled two ways', function (): void {
    // ABE 55255, page 5: BMW X3 and BMW X4, both type X3 under e1*2007/46*0512; page 4: BMW 5er-Reihe 5L once
    // „ohne“ and once „mit Allradlenkung“.
    $document = vfdDraft();
    $x3 = vfdCar(['model' => 'X3', 'type_designation' => 'X3', 'eg_number' => 'e1*2007/46*0512*..', 'body_form' => '', 'source_page' => 5]);

    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", $x3)->assertCreated();
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$x3, 'model' => 'X4', 'eg_number' => 'e1*2007/46*0512*11-..'])->assertCreated();

    $five = vfdCar(['model' => '5er-Reihe', 'type_designation' => '5L', 'eg_number' => 'e1*2007/46*0363*..', 'body_form' => '', 'source_page' => 4]);
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$five, 'variant' => '5L ohne Allradlenkung'])->assertCreated();
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$five, 'variant' => '5L mit Allradlenkung'])->assertCreated();

    // The 18″ Nachtrag spells the same car „1ER REIHE“.
    $one = vfdCar(['model' => '1er-Reihe', 'type_designation' => '187', 'eg_number' => 'e1*2001/116*0287*00-09', 'body_form' => '', 'source_page' => 2]);
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", $one)->assertCreated();
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$one, 'model' => '1ER REIHE'])->assertUnprocessable();

    expect(Vehicle::query()->where('source', 'gutachten')->count())->toBe(5);
});

it('refuses, in words, what the document cannot have said', function (array $overrides, string $field, string $message): void {
    $this->actingAs(vfdAdmin(), 'admin')->postJson('/admin/gutachten/'.vfdDraft()->id.'/fahrzeuge', vfdCar($overrides))
        ->assertUnprocessable()
        ->assertJsonPath("errors.{$field}.0", $message);

    expect(Vehicle::query()->count())->toBe(0);
})->with([
    'no maker' => [['make' => ''], 'make', 'Trag den Hersteller ein, so wie das Gutachten ihn nennt.'],
    'no type' => [['type_designation' => ''], 'type_designation', 'Trag den Fahrzeugtyp ein, etwa „3C“.'],
    'no number' => [['eg_number' => ''], 'eg_number', 'Trag die EG-Typgenehmigungsnummer ein, mit der Erweiterung.'],
    // D-521: any form is taken, but one not in the EU form is asked about first — nothing will ever join on it.
    'an HSN, not asked about' => [['eg_number' => '0005'], 'ohne_eu_format', VehicleFromDocumentRequest::NOT_EU],
    'a national number, not asked about' => [['eg_number' => 'G731*'], 'ohne_eu_format', VehicleFromDocumentRequest::NOT_EU],
    'a page past the end' => [['source_page' => 14], 'source_page', 'Das Gutachten hat nur 13 Seiten.'],
    'no page' => [['source_page' => null], 'source_page', 'Auf welcher Seite des Gutachtens steht das Fahrzeug?'],
    'a body style no document uses' => [['body_form' => 'Panzer'], 'body_form', 'Wähl eine Karosserie aus der Liste oder „Nennt das Gutachten nicht“.'],
]);

it('lets only someone who may edit a draft create a car from it (R-11)', function (): void {
    $document = vfdDraft();

    $this->actingAs(vfdAdmin('support-agent'), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar())->assertForbidden();

    $document->forceFill(['status' => 'published', 'pdf_key' => 'gutachten/abe-55255.pdf', 'pdf_sha256' => str_repeat('a', 64)])->save();

    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", vfdCar())->assertForbidden();

    expect(Vehicle::query()->count())->toBe(0);
});

it('never lets a car hold one key number without the other, nor an imported car hold none', function (): void {
    $base = [
        'make' => 'BMW', 'model' => '3er', 'variant' => '320i', 'raw' => '{}', 'needs_review' => 0,
        'created_at' => now(), 'updated_at' => now(),
    ];

    expect(fn () => DB::table('vehicles')->insert([...$base, 'source' => 'manuell_geprueft', 'hsn' => '0005', 'tsn' => null]))
        ->toThrow(QueryException::class);

    expect(fn () => DB::table('vehicles')->insert([...$base, 'source' => 'import_kba', 'source_vehicle_id' => 9001, 'hsn' => null, 'tsn' => null]))
        ->toThrow(QueryException::class);

    expect(fn () => DB::table('vehicles')->insert([...$base, 'source' => 'import_kba', 'source_vehicle_id' => null, 'hsn' => '0005', 'tsn' => 'BGU']))
        ->toThrow(QueryException::class);
});

// D-521: field K in any form. In the EU form nothing is asked (above); in another form the person says so, and the car keeps the
// number as printed — joined to a stored car only by a person ticking it in the search, never by the merge.
it('stores a car with a number in another form once the person says so, and records that it joins nothing by itself', function (): void {
    $document = vfdDraft();
    $car = vfdCar(['make' => 'Alfa Romeo', 'model' => '145/146', 'type_designation' => '930', 'eg_number' => '  G731*  ', 'body_form' => '']);

    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", $car)
        ->assertUnprocessable()
        ->assertJsonPath('errors.ohne_eu_format.0', VehicleFromDocumentRequest::NOT_EU)
        ->assertJsonMissingPath('errors.eg_number');
    expect(Vehicle::query()->count())->toBe(0);

    $response = $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$car, 'ohne_eu_format' => true])
        ->assertCreated();

    $vehicle = Vehicle::query()->findOrFail($response->json('id'));
    $log = AuditLog::query()->where('description', 'vehicle.created_from_document')->sole();

    expect($vehicle->getAttribute('eg_nummer_raw'))->toBe('G731*')
        // The copy for matching only, as every field K is normalised: no case, no spaces, no closing asterisk.
        ->and($vehicle->getAttribute('eg_nummer_norm'))->toBe('g731')
        ->and(data_get($vehicle->raw, 'gutachten.eu_form'))->toBeFalse()
        ->and($log->properties?->get('eu_form'))->toBeFalse()
        ->and(app(AuditDescriber::class)->describe($log)['sentence'])->toContain('mit der Nummer „G731*“ (nicht im EU-Format, wird nie von selbst zusammengeführt)')
        ->and($vehicle->hsn)->toBeNull()
        ->and($vehicle->needs_review)->toBeTrue();

    // The stored car is found by its name, as the person is sent to look for it.
    $this->actingAs(vfdAdmin(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q='.rawurlencode('Alfa 145'))
        ->assertOk()
        ->assertJsonPath('items.0.id', $vehicle->id);
});

it('takes a number in the EU form without asking, as before', function (): void {
    $this->actingAs(vfdAdmin(), 'admin')->postJson('/admin/gutachten/'.vfdDraft()->id.'/fahrzeuge', vfdCar(['ohne_eu_format' => false]))
        ->assertCreated();

    expect(data_get(Vehicle::query()->sole()->raw, 'gutachten.eu_form'))->toBeTrue();
});

it('knows the same car by a number in another form only when it reads the same — never by likeness', function (): void {
    $document = vfdDraft();
    $car = vfdCar(['make' => 'Alfa Romeo', 'model' => '145/146', 'type_designation' => '930', 'eg_number' => 'G731*', 'body_form' => '', 'ohne_eu_format' => true]);
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", $car)->assertCreated();

    // Case, spaces and the closing asterisk aside, the same text and name: the car that is there.
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$car, 'eg_number' => 'g731 '])
        ->assertUnprocessable()
        ->assertJsonPath('errors.eg_number.0', 'Dieses Fahrzeug gibt es schon: Alfa Romeo 145/146 930. Such es in der Liste oben und wähl es dort.');

    // Another text is another car — no prefix, no range, no guess.
    $this->actingAs(vfdAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [...$car, 'eg_number' => 'G7311*'])->assertCreated();

    expect(Vehicle::query()->where('source', 'gutachten')->count())->toBe(2);
});
