<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Enums\ConflictStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Fitment;
use App\Services\Admin\AdminNavigation;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The KPI row for the roles that do not sell (Variant): Katalog, Gutachten, Support — each four
 * figures of what that role opens the admin for, every one a real query, every one saying in a
 * sentence when there is nothing to count.
 *
 * @phpstan-import-type Tile from SalesFigures
 */
final class RoleFigures
{
    /** What a Felge in the shop cannot do without — a missing one is a gap in the catalogue. */
    private const REQUIRED = [
        'price_cents' => 'Preis',
        'image' => 'Foto',
        'weight_g' => 'Gewicht',
        'max_load_kg' => 'Traglast',
    ];

    public function __construct(private readonly Demand $demand) {}

    /**
     * Katalog: what is in stock, what cannot be sold, and what is missing.
     *
     * @return list<Tile>
     */
    public function catalogue(): array
    {
        $inShop = $this->inShop();
        $units = (int) (clone $inShop)->sum('wc.stock_qty');
        $variants = (clone $inShop)->count();
        $soldOut = (clone $inShop)->where('wc.stock_qty', 0)->count();
        $unapproved = (clone $inShop)
            ->whereNotIn('wc.id', Fitment::query()->visibleToCustomers()->select('fitments.wheel_config_id')->toBase())
            ->count();
        $incomplete = $this->incompleteQuery()->count();

        return [
            self::state('bestand', 'Felgen auf Lager', 'Stück aller Ausführungen, die im Shop stehen — Stand jetzt.',
                $units, 'Keine Felge auf Lager.', null,
                $variants > 0 ? 'in '.GermanFormat::integer($variants).($variants === 1 ? ' Ausführung' : ' Ausführungen') : null),
            self::state('ausverkauft', 'Nicht auf Lager', 'Ausführungen im Shop, von denen kein Stück auf Lager ist.',
                $soldOut, 'Jede Ausführung im Shop ist auf Lager.', null),
            self::state('ohne-freigabe', 'Ohne Freigabe', 'Diese Ausführungen kann der Shop keinem Auto zeigen: Kein veröffentlichtes Gutachten nennt sie.',
                $unapproved, 'Jede Ausführung im Shop hat mindestens eine Freigabe.', null),
            self::state('unvollstaendig', 'Unvollständige Daten', 'Ausführungen im Shop ohne Preis, Foto, Gewicht oder Traglast.',
                $incomplete, 'Bei jeder Ausführung sind Preis, Foto, Gewicht und Traglast gepflegt.', null),
        ];
    }

    /**
     * The Felgen with the most missing, for the „Datenqualität“ list beside the to-dos.
     *
     * @return list<array{key: string, title: string, detail: string, missing: list<string>}>
     */
    public function incomplete(int $limit = 8): array
    {
        $rows = $this->incompleteQuery()
            ->join('brands as b', 'b.id', '=', 'wm.brand_id')
            ->orderBy('b.name')
            ->orderBy('wm.name')
            ->orderBy('wc.diameter_in')
            ->get(['wc.id', 'b.name as brand', 'wm.name as model', 'wf.name_de as finish', 'wc.width_in', 'wc.diameter_in', 'wc.et_mm',
                'wc.price_cents', 'wc.weight_g', 'wc.max_load_kg', 'wf.image_manifest']);

        $list = [];

        foreach ($rows as $row) {
            $missing = [];

            foreach (self::REQUIRED as $column => $label) {
                $value = $column === 'image' ? $row->image_manifest : $row->{$column};

                if ($value === null || ($column === 'price_cents' && (int) $value === 0)) {
                    $missing[] = $label;
                }
            }

            $list[] = [
                'key' => 'wc-'.(int) $row->id,
                'title' => "{$row->brand} {$row->model}",
                'detail' => GermanFormat::wheelSize((string) $row->width_in, (string) $row->diameter_in, (int) $row->et_mm).($row->finish ? ' '.GermanFormat::MIDDOT.' '.$row->finish : ''),
                'missing' => $missing,
            ];
        }

        // The most incomplete first: one missing price is a lost sale, four missing facts a row nobody finished.
        usort($list, static fn (array $a, array $b): int => count($b['missing']) <=> count($a['missing']));

        return array_slice($list, 0, $limit);
    }

    /**
     * Gutachten: what is published, what contradicts itself, what customers ask for that is missing,
     * and the vehicles no verdict can be given for.
     *
     * @return list<Tile>
     */
    public function compliance(AdminUser $admin, Period $period): array
    {
        $gaps = $this->demand->ranked($period, 'offen', null, 0)['counts']['offen'];

        $tiles = [
            self::state('documents', 'Veröffentlichte Gutachten', 'Gutachten, nach denen der Shop gerade Felgen zeigt. Entwürfe zählen nicht mit.',
                DB::table('approval_documents')->where('status', 'published')->count(), 'Noch kein Gutachten veröffentlicht.', '/admin/gutachten'),
            self::state('conflicts', 'Offene Konflikte', 'Zwei Gutachten sagen über dieselbe Felge am selben Fahrzeug Verschiedenes.',
                DB::table('fitment_conflicts')->where('status', ConflictStatus::Open->value)->count(), 'Kein offener Konflikt.', '/admin/konflikte'),
            [
                ...self::state('nachfrage', 'Nachfrage-Lücken', 'Autos, nach denen im Zeitraum gefragt wurde und für die der Shop keine Felge zeigen kann — die offenen, nicht die schon beobachteten oder angeforderten.',
                    $gaps, 'Im Zeitraum fragte niemand nach einem Auto ohne Freigabe.', '/admin/nachfrage'),
                'note' => $period->label(),
            ],
        ];

        $tiles[] = $admin->may(PermissionModule::Vehicles, PermissionAction::View)
            // A vehicle the importer could not characterise can never produce a positive verdict, so
            // this figure is the queue that turns silence back into sales (R-03).
            ? self::state('review', 'Fahrzeuge zur Prüfung', 'Ohne lesbare Achslast oder Höchstgeschwindigkeit. Für sie zeigt der Shop keine Felgen.',
                DB::table('vehicles')->whereNull('deleted_at')->where('needs_review', true)->count(), 'Kein Fahrzeug wartet auf Prüfung.', '/admin/fahrzeuge/pruefung')
            : self::state('fitments', 'Veröffentlichte Freigaben', 'Eine Freigabe ist eine Zeile eines Gutachtens: diese Felge an diesem Fahrzeug.',
                DB::table('fitments')->where('status', 'published')->count(), 'Noch keine Freigabe veröffentlicht.', '/admin/abdeckung');

        return $tiles;
    }

    /**
     * Support: the customers waiting for a message and the ones who asked in the period. The order
     * figures beside them come from SalesFigures, without money.
     *
     * @return list<Tile>
     */
    public function support(Period $period, bool $compare): array
    {
        $waiting = DB::table('fitment_subscriptions')->whereNotNull('confirmed_at')->whereNull('unsubscribed_at')->whereNull('notified_at')->count();

        $current = $this->askedPerDay($period);
        $asked = array_sum($current);
        $previous = $compare ? array_sum($this->askedPerDay($period->previous())) : null;
        $delta = $asked > 0 ? SalesFigures::delta($asked, $previous) : null;

        return [
            self::state('wartend', 'Warten auf Nachricht', 'Bestätigte „Sag mir Bescheid“-Anfragen, denen noch niemand geschrieben hat — Stand jetzt.',
                $waiting, 'Niemand wartet auf eine Nachricht.', '/admin/anfragen'),
            [
                'key' => 'anfragen',
                'label' => 'Neue Anfragen',
                'hint' => '„Sag mir Bescheid“-Anfragen, die im Zeitraum eingegangen sind, bestätigt oder nicht.',
                'value' => $asked > 0 ? GermanFormat::integer($asked) : null,
                'empty' => $asked > 0 ? null : 'Im Zeitraum kam keine Anfrage.',
                'delta' => $delta,
                'deltaNote' => $compare && $asked > 0 && $delta === null ? 'Vorperiode ohne Anfragen' : null,
                'series' => $asked > 0 ? SalesFigures::fold($current, $period->days() > 31 ? 7 : 1) : [],
                'note' => null,
                'href' => self::built('/admin/anfragen'),
            ],
        ];
    }

    /** Configurations of published models: the Felgen the shop has on offer. */
    private function inShop(): Builder
    {
        return DB::table('wheel_configs as wc')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->where('wm.status', 'published')
            ->whereNull('wm.deleted_at');
    }

    private function incompleteQuery(): Builder
    {
        return $this->inShop()
            ->leftJoin('wheel_finishes as wf', 'wf.id', '=', 'wc.wheel_finish_id')
            ->where(static fn (Builder $q) => $q
                ->whereNull('wc.price_cents')->orWhere('wc.price_cents', 0)
                ->orWhereNull('wf.image_manifest')
                ->orWhereNull('wc.weight_g')
                ->orWhereNull('wc.max_load_kg'));
    }

    /** @return list<int> */
    private function askedPerDay(Period $period): array
    {
        $days = array_fill_keys($period->dayKeys(), 0);

        $rows = DB::table('fitment_subscriptions')
            ->where('created_at', '>=', $period->startUtc())
            ->where('created_at', '<', $period->endUtc())
            ->pluck('created_at');

        foreach ($rows as $at) {
            $day = CarbonImmutable::parse((string) $at, 'UTC')->setTimezone(GermanFormat::TIMEZONE)->format('Y-m-d');

            if (isset($days[$day])) {
                $days[$day]++;
            }
        }

        return array_values($days);
    }

    /** @return Tile */
    private static function state(string $key, string $label, string $hint, int $count, string $empty, ?string $list, ?string $note = null): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'hint' => $hint,
            'value' => $count > 0 ? GermanFormat::integer($count) : null,
            'empty' => $count > 0 ? null : $empty,
            'delta' => null,
            'deltaNote' => null,
            'series' => [],
            'note' => $note ?? 'Stand jetzt',
            'href' => $list === null ? null : self::built($list),
        ];
    }

    /** A tile links to its list once that list exists — never to a page that is not there. */
    private static function built(string $href): ?string
    {
        $path = (string) parse_url($href, PHP_URL_PATH);

        return in_array($path, AdminNavigation::BUILT, true) || $path === '/admin/nachfrage' ? $href : null;
    }
}
