<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Services\Admin\AdminAlerts;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Tells whoever looks after the system that a queued job gave up.
 *
 * Names the job in German and nothing of its error: an exception message can carry a customer's
 * address or a query, and the bell is not the place for either. The same job failing a hundred
 * times rings once per quarter of an hour, not a hundred times — a bell that floods is one nobody
 * reads.
 */
class FailedJobAlert
{
    /** Seconds one job class stays quiet after it has rung. */
    public const QUIET_SECONDS = 900;

    /**
     * What each queued job does, in the words of the person reading the bell. A job not listed here
     * is named by its technical name, marked as such, so it can still be found in the logs.
     *
     * @var array<string, string>
     */
    public const NAMES = [
        'NotifyFitmentSubscribers' => 'die E-Mails an alle Anfragen, auf die ein neues Gutachten passt',
        'FitmentAvailableMail' => 'die E-Mail an eine Anfrage, dass es jetzt Felgen für ihr Auto gibt',
        'SubscriptionConfirmationMail' => 'die E-Mail, mit der jemand eine neue Anfrage bestätigt',
    ];

    public function __construct(private readonly AdminAlerts $alerts) {}

    public function handle(JobFailed $event): void
    {
        try {
            $name = $event->job->resolveName();
        } catch (Throwable) {
            $name = '';
        }

        if (! Cache::add('admin-alert:job-failed:'.sha1($name), true, self::QUIET_SECONDS)) {
            return;
        }

        $this->alerts->send(
            'job_failed',
            'Eine Hintergrundaufgabe ist fehlgeschlagen.',
            'Betroffen: '.self::describe($name).'. Weitere Fehler dieser Aufgabe melden wir frühestens in 15 Minuten.',
            ['route' => 'admin.warteschlange.index', 'params' => []],
        );
    }

    public static function describe(string $class): string
    {
        $short = $class === '' ? '' : class_basename($class);

        return self::NAMES[$short] ?? ($short === '' ? 'eine unbekannte Aufgabe' : "eine Aufgabe mit dem technischen Namen „{$short}“");
    }
}
