<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Vehicle;
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

    expect(Vehicle::query()->where('source', 'gutachten')->count())->toBe(1);
});

it('refuses, in words, what the document cannot have said', function (array $overrides, string $field, string $message): void {
    $this->actingAs(vfdAdmin(), 'admin')->postJson('/admin/gutachten/'.vfdDraft()->id.'/fahrzeuge', vfdCar($overrides))
        ->assertUnprocessable()
        ->assertJsonPath("errors.{$field}.0", $message);

    expect(Vehicle::query()->count())->toBe(0);
})->with([
    'no maker' => [['make' => ''], 'make', 'Trag den Hersteller ein, so wie das Gutachten ihn nennt.'],
    'no type' => [['type_designation' => ''], 'type_designation', 'Trag den Fahrzeugtyp ein, etwa „3C“.'],
    'an HSN instead of an EG number' => [['eg_number' => '0005'], 'eg_number', 'So sieht eine EG-Typgenehmigungsnummer nicht aus. Sie beginnt mit e und der Länderziffer, etwa e1*2007/46*0316*..'],
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
