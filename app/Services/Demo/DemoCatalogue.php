<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Support\GermanFormat;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * The example catalogue (CatalogueSeeder, ApprovalSeeder) is demo, and it goes with the rest of the demo
 * set (the launch release §3). No third state is left behind — no hidden drafts for whoever loads the
 * real catalogue to trip over: the invented models with their finishes and sizes, the rows of the example
 * Gutachten on them, those Gutachten, the example tyres, the invented brands and their drawings.
 *
 * What marks it: a wheel model or a tyre born `is_demo`; a document by the issuer no real one has
 * (ApprovalSeeder::ISSUER) with no row on a real wheel; a brand of CatalogueSeeder::BRANDS that no real
 * model or tyre carries; a development car born `is_demo` (VehicleSeeder) — hidden, never removed (R-04).
 *
 * Refused — nothing removed — while something real still names it: a real Gutachten with rows on an
 * example wheel or a development car (R-05: compliance data never disappears as a side effect of tidying a
 * catalogue), a real document superseding an example one, or an order line not born demo on an example wheel or tyre (R-12:
 * its snapshot is never deleted, and without the wheel it would no longer read as demo). Checkout refuses
 * a demo line, so only a development database seeded with CommerceSeeder's orders can hold one.
 */
final class DemoCatalogue
{
    /** Child first: every table before the ones it references, so no delete leans on a cascade (R-05). */
    public const TABLES = [
        'fitment_conditions',
        'fitment_tyre_size_conditions',
        'fitment_tyre_sizes',
        'fitment_conflicts',
        'fitments',
        'document_condition_reworks',
        'document_conditions',
        'document_fasteners',
        'document_notices',
        'approval_documents',
        'wheel_configs',
        'wheel_finishes',
        'wheel_models',
        'tyre_variants',
        'brands',
        'vehicles',
    ];

    /** How a table reads in the Protokoll's purge entry. */
    public const LABELS = [
        'fitment_conditions' => 'Auflagen an Zeilen der Beispiel-Gutachten',
        'fitment_tyre_size_conditions' => 'Auflagen an Reifengrößen der Beispiel-Gutachten',
        'fitment_tyre_sizes' => 'Reifengrößen an Zeilen der Beispiel-Gutachten',
        'fitment_conflicts' => 'Konflikte auf Beispielfelgen',
        'fitments' => 'Zeilen der Beispiel-Gutachten',
        'document_condition_reworks' => 'Maße der Nacharbeit in Beispiel-Gutachten',
        'document_conditions' => 'Auflagenverzeichnisse der Beispiel-Gutachten',
        'document_fasteners' => 'Befestigungsmittel der Beispiel-Gutachten',
        'document_notices' => 'Pflichthinweise der Beispiel-Gutachten',
        'approval_documents' => 'Beispiel-Gutachten',
        'wheel_configs' => 'Größen der Beispielfelgen',
        'wheel_finishes' => 'Farben der Beispielfelgen',
        'wheel_models' => 'Beispielfelgen',
        'tyre_variants' => 'Beispielreifen',
        'brands' => 'Erfundene Marken',
        'vehicles' => 'Entwicklungsfahrzeuge (ausgeblendet, nie gelöscht)',
    ];

    /** How many ids go into one `IN (…)` of a delete. */
    private const CHUNK = 1000;

    /**
     * The example catalogue's rows, per table.
     *
     * @return array<string, int>
     */
    public static function counts(): array
    {
        $counts = [];

        foreach (self::TABLES as $table) {
            $counts[$table] = self::rows($table)->count();
        }

        return $counts;
    }

    /**
     * Why the example catalogue cannot go now, one German sentence per reason; empty when it can.
     *
     * @return list<string>
     */
    public static function blockers(): array
    {
        $reasons = [];

        $lines = DB::table('order_lines')->where('is_demo', false)
            ->where(static fn (Builder $q) => $q
                ->whereIn('wheel_config_id', self::configs())
                ->orWhereIn('tyre_variant_id', self::tyres()))
            ->count();

        if ($lines > 0) {
            $reasons[] = ($lines === 1 ? 'Eine Bestellposition, die nicht als Demodaten angelegt wurde, nennt' : GermanFormat::integer($lines).' Bestellpositionen, die nicht als Demodaten angelegt wurden, nennen')
                .' eine Beispielfelge oder einen Beispielreifen. Ihr Prüfnachweis wird nie gelöscht – diese Datenbank wird neu aufgebaut (php artisan migrate:fresh --seed), statt den Beispielkatalog unter ihr wegzuziehen.';
        }

        $documents = DB::table('approval_documents as d')
            ->whereNotIn('d.id', self::documents())
            ->whereExists(static fn (Builder $q) => $q->selectRaw('1')->from('fitments as f')
                ->whereColumn('f.approval_document_id', 'd.id')
                ->whereIn('f.wheel_config_id', self::configs()))
            ->orderBy('d.id')
            ->get(['d.report_number', 'd.kba_number']);

        foreach ($documents as $document) {
            $reasons[] = 'Das Gutachten „'.self::documentName($document).'“ hat Zeilen auf Beispielfelgen. Entferne sie dort zuerst; ein echtes Gutachten verliert keine Zeile als Nebenwirkung.';
        }

        $successors = DB::table('approval_documents')
            ->whereIn('supersedes_id', self::documents())
            ->whereNotIn('id', self::documents())
            ->orderBy('id')
            ->get(['report_number', 'kba_number']);

        foreach ($successors as $document) {
            $reasons[] = 'Das Gutachten „'.self::documentName($document).'“ ersetzt ein Beispiel-Gutachten. Löse die Verknüpfung dort zuerst.';
        }

        // A row of a real Gutachten on a development car: the car would vanish from under it.
        $named = DB::table('approval_documents as d')
            ->whereNotIn('d.id', self::documents())
            ->whereExists(static fn (Builder $q) => $q->selectRaw('1')->from('fitments as f')
                ->whereColumn('f.approval_document_id', 'd.id')
                ->whereIn('f.vehicle_id', self::vehicles())
                ->whereNotIn('f.wheel_config_id', self::configs()))
            ->orderBy('d.id')
            ->get(['d.report_number', 'd.kba_number']);

        foreach ($named as $document) {
            $reasons[] = 'Das Gutachten „'.self::documentName($document).'“ hat Zeilen für Entwicklungsfahrzeuge. Entferne sie dort zuerst; ein echtes Gutachten verliert keine Zeile als Nebenwirkung.';
        }

        return $reasons;
    }

    /**
     * Removes the example catalogue, child first. Runs inside the caller's transaction; the caller has
     * checked blockers() and recorded the counts.
     */
    public static function purge(): void
    {
        // Named once, up front: MySQL refuses a delete whose subquery reads the table it deletes from,
        // and the documents are only recognisable while their rows still exist.
        $configs = self::rows('wheel_configs')->pluck('id')->all();
        $fitments = self::rows('fitments')->pluck('id')->all();
        $documents = self::rows('approval_documents')->pluck('id')->all();

        $sizes = self::rows('fitment_tyre_sizes')->pluck('id')->all();

        self::deleteIn('fitment_conditions', 'fitment_id', $fitments);
        self::deleteIn('fitment_tyre_size_conditions', 'fitment_tyre_size_id', $sizes);
        self::deleteIn('fitment_tyre_sizes', 'fitment_id', $fitments);
        self::deleteIn('fitment_conflicts', 'existing_fitment_id', $fitments);
        self::deleteIn('fitment_conflicts', 'candidate_fitment_id', $fitments);
        self::deleteIn('fitment_conflicts', 'wheel_config_id', $configs);
        self::deleteIn('fitments', 'id', $fitments);

        $conditions = DB::table('document_conditions')->whereIn('approval_document_id', $documents)->pluck('id')->all();
        self::deleteIn('document_condition_reworks', 'document_condition_id', $conditions);
        self::deleteIn('document_conditions', 'approval_document_id', $documents);
        self::deleteIn('document_fasteners', 'approval_document_id', $documents);
        self::deleteIn('document_notices', 'approval_document_id', $documents);

        // A chain among the example documents themselves: unlinked first, so no row is refused for
        // the one that replaces it.
        foreach (array_chunk($documents, self::CHUNK) as $chunk) {
            DB::table('approval_documents')->whereIn('id', $chunk)->whereNotNull('supersedes_id')->update(['supersedes_id' => null]);
        }

        self::deleteIn('approval_documents', 'id', $documents);

        self::deleteIn('wheel_configs', 'id', $configs);
        DB::table('wheel_finishes')->whereIn('wheel_model_id', self::models())->delete();
        DB::table('wheel_models')->where('is_demo', true)->delete();
        DB::table('tyre_variants')->where('is_demo', true)->delete();

        // After the models and tyres: now a brand of the list is invented and bare, or it stays.
        self::rows('brands')->delete();

        // The development cars are hidden, never removed (R-04): an order or an Anfrage that named one
        // still reads, and the next development seed brings them back.
        self::rows('vehicles')->update(['deleted_at' => now(), 'updated_at' => now()]);
    }

    /**
     * The placeholder drawings, once no finish shows one any more. Files, so after the transaction has
     * committed: a rolled-back purge keeps its pictures.
     */
    public static function forgetDrawings(): void
    {
        $shown = DB::table('wheel_finishes')->where('image_manifest', 'like', '%'.DemoPlaceholders::publicBase().'/%')->exists();

        if (! $shown && File::isDirectory(DemoPlaceholders::dir())) {
            File::deleteDirectory(DemoPlaceholders::dir());
        }
    }

    /** The rows of one table that belong to the example catalogue. */
    private static function rows(string $table): Builder
    {
        return match ($table) {
            'fitment_conditions', 'fitment_tyre_sizes' => DB::table($table)->whereIn('fitment_id', self::fitments()),
            'fitment_conflicts' => DB::table($table)->where(static fn (Builder $q) => $q
                ->whereIn('wheel_config_id', self::configs())
                ->orWhereIn('existing_fitment_id', self::fitments())
                ->orWhereIn('candidate_fitment_id', self::fitments())),
            'fitments' => DB::table($table)->whereIn('wheel_config_id', self::configs()),
            'fitment_tyre_size_conditions' => DB::table($table)->whereIn('fitment_tyre_size_id', DB::table('fitment_tyre_sizes')->whereIn('fitment_id', self::fitments())->select('id')),
            'document_condition_reworks' => DB::table($table)->whereIn('document_condition_id', DB::table('document_conditions')->whereIn('approval_document_id', self::documents())->select('id')),
            'document_conditions', 'document_fasteners', 'document_notices' => DB::table($table)->whereIn('approval_document_id', self::documents()),
            'approval_documents' => DB::table($table)->whereIn('id', self::documents()),
            'wheel_configs', 'wheel_finishes' => DB::table($table)->whereIn('wheel_model_id', self::models()),
            'wheel_models', 'tyre_variants' => DB::table($table)->where('is_demo', true),
            'brands' => DB::table($table)->whereIn('name', CatalogueSeeder::BRANDS)
                ->whereNotExists(static fn (Builder $q) => $q->selectRaw('1')->from('wheel_models as m')
                    ->whereColumn('m.brand_id', 'brands.id')->where('m.is_demo', false))
                ->whereNotExists(static fn (Builder $q) => $q->selectRaw('1')->from('tyre_variants as t')
                    ->whereColumn('t.brand_id', 'brands.id')->where('t.is_demo', false)),
            // Hidden cars are gone from every reader; only the ones still shown are counted.
            'vehicles' => DB::table($table)->where('is_demo', true)->whereNull('deleted_at'),
            default => throw new \InvalidArgumentException("{$table} is not part of the example catalogue."),
        };
    }

    private static function models(): Builder
    {
        return DB::table('wheel_models')->select('id')->where('is_demo', true);
    }

    private static function configs(): Builder
    {
        return DB::table('wheel_configs')->select('id')->whereIn('wheel_model_id', self::models());
    }

    private static function fitments(): Builder
    {
        return DB::table('fitments')->select('id')->whereIn('wheel_config_id', self::configs());
    }

    private static function tyres(): Builder
    {
        return DB::table('tyre_variants')->select('id')->where('is_demo', true);
    }

    private static function vehicles(): Builder
    {
        return DB::table('vehicles')->select('id')->where('is_demo', true);
    }

    /** The example documents: the invented issuer, and not one row on a real wheel. */
    private static function documents(): Builder
    {
        return DB::table('approval_documents as ed')->select('ed.id')
            ->where('ed.issuer', ApprovalSeeder::ISSUER)
            ->whereNotExists(static fn (Builder $q) => $q->selectRaw('1')->from('fitments as ef')
                ->whereColumn('ef.approval_document_id', 'ed.id')
                ->whereNotIn('ef.wheel_config_id', self::configs()));
    }

    /** @param  list<int|string>  $ids */
    private static function deleteIn(string $table, string $column, array $ids): void
    {
        foreach (array_chunk($ids, self::CHUNK) as $chunk) {
            DB::table($table)->whereIn($column, $chunk)->delete();
        }
    }

    private static function documentName(object $document): string
    {
        return (string) ($document->report_number ?? $document->kba_number ?? 'ohne Nummer');
    }
}
