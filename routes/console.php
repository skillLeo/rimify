<?php

declare(strict_types=1);

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// R-12: production holds no demo rows. The deploy checks before it migrates; this checks every day.
Schedule::command('demo:assert-clean')->dailyAt('04:30')->timezone('Europe/Berlin')->environments(['production']);
