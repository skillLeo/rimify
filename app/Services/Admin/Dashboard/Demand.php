<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Models\DemandMark;
use App\Models\Fitment;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Nachfrage-Lücken: the cars customers asked for that the shop has no approved wheel for yet, ranked
 * by how much they were asked for and how recently (docs/admin/rest-build-plan.md, „Übersicht und
 * Shell“ step F). It is the list of which Gutachten to obtain next, in order of real demand.
 *
 * Three signals, all already recorded by the storefront:
 *
 *   - a vehicle whose Felgen list came back empty, or a Felge that could not be judged for it
 *     (`catalogue_gap_events`, NO_DOCUMENT, with the vehicle);
 *   - key numbers the catalogue does not know (`catalogue_gap_events`, VEHICLE_NOT_FOUND, HSN/TSN);
 *   - a „Sag mir Bescheid“ subscription: asked in the period when it was made, and a person waiting
 *     for as long as it is confirmed and not yet answered.
 *
 * A car that has an approved wheel by now is not a gap, whatever was asked: the list is read against
 * the catalogue as it is today (Fitment::visibleToCustomers). Searches that found nothing are free
 * text and name no car, so they are listed beside it, never guessed into it.
 *
 * The weighting is simple enough to say in a sentence, and the page says it: every ask counts, a
 * fortnight-old one half as much as today's, and a person waiting counts three times.
 *
 * @phpstan-type Mark array{state: string, label: string, by: string|null}
 * @phpstan-type Gap array{key: string, kind: string, title: string, detail: string, asked: int, waiting: int, lastAgo: string|null, lastIso: string|null, score: float, weight: int, mark: Mark|null, mail: array{subject: string, body: string}}
 * @phpstan-type Counts array{offen: int, beobachtet: int, angefordert: int, alle: int}
 */
final class Demand
{
    /** After this many days an ask counts half as much as one made today. */
    public const HALF_LIFE_DAYS = 14;

    /** A person who left their address and is waiting counts this many asks. */
    public const WAITING_WEIGHT = 3;

    /** The list's filter, as the query string names it, and the mark state it keeps. */
    public const STATES = ['offen' => null, 'beobachtet' => DemandMark::WATCHED, 'angefordert' => DemandMark::REQUESTED, 'alle' => null];

    /**
     * Every gap of the period, ranked, with how many there are in each state.
     *
     * @return array{rows: list<Gap>, counts: Counts, asks: int, waiting: int}
     */
    public function ranked(Period $period, string $state = 'offen', ?string $signedBy = null, ?int $limit = null): array
    {
        $today = CarbonImmutable::now(GermanFormat::TIMEZONE)->startOfDay();
        $gaps = [...$this->vehicleGaps($period, $today, $signedBy), ...$this->keyGaps($period, $today, $signedBy)];

        $marks = DemandMark::query()
            ->with(['brand:id,name', 'admin:id,name'])
            ->whereIn('gap_key', array_column($gaps, 'key'))
            ->get()
            ->keyBy('gap_key');

        $counts = ['offen' => 0, 'beobachtet' => 0, 'angefordert' => 0, 'alle' => count($gaps)];
        $max = $gaps === [] ? 0.0 : max(array_column($gaps, 'score'));
        $rows = [];

        foreach ($gaps as $gap) {
            $mark = $marks->get($gap['key']);
            $bucket = match ($mark?->state) {
                DemandMark::WATCHED => 'beobachtet',
                DemandMark::REQUESTED => 'angefordert',
                default => 'offen',
            };
            $counts[$bucket]++;

            if ($state !== 'alle' && $state !== $bucket) {
                continue;
            }

            $gap['mark'] = $mark === null ? null : self::mark($mark);
            // How this gap's demand compares with the largest in the list, for the bar beside it.
            $gap['weight'] = $max > 0 ? (int) max(1, round($gap['score'] / $max * 100)) : 0;
            $rows[] = $gap;
        }

        usort($rows, static fn (array $a, array $b): int => [$b['score'], $b['lastIso'] ?? ''] <=> [$a['score'], $a['lastIso'] ?? '']);

        return [
            'rows' => $limit === null ? $rows : array_slice($rows, 0, $limit),
            'counts' => $counts,
            'asks' => array_sum(array_column($gaps, 'asked')),
            'waiting' => array_sum(array_column($gaps, 'waiting')),
        ];
    }

    /**
     * Searches of the period that found nothing, the most frequent first. The count is every miss of
     * that query so far — the table keeps no days — and the page says so.
     *
     * @return list<array{query: string, misses: int, lastAgo: string|null}>
     */
    public function searches(Period $period, int $limit = 10): array
    {
        return DB::table('search_misses')
            ->where('last_missed_at', '>=', $period->startUtc())
            ->where('last_missed_at', '<', $period->endUtc())
            ->orderByDesc('misses')
            ->orderByDesc('last_missed_at')
            ->limit($limit)
            ->get(['query', 'misses', 'last_missed_at'])
            ->map(static fn (object $row): array => [
                'query' => (string) $row->query,
                'misses' => (int) $row->misses,
                'lastAgo' => GermanFormat::ago(CarbonImmutable::parse((string) $row->last_missed_at, 'UTC'), null, 99),
            ])
            ->values()
            ->all();
    }

    /** What a gap is called, from its key alone — for the Protokoll, which outlives the demand. */
    public static function titleFor(string $key): string
    {
        if (preg_match('/^k:([0-9]{4})-([A-Z0-9]{3})$/', $key, $m) === 1) {
            return GermanFormat::keyNumbers($m[1], $m[2]);
        }

        $vehicle = DB::table('vehicles')->where('id', (int) substr($key, 2))->first(['make', 'model', 'variant']);

        return $vehicle === null ? 'ein Fahrzeug' : self::vehicleName((string) $vehicle->make, (string) $vehicle->model, (string) $vehicle->variant);
    }

    /** `BMW 3er 320d`, and `BMW X3 M40i` rather than `BMW X3 X3 M40i`. */
    public static function vehicleName(string $make, string $model, string $variant): string
    {
        $rest = str_starts_with($variant, $model) ? $variant : trim("{$model} {$variant}");

        return trim("{$make} {$rest}");
    }

    /**
     * Cars in the catalogue that were asked for, or are waited for, and have no approved wheel.
     *
     * @return list<Gap>
     */
    private function vehicleGaps(Period $period, CarbonImmutable $today, ?string $signedBy): array
    {
        $asks = [];

        $events = DB::table('catalogue_gap_events')
            ->whereNotNull('vehicle_id')
            ->where('occurred_at', '>=', $period->startUtc())
            ->where('occurred_at', '<', $period->endUtc())
            ->groupBy('vehicle_id', DB::raw('DATE(occurred_at)'))
            ->selectRaw('vehicle_id as id, DATE(occurred_at) as day, COUNT(*) as n, MAX(occurred_at) as last_at')
            ->get();

        $subscribed = DB::table('fitment_subscriptions')
            ->where('created_at', '>=', $period->startUtc())
            ->where('created_at', '<', $period->endUtc())
            ->groupBy('vehicle_id', DB::raw('DATE(created_at)'))
            ->selectRaw('vehicle_id as id, DATE(created_at) as day, COUNT(*) as n, MAX(created_at) as last_at')
            ->get();

        foreach ([...$events, ...$subscribed] as $row) {
            self::add($asks, 'v:'.(int) $row->id, (string) $row->day, (int) $row->n, (string) $row->last_at, $today);
        }

        // Waiting is now, not the period's: a person who asked a month ago is still waiting today.
        $waiting = DB::table('fitment_subscriptions')
            ->whereNotNull('confirmed_at')
            ->whereNull('unsubscribed_at')
            ->whereNull('notified_at')
            ->groupBy('vehicle_id')
            ->selectRaw('vehicle_id, COUNT(*) as n')
            ->pluck('n', 'vehicle_id')
            ->map(static fn (mixed $n): int => (int) $n)
            ->all();

        $ids = array_unique([...array_map(static fn (string $key): int => (int) substr($key, 2), array_keys($asks)), ...array_keys($waiting)]);

        if ($ids === []) {
            return [];
        }

        $covered = Fitment::query()->visibleToCustomers()->whereIn('fitments.vehicle_id', $ids)->distinct()->pluck('fitments.vehicle_id')->all();
        $vehicles = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->whereIn('id', array_diff($ids, $covered))
            ->get(['id', 'make', 'model', 'variant', 'type_designation', 'hsn', 'tsn', 'build_from', 'build_to', 'power_kw']);

        $gaps = [];

        foreach ($vehicles as $vehicle) {
            $key = 'v:'.(int) $vehicle->id;
            $ask = $asks[$key] ?? ['asked' => 0, 'score' => 0.0, 'last' => null];
            $people = $waiting[(int) $vehicle->id] ?? 0;
            $name = self::vehicleName((string) $vehicle->make, (string) $vehicle->model, (string) $vehicle->variant);
            $keys = GermanFormat::keyNumbers((string) $vehicle->hsn, (string) $vehicle->tsn);
            $built = GermanFormat::buildPeriod(
                $vehicle->build_from === null ? null : CarbonImmutable::parse((string) $vehicle->build_from),
                $vehicle->build_to === null ? null : CarbonImmutable::parse((string) $vehicle->build_to),
            );

            $facts = array_filter([
                'Fahrzeug' => $name,
                'Typ' => $vehicle->type_designation === null ? null : (string) $vehicle->type_designation,
                'HSN/TSN' => GermanFormat::hsn((string) $vehicle->hsn).' / '.mb_strtoupper((string) $vehicle->tsn),
                'Bauzeitraum' => $built,
                'Leistung' => $vehicle->power_kw === null ? null : GermanFormat::integer((int) $vehicle->power_kw).' kW',
            ]);

            $gaps[] = self::gap($key, 'vehicle', $name, $keys.' '.GermanFormat::MIDDOT.' '.$built, $ask, $people, $facts, $signedBy);
        }

        return $gaps;
    }

    /**
     * Key numbers a customer typed that the catalogue did not know. Once the catalogue knows them and
     * one of those cars has an approved wheel, the gap is closed; until then it stays, named by the
     * car where the catalogue has it by now.
     *
     * @return list<Gap>
     */
    private function keyGaps(Period $period, CarbonImmutable $today, ?string $signedBy): array
    {
        $rows = DB::table('catalogue_gap_events')
            ->whereNull('vehicle_id')
            ->whereNotNull('hsn')
            ->whereNotNull('tsn')
            ->where('occurred_at', '>=', $period->startUtc())
            ->where('occurred_at', '<', $period->endUtc())
            ->groupBy('hsn', 'tsn', DB::raw('DATE(occurred_at)'))
            ->selectRaw('hsn, tsn, DATE(occurred_at) as day, COUNT(*) as n, MAX(occurred_at) as last_at')
            ->get();

        $asks = [];
        $pairs = [];

        foreach ($rows as $row) {
            $hsn = GermanFormat::hsn((string) $row->hsn);
            $tsn = mb_strtoupper(trim((string) $row->tsn));

            if (preg_match('/^[0-9]{4}$/', $hsn) !== 1 || preg_match('/^[A-Z0-9]{3}$/', $tsn) !== 1) {
                continue;
            }

            $key = "k:{$hsn}-{$tsn}";
            $pairs[$key] = [$hsn, $tsn];
            self::add($asks, $key, (string) $row->day, (int) $row->n, (string) $row->last_at, $today);
        }

        $gaps = [];

        foreach ($pairs as $key => [$hsn, $tsn]) {
            $known = DB::table('vehicles')->whereNull('deleted_at')->where('hsn', $hsn)->where('tsn', $tsn)->get(['id', 'make', 'model']);

            if ($known->isNotEmpty() && Fitment::query()->visibleToCustomers()->whereIn('fitments.vehicle_id', $known->pluck('id'))->exists()) {
                continue;
            }

            $first = $known->first();
            $title = $first === null ? GermanFormat::keyNumbers($hsn, $tsn) : trim("{$first->make} {$first->model}");
            $detail = $first === null
                ? 'Nicht im Fahrzeugkatalog'
                : GermanFormat::keyNumbers($hsn, $tsn).' '.GermanFormat::MIDDOT.' inzwischen im Katalog, noch ohne Freigabe';

            $facts = array_filter([
                'Fahrzeug' => $first === null ? null : $title,
                'HSN/TSN' => "{$hsn} / {$tsn}",
            ]);

            $gaps[] = self::gap($key, 'keys', $title, $detail, $asks[$key], 0, $facts, $signedBy);
        }

        return $gaps;
    }

    /**
     * Fold one day's asks into a gap: counted in full, weighed by how long ago that day was.
     *
     * @param  array<string, array{asked: int, score: float, last: string|null}>  $asks
     */
    private static function add(array &$asks, string $key, string $day, int $n, string $lastAt, CarbonImmutable $today): void
    {
        $age = max(0, (int) CarbonImmutable::parse($day, GermanFormat::TIMEZONE)->startOfDay()->diffInDays($today));
        $entry = $asks[$key] ?? ['asked' => 0, 'score' => 0.0, 'last' => null];

        $entry['asked'] += $n;
        $entry['score'] += $n * 0.5 ** ($age / self::HALF_LIFE_DAYS);
        $entry['last'] = $entry['last'] === null || $lastAt > $entry['last'] ? $lastAt : $entry['last'];

        $asks[$key] = $entry;
    }

    /**
     * @param  array{asked: int, score: float, last: string|null}  $ask
     * @param  array<string, string>  $facts
     * @return Gap
     */
    private static function gap(string $key, string $kind, string $title, string $detail, array $ask, int $waiting, array $facts, ?string $signedBy): array
    {
        $last = $ask['last'] === null ? null : CarbonImmutable::parse($ask['last'], 'UTC');

        return [
            'key' => $key,
            'kind' => $kind,
            'title' => $title,
            'detail' => $detail,
            'asked' => $ask['asked'],
            'waiting' => $waiting,
            'lastAgo' => GermanFormat::ago($last, null, 99),
            'lastIso' => $last?->toIso8601String(),
            'score' => round($ask['score'] + $waiting * self::WAITING_WEIGHT, 3),
            'weight' => 0,
            'mark' => null,
            'mail' => self::mail($title, $facts, $signedBy),
        ];
    }

    /**
     * The request to a wheel brand, ready to send: what the car is, and what is asked. Business
     * German to a manufacturer, so „Sie“; the admin's own name signs it, and the address is theirs to
     * fill in — no contact is stored here.
     *
     * @param  array<string, string>  $facts
     * @return array{subject: string, body: string}
     */
    private static function mail(string $title, array $facts, ?string $signedBy): array
    {
        $lines = [];

        foreach ($facts as $label => $value) {
            $lines[] = "{$label}: {$value}";
        }

        $body = implode("\n", [
            'Guten Tag,',
            '',
            'unsere Kundinnen und Kunden fragen nach Rädern für ein Fahrzeug, für das uns noch kein Gutachten vorliegt:',
            '',
            ...$lines,
            '',
            'Gibt es für dieses Fahrzeug ein Gutachten (ABE, Teilegutachten oder ECE) zu Ihren Rädern? Wir freuen uns über das Dokument oder eine kurze Nachricht, ab wann es vorliegt.',
            '',
            'Mit freundlichen Grüßen',
            ...array_filter([$signedBy, 'RIMIFY']),
        ]);

        return ['subject' => "Gutachten-Anfrage: {$title}", 'body' => $body];
    }

    /** @return Mark */
    private static function mark(DemandMark $mark): array
    {
        $on = (string) GermanFormat::date($mark->marked_at);
        $brand = $mark->brand?->name;

        return [
            'state' => $mark->state,
            'label' => $mark->state === DemandMark::REQUESTED
                ? ($brand === null ? "Angefordert am {$on}" : "Bei {$brand} angefordert am {$on}")
                : "Beobachtet seit {$on}",
            'by' => $mark->admin?->name,
        ];
    }
}
