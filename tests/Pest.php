<?php

declare(strict_types=1);

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
