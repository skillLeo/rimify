<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProtokollExportRequest;
use App\Http\Requests\Admin\ProtokollFilterRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Admin\AuditDescriber;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Protokoll — every change made in the panel, who made it, when, and what it was before
 * (docs/admin/BRIEF.md §2, docs/admin/team-build-plan.md).
 *
 * The table is append-only at the model and by trigger; this controller only ever reads it, and the
 * one entry it writes is the record that somebody took a copy away. Filters travel in the query
 * string so a filtered view is a link, and the export reads exactly the set the page shows. Every
 * entry is put into words by AuditDescriber — the page never sees an event name, an id or cents.
 */
class ProtokollController extends Controller
{
    public const PER_PAGE = 50;

    /** The CSV's header row, in the order of its columns. */
    public const CSV_HEADER = ['Zeitpunkt', 'Person', 'Bereich', 'Änderung', 'Vorher → Nachher', 'IP-Adresse'];

    /** Who an entry names when it kept neither an account nor an address. */
    private const NOBODY = 'Unbekannt';

    public function index(ProtokollFilterRequest $request, AuditDescriber $describer): Response|RedirectResponse
    {
        $filters = $request->filters();
        $admin = $request->admin();
        $oldest = $request->oldestFirst();
        // The page links keep the order (F-32); the export is the same set, newest first, as before.
        $paged = [...$filters, 'reihenfolge' => $oldest ? 'alt' : null];

        $page = self::filtered($filters)
            ->orderBy('id', $oldest ? 'asc' : 'desc')
            ->paginate(self::PER_PAGE, ['*'], 'seite', $request->page());

        // A page past the end (an old link, a filter that shrank the set) opens the last real page
        // rather than an empty list that would read as "nothing here".
        if ($page->isEmpty() && $page->total() > 0) {
            return redirect()->to(self::url('/admin/protokoll', $paged, $page->lastPage()));
        }

        /** @var list<AuditLog> $items */
        $items = array_values($page->items());
        $names = self::names($items);
        $today = GermanFormat::date(CarbonImmutable::now(GermanFormat::TIMEZONE));
        $yesterday = GermanFormat::date(CarbonImmutable::now(GermanFormat::TIMEZONE)->subDay());

        $entries = [];

        foreach ($items as $entry) {
            $text = $describer->describe($entry);
            $at = $entry->created_at;
            $date = GermanFormat::date($at);

            $entries[] = [
                'id' => (int) $entry->id,
                'at' => GermanFormat::dateTime($at),
                'iso' => $at?->toIso8601String(),
                'day' => $date,
                'dayLabel' => match (true) {
                    $date === null => 'Ohne Datum',
                    $date === $today => 'Heute',
                    $date === $yesterday => 'Gestern',
                    default => $date,
                },
                'time' => self::time($at),
                'person' => self::person($entry, $names),
                'area' => $text['area'],
                'sentence' => $text['sentence'],
                'changes' => $text['changes'],
                'ip' => is_string($entry->ip_address) && $entry->ip_address !== '' ? $entry->ip_address : null,
            ];
        }

        $filtered = array_filter($filters) !== [];
        $canExport = $admin->may(PermissionModule::AuditLog, PermissionAction::Export);

        return Inertia::render('Admin/Protokoll/Index', [
            'entries' => $entries,
            'filters' => $filters,
            'options' => [
                'people' => self::people(),
                'areas' => array_map(
                    static fn (string $value, string $label): array => ['value' => $value, 'label' => $label],
                    array_keys(AuditDescriber::AREAS),
                    array_values(AuditDescriber::AREAS),
                ),
            ],
            'filtered' => $filtered,
            // Only asked for when it answers something: "12 Einträge insgesamt — die Filter schließen
            // sie alle aus" needs the figure before the filters.
            'totalAll' => $filtered ? AuditLog::query()->count() : $page->total(),
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'prev' => $page->currentPage() > 1 ? self::url('/admin/protokoll', $paged, $page->currentPage() - 1) : null,
                'next' => $page->hasMorePages() ? self::url('/admin/protokoll', $paged, $page->currentPage() + 1) : null,
            ],
            'oldestFirst' => $oldest,
            'exportUrl' => $canExport ? self::url('/admin/protokoll/export', $filters, 1) : null,
            // Presentation only; the export refuses on the server regardless (R-11).
            'can' => ['export' => $canExport],
        ]);
    }

    /**
     * The same filtered set as the page, as a CSV a German spreadsheet opens as it is: UTF-8 with a
     * byte-order mark, semicolons, one header row in German.
     *
     * The set is fixed before the file is written — everything up to the newest matching entry at
     * this moment — so rows arriving while it streams (the export's own entry among them) neither
     * appear in it nor shift it. Taking the copy is itself recorded, with the filters it used.
     */
    public function export(ProtokollExportRequest $request, AuditDescriber $describer): StreamedResponse
    {
        $filters = $request->filters();

        $newest = self::filtered($filters)->max('id');
        $bound = is_numeric($newest) ? (int) $newest : 0;
        $count = $bound === 0 ? 0 : self::filtered($filters)->where('id', '<=', $bound)->count();

        AuditTrail::record($request->admin(), 'audit_log.exported', [
            'filters' => self::described($filters),
            'count' => $count,
        ]);

        $filename = 'protokoll-'.CarbonImmutable::now(GermanFormat::TIMEZONE)->format('Y-m-d').'.csv';

        return response()->streamDownload(static function () use ($filters, $bound, $describer): void {
            $out = fopen('php://output', 'wb');

            if ($out === false) {
                return;
            }

            fwrite($out, "\u{FEFF}");
            self::row($out, self::CSV_HEADER);

            if ($bound > 0) {
                // Every account's name once, rather than once per row: the team is small, the log is not.
                $names = DB::table('admin_users')->pluck('name', 'id')->all();

                self::filtered($filters)
                    ->where('id', '<=', $bound)
                    ->lazyByIdDesc(500)
                    ->each(static function (AuditLog $entry) use ($out, $describer, $names): void {
                        $text = $describer->describe($entry);

                        self::row($out, [
                            (string) GermanFormat::dateTime($entry->created_at),
                            self::person($entry, $names),
                            $text['area'],
                            $text['sentence'],
                            implode(' '.GermanFormat::MIDDOT.' ', array_map(
                                static fn (array $c): string => $c['label'].': '.$c['before'].' → '.$c['after'],
                                $text['changes'],
                            )),
                            (string) $entry->ip_address,
                        ]);
                    });
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * The entries the filters select. Parameter binding only (R-14): the area becomes a list of
     * event names, the days become UTC instants, and nothing typed is ever concatenated into SQL.
     *
     * @param  array{person: string|null, bereich: string|null, von: string|null, bis: string|null}  $filters
     * @return Builder<AuditLog>
     */
    private static function filtered(array $filters): Builder
    {
        $query = AuditLog::query();

        $person = $filters['person'];

        if ($person !== null) {
            if (ctype_digit($person)) {
                $query->where('causer_type', (new AdminUser)->getMorphClass())->where('causer_id', (int) $person);
            } else {
                $query->where('actor_email', $person);
            }
        }

        $area = $filters['bereich'];

        if ($area === 'sonstiges') {
            $query->whereNotIn('description', AuditDescriber::knownEvents());
        } elseif ($area !== null) {
            $query->whereIn('description', AuditDescriber::eventsIn($area));
        }

        if ($filters['von'] !== null) {
            $query->where('created_at', '>=', self::startOfDay($filters['von'], 'von'));
        }

        if ($filters['bis'] !== null) {
            // Up to the end of that day in Berlin: before the next day begins there.
            $query->where('created_at', '<', self::startOfDay($filters['bis'], 'bis', 1));
        }

        return $query;
    }

    /** Midnight in Berlin on that calendar day (plus `$days`), as the UTC instant the table stores. */
    private static function startOfDay(string $day, string $field, int $days = 0): string
    {
        $date = CarbonImmutable::createFromFormat('!Y-m-d', $day, GermanFormat::TIMEZONE);

        if (! $date instanceof CarbonImmutable) {
            throw ValidationException::withMessages([$field => 'Dieses Datum ist kein gültiger Tag.']);
        }

        return $date->addDays($days)->utc()->format('Y-m-d H:i:s');
    }

    /**
     * Everybody who appears in the log, once each: an account by its id, and an address kept on
     * entries that name no account by the address itself.
     *
     * @return list<array{value: string, label: string}>
     */
    private static function people(): array
    {
        $morph = (new AdminUser)->getMorphClass();

        $rows = DB::table('audit_logs')
            ->select(['causer_type', 'causer_id', 'actor_email'])
            ->distinct()
            ->get();

        $ids = [];
        $addresses = [];

        foreach ($rows as $row) {
            if ($row->causer_type === $morph && is_numeric($row->causer_id)) {
                $ids[(int) $row->causer_id] = true;
            } elseif (is_string($row->actor_email) && $row->actor_email !== '') {
                $addresses[$row->actor_email] = true;
            }
        }

        $accounts = $ids === [] ? collect() : DB::table('admin_users')
            ->whereIn('id', array_keys($ids))
            ->get(['id', 'name', 'email']);

        $options = [];
        /** @var array<string, string> $emails value => address, for telling two people with one name apart */
        $emails = [];

        foreach ($accounts as $account) {
            $email = (string) $account->email;
            $name = (string) $account->name;
            $options[] = ['value' => (string) $account->id, 'label' => $name !== '' ? $name : $email];
            $emails[(string) $account->id] = $email;
        }

        $known = array_map('mb_strtolower', $emails);

        foreach (array_keys($addresses) as $address) {
            $address = (string) $address;

            if (! in_array(mb_strtolower($address), $known, true)) {
                $options[] = ['value' => $address, 'label' => $address];
            }
        }

        // Two people with one name are told apart by their address rather than shown twice alike.
        $labels = array_count_values(array_column($options, 'label'));

        foreach ($options as $i => $option) {
            if ($labels[$option['label']] > 1 && isset($emails[$option['value']])) {
                $options[$i]['label'] = $option['label'].' ('.$emails[$option['value']].')';
            }
        }

        usort($options, static fn (array $a, array $b): int => strcasecmp($a['label'], $b['label']));

        return $options;
    }

    /**
     * The names of the accounts behind a page of entries.
     *
     * @param  list<AuditLog>  $entries
     * @return array<int|string, mixed>
     */
    private static function names(array $entries): array
    {
        $morph = (new AdminUser)->getMorphClass();
        $ids = [];

        foreach ($entries as $entry) {
            if ($entry->causer_type === $morph && $entry->causer_id !== null) {
                $ids[] = (int) $entry->causer_id;
            }
        }

        return $ids === [] ? [] : DB::table('admin_users')->whereIn('id', array_unique($ids))->pluck('name', 'id')->all();
    }

    /**
     * The person an entry names: the account's name, else the address kept on the row, else nobody.
     *
     * @param  array<int|string, mixed>  $names
     */
    private static function person(AuditLog $entry, array $names): string
    {
        $name = $entry->causer_type === (new AdminUser)->getMorphClass() && $entry->causer_id !== null
            ? ($names[(int) $entry->causer_id] ?? null)
            : null;

        if (is_string($name) && $name !== '') {
            return $name;
        }

        return is_string($entry->actor_email) && $entry->actor_email !== '' ? $entry->actor_email : self::NOBODY;
    }

    /** `14:22 Uhr` — the time half of GermanFormat's own date and time, so both read alike. */
    private static function time(?DateTimeInterface $at): ?string
    {
        $full = GermanFormat::dateTime($at);

        return $full === null ? null : trim(Str::after($full, ', '));
    }

    /**
     * The filters as the export's audit entry keeps them: in the words the page showed, so the entry
     * still reads correctly after the person it named is renamed.
     *
     * @param  array{person: string|null, bereich: string|null, von: string|null, bis: string|null}  $filters
     * @return array<string, string>
     */
    private static function described(array $filters): array
    {
        $out = [];

        if ($filters['person'] !== null) {
            $name = ctype_digit($filters['person'])
                ? DB::table('admin_users')->where('id', (int) $filters['person'])->value('name')
                : null;
            $out['person'] = is_string($name) && $name !== '' ? $name : $filters['person'];
        }

        if ($filters['bereich'] !== null) {
            $out['bereich'] = AuditDescriber::AREAS[$filters['bereich']] ?? $filters['bereich'];
        }

        foreach (['von', 'bis'] as $key) {
            if ($filters[$key] !== null) {
                $out[$key] = $filters[$key];
            }
        }

        return $out;
    }

    /**
     * A path on this page with the filters in force and a page number, as a relative link.
     *
     * @param  array{person: string|null, bereich: string|null, von: string|null, bis: string|null, reihenfolge?: string|null}  $filters
     */
    private static function url(string $path, array $filters, int $page): string
    {
        $query = array_filter($filters, static fn (?string $v): bool => $v !== null);

        if ($page > 1) {
            $query['seite'] = $page;
        }

        return $query === [] ? $path : $path.'?'.http_build_query($query);
    }

    /**
     * One CSV line. A cell a spreadsheet would read as a formula is defused with a leading
     * apostrophe: a role label is free text, and `=HYPERLINK(…)` must arrive as text.
     *
     * @param  resource  $out
     * @param  list<string>  $cells
     */
    private static function row($out, array $cells): void
    {
        $safe = array_map(
            static fn (string $cell): string => $cell !== '' && in_array($cell[0], ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$cell : $cell,
            $cells,
        );

        fputcsv($out, $safe, ';', '"', '', "\r\n");
    }
}
