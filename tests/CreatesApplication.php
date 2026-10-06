<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Tests\Support\PinnedEnvironment;

/**
 * The application a parallel run's main process boots. Laravel's ParallelRunner looks for this trait by name and boots
 * one application per worker through it — to run the set-up and tear-down callbacks — before PHPUnit has loaded
 * tests/bootstrap.php. Without it that application read the developer's .env: APP_ENV=local and the development
 * database, and every worker inherited those values as its shell (D-180). Tests\TestCase does not use it; each test's
 * application is booted by Laravel's own TestCase, after the bootstrap has pinned the environment.
 */
trait CreatesApplication
{
    public function createApplication(): Application
    {
        PinnedEnvironment::applyOnce(require __DIR__.'/env.php', dirname(__DIR__));

        /** @var Application $app */
        $app = require __DIR__.'/../bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
