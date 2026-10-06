<?php

declare(strict_types=1);
use Tests\Support\PinnedEnvironment;

/*
 * The test run's bootstrap (phpunit.xml): the autoloader, then the pinned environment (tests/env.php, D-180) — every
 * variable the application reads set or unset here, before Laravel boots, and the run refused while the shell sets one
 * the list does not name. Each worker of a parallel run passes through here too; its main process has already applied
 * the list through Tests\CreatesApplication.
 */

require __DIR__.'/../vendor/autoload.php';

PinnedEnvironment::applyOnce(require __DIR__.'/env.php', dirname(__DIR__));
