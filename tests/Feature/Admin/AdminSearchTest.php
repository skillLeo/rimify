<?php

declare(strict_types=1);

use App\Enums\ApprovalKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Brand;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelModel;
use App\Support\SearchTerm;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/*
 * Human QA Part D (28.10.2026): the admin's searches as staff type them. What found nothing before — two spaces where
 * one was meant, „TUEV“ for „TÜV“, the ABE number a Nachtrag supplements, an HSN without its leading zeros — finds what
 * was meant, and nothing more.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

function searchAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/**
 * @param  TestResponse<\Illuminate\Http\Response>  $response
 * @return array<string, mixed>
 */
function searchProps(TestResponse $response): array
{
    $props = [];
    $response->assertOk()->assertInertia(function (AssertableInertia $page) use (&$props): void {
        $props = $page->toArray()['props'];
    });

    return $props;
}

it('spells a search both ways and makes one space of many', function (): void {
    expect(SearchTerm::variants('TUEV'))->toBe(['TUEV', 'TÜV'])
        ->and(SearchTerm::variants('Müller'))->toBe(['Müller', 'Mueller'])
        ->and(SearchTerm::variants('  Borbet   DB8GT2 '))->toBe(['Borbet DB8GT2'])
        // The wildcards of the term itself are no wildcards.
        ->and(SearchTerm::likes('50%'))->toBe(['%50\%%']);
});

it('finds a Felge typed with two spaces between brand and model', function (): void {
    $brand = Brand::factory()->create(['name' => 'Suchmarke', 'is_wheel_brand' => true]);
    WheelModel::factory()->create(['brand_id' => $brand->id, 'name' => 'DB8GT2']);

    $names = fn (string $q): array => array_column(searchProps($this->actingAs(searchAdmin(), 'admin')->get('/admin/felgen?q='.urlencode($q)))['wheels'], 'name');

    expect($names('Suchmarke DB8GT2'))->toHaveCount(1)
        ->and($names('Suchmarke  DB8GT2'))->toHaveCount(1)
        ->and($names('Suchmarke ZZZ'))->toBe([]);
});

it('finds a Gutachten by its issuer written without the umlaut, and a Nachtrag by the ABE it supplements', function (): void {
    ApprovalDocument::factory()->create(['issuer' => 'TÜV Austria', 'kind' => ApprovalKind::Nachtrag->value, 'report_number' => '366-0350-21-WIRD/N1', 'kba_number' => null, 'supplement_to_number' => '53841']);
    ApprovalDocument::factory()->create(['issuer' => 'DEKRA', 'report_number' => 'D-1']);

    $count = fn (string $q): int => count(searchProps($this->actingAs(searchAdmin(), 'admin')->get('/admin/gutachten?q='.urlencode($q)))['documents']);

    expect($count('TÜV'))->toBe(1)
        ->and($count('TUEV'))->toBe(1)
        ->and($count('tuev'))->toBe(1)
        ->and($count('53841'))->toBe(1)
        ->and($count('DEKRA'))->toBe(1);
});

it('finds a car by an HSN typed without its leading zeros, and never mistakes a short number alone for one', function (): void {
    Vehicle::factory()->create(['make' => 'BMW', 'model' => '3er', 'variant' => '320i', 'hsn' => '0005', 'tsn' => 'Z90', 'is_demo' => false]);

    $count = fn (string $q): int => count(searchProps($this->actingAs(searchAdmin(), 'admin')->get('/admin/fahrzeuge?q='.urlencode($q)))['vehicles']);

    expect($count('0005 Z90'))->toBe(1)
        ->and($count('5 Z90'))->toBe(1)
        ->and($count('5/z90'))->toBe(1)
        ->and($count('6 Z90'))->toBe(0)
        // „3“ alone is a word, as before: the 3er.
        ->and($count('3'))->toBe(1);
});

it('finds a tyre by a profile written without its umlaut', function (): void {
    $brand = Brand::factory()->create(['name' => 'Reifenmarke', 'is_wheel_brand' => false]);
    TyreVariant::factory()->create(['brand_id' => $brand->id, 'name' => 'Grün Sport', 'is_demo' => false]);

    $count = fn (string $q): int => count(searchProps($this->actingAs(searchAdmin(), 'admin')->get('/admin/reifen?q='.urlencode($q)))['tyres']);

    expect($count('Grün'))->toBe(1)->and($count('Gruen'))->toBe(1);
});
