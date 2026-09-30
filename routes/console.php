<?php

declare(strict_types=1);

use App\Support\ScheduleBeat;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// R-12: production holds no demo rows. The deploy checks before it migrates; this checks every day.
Schedule::command('demo:assert-clean')->dailyAt('04:30')->timezone('Europe/Berlin')->environments(['production']);
// Block G: an order unpaid 24 hours after it was placed expires, and its stock goes back on the shelf.
Schedule::command('orders:expire')->everyTenMinutes()->withoutOverlapping();
// The scheduler's pulse: rimify:preflight and the admin's health line read it to tell whether the cron line runs.
Schedule::call(static fn () => ScheduleBeat::record())->everyMinute()->name('schedule-heartbeat');
