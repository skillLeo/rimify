<?php

declare(strict_types=1);

/*
 * Block G: the checkout's Ort for a PLZ (GeoNames, CC BY 4.0). Places only — a Großkunde's company is never
 * offered as a place — several where a PLZ has several, none for a code that does not exist.
 */

it('answers the places under a PLZ, and nothing for one that does not exist', function (string $plz, array $places): void {
    $this->getJson('/api/v1/plz/'.$plz)->assertOk()->assertExactJson(['places' => $places]);
})->with([
    'one place' => ['10115', ['Berlin']],
    'several places' => ['59969', ['Bromskirchen', 'Hallenberg']],
    'a Großkunde left out' => ['01054', []],
    'no such code' => ['00000', []],
]);

it('admits five digits only', function (string $plz): void {
    $this->getJson('/api/v1/plz/'.$plz)->assertNotFound();
})->with(['1011', '101155', 'abcde', '1011a']);

it('lets the answer be cached: the table changes with a release, not a request', function (): void {
    expect((string) $this->getJson('/api/v1/plz/80331')->headers->get('Cache-Control'))->toContain('public')->toContain('max-age=86400');
});
