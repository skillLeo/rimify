<?php

declare(strict_types=1);

use App\Console\Commands\Preflight;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// R-12: production holds no demo rows. The deploy checks before it migrates; this checks every day.
Schedule::command('demo:assert-clean')->dailyAt('04:30')->timezone('Europe/Berlin')->environments(['production']);
// Block G: an order unpaid 24 hours after it was placed expires, and its stock goes back on the shelf.
Schedule::command('orders:expire')->everyTenMinutes()->withoutOverlapping();
// The scheduler's pulse: rimify:preflight reads it to tell whether the cron line runs at all.
Schedule::call(static fn () => Cache::forever(Preflight::SCHEDULE_BEAT, now()->getTimestamp()))->everyMinute()->name('schedule-heartbeat');
