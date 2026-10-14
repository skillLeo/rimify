<?php

declare(strict_types=1);

use App\Models\ContactMessage;
use App\Services\GoLive\TyreConfirmations;
use App\Services\Reset\TestEnvironment;
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
// #19, D-103: once, some days after the team marked an order „Zugestellt“, its buyer is asked to rate the rims.
Schedule::command('rimify:bewertungen-einladen')->dailyAt('10:00')->timezone('Europe/Berlin')->withoutOverlapping();
// #12, D-123: a contact-form message is kept twelve months, then deleted with the address in it.
Schedule::command('model:prune', ['--model' => [ContactMessage::class]])->dailyAt('03:30')->timezone('Europe/Berlin');
// Testumgebung zurücksetzen: an interrupted reset is put back from its safety copy within the minute (the site stays in
// maintenance until then; with nothing interrupted the run touches nothing), and the copies go within the hour after
// the seven days they can be undone in, each with its own line in the Protokoll — a copy of the shop's customers has an
// end (the operator's brief of 05.10.2026, §2.2). The ones kept are sealed and private. Never in production.
Schedule::command('rimify:reset --recover')->everyMinute()->evenInMaintenanceMode()->environments(TestEnvironment::ENVIRONMENTS);
Schedule::command('rimify:reset --prune')->hourly()->environments(TestEnvironment::ENVIRONMENTS);
// Finding 103, §1.5: how many pairs of a vehicle and a wheel stand on „Reifengröße noch nicht bestätigt“ — counted by the
// engine itself, about ten milliseconds a pair, so System › Was fehlt reads the count kept here and never makes it.
Schedule::call(static fn () => app(TyreConfirmations::class)->count(fresh: true))->hourly()->name('reifenbestaetigung-zaehlen')->withoutOverlapping();
// The scheduler's pulse: rimify:preflight and the admin's health line read it to tell whether the cron line runs.
Schedule::call(static fn () => ScheduleBeat::record())->everyMinute()->name('schedule-heartbeat');
