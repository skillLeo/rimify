<?php

declare(strict_types=1);

namespace App\Services\GoLive;

use App\Support\GermanFormat;
use Carbon\CarbonInterface;

/**
 * docs/review/WAS-FEHLT.md, as rimify:go-live-check writes it: for the client first — what each side still owes, in
 * that order — then every check by group. Nothing in it is typed by hand; the command rewrites it from the state found.
 */
final class WasFehlt
{
    /** Who closes a check, as the page names them. */
    public const OWNERS = [
        GoLiveCheck::CLIENT => 'beim Kunden',
        GoLiveCheck::US => 'bei uns (RIMIFY)',
        GoLiveCheck::HOST => 'beim Host',
    ];

    /** @param  list<GoLiveCheck>  $checks */
    public static function markdown(array $checks, CarbonInterface $at): string
    {
        $out = [
            '# Was dem Live-Shop noch fehlt',
            '',
            'Stand: '.GermanFormat::dateTime($at).' · erzeugt von `php artisan rimify:go-live-check --markdown=docs/review/WAS-FEHLT.md` aus dem Zustand, den der Shop gerade hat – nichts darin ist von Hand geschrieben.',
            '',
            '**'.GoLiveChecks::countLine($checks).'**',
            '',
        ];

        foreach (self::OWNERS as $owner => $label) {
            $open = array_values(array_filter($checks, static fn (GoLiveCheck $c): bool => $c->missing() && $c->owner === $owner));

            $out[] = '## Offen '.$label.' ('.count($open).')';
            $out[] = '';

            if ($open === []) {
                $out[] = 'Nichts.';
            }

            foreach ($open as $check) {
                $out[] = "- **{$check->title}** – {$check->sentence} *Wo:* `{$check->place}`";
            }

            $out[] = '';
        }

        $out[] = '## Alle Prüfungen';
        $out[] = '';

        foreach (GoLiveChecks::GROUPS as $group) {
            $out[] = "### {$group}";
            $out[] = '';
            $out[] = '| Prüfung | Zuständig | Stand | Befund | Wo |';
            $out[] = '|---|---|---|---|---|';

            foreach ($checks as $check) {
                if ($check->group === $group) {
                    $out[] = '| '.implode(' | ', array_map(self::cell(...), [$check->title, $check->owner, $check->state, $check->sentence, '`'.$check->place.'`'])).' |';
                }
            }

            $out[] = '';
        }

        return implode("\n", $out);
    }

    private static function cell(string $text): string
    {
        return str_replace(['|', "\n"], ['\|', ' '], $text);
    }
}
