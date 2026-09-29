<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * One thing the team should know about, as it lands in the bell (AdminAlerts decides who gets it).
 *
 * Stored, never queued: an alert about a failed job must not itself wait in the queue that failed.
 * The link is kept as a route name, not a URL, so an alert written before its page existed gains
 * its link the day the page is built, and one whose page moves follows it.
 */
class AdminAlert extends Notification
{
    /**
     * @param  string  $kind  a key of AdminAlerts::KINDS
     * @param  string  $title  one German sentence: what happened
     * @param  string|null  $detail  one short line of facts under it
     * @param  array{route: string, params: array<string, int|string>}|null  $target
     */
    public function __construct(
        public readonly string $kind,
        public readonly string $title,
        public readonly ?string $detail = null,
        public readonly ?array $target = null,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array{kind: string, title: string, detail: string|null, target: array{route: string, params: array<string, int|string>}|null} */
    public function toArray(object $notifiable): array
    {
        return [
            'kind' => $this->kind,
            'title' => $this->title,
            'detail' => $this->detail,
            'target' => $this->target,
        ];
    }
}
