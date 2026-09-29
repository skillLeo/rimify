<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\Demo\DemoDashboard;
use App\Services\Demo\DemoGuard;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * The admin's demonstration data, ending today at scale 1 (DemoDashboard). `php artisan demo:seed`
 * takes a scale and an anchor; this is the same with the defaults.
 *
 * Fenced: only in local, staging or testing, and only with DEMO_DATA=1. In production it refuses
 * with a reason, `--force` or not. DatabaseSeeder never calls it.
 */
class DemoDashboardSeeder extends Seeder
{
    public function run(): void
    {
        // The fence before anything is built.
        DemoGuard::ensure();

        app(DemoDashboard::class)->seed(CarbonImmutable::now(GermanFormat::TIMEZONE)->startOfDay());
    }
}
