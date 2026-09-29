<?php

declare(strict_types=1);

use Database\Seeders\CatalogueSeeder;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test case binding
|--------------------------------------------------------------------------
| Feature tests boot Laravel and run against a real MySQL 8.4 database (docs/decisions.md D-009);
| Tests\TestCase carries RefreshDatabase itself so it can scope migrations to one slice.
| Unit tests are plain PHPUnit cases: the pure part of app/Domain/Fitment must be testable with no
| framework booted and no database (R-13), so nothing is bound to tests/Unit.
*/

pest()->extend(TestCase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| The storefront tests' shop
|--------------------------------------------------------------------------
| Example data never reaches the storefront (the review release §2): the demo catalogue is seeded as
| drafts, and the database refuses a published demo row. The storefront tests (and the public API's)
| are about a shop with wheels in it, so for them the seeded catalogue is their own shop — published,
| not demo. The seeder
| honours this only under test (CatalogueSeeder::$shopFixture). A test about the demo rule itself
| switches it off again in its own beforeEach.
*/

uses()
    ->beforeEach(function (): void {
        CatalogueSeeder::$shopFixture = true;
    })
    ->afterEach(function (): void {
        CatalogueSeeder::$shopFixture = false;
    })
    ->in('Feature/Storefront', 'Feature/Api');
