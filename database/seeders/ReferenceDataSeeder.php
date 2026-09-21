<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Enums\ConditionSeverity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The reference data every verdict depends on.
 *
 * The load-index and speed-symbol rows come from ReferenceTables — the one place those figures
 * are written down — so the seed and the test oracle cannot drift apart. The condition-code
 * catalogue is the starter set from the spec; the wording is content and the Compliance
 * Editor may change it in the panel without a deployment.
 */
class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedLoadIndexTable();
        $this->seedSpeedSymbolTable();
        $this->seedConditionCodes();
    }

    private function seedLoadIndexTable(): void
    {
        $rows = [];

        foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
            $rows[] = ['load_index' => $index, 'capacity_kg' => $capacity];
        }

        DB::table('load_index_table')->upsert($rows, ['load_index'], ['capacity_kg']);
    }

    private function seedSpeedSymbolTable(): void
    {
        $rows = [];

        // The reference table calls it `rank`; the column is `speed_rank`, because `rank` is a
        // reserved word in MySQL 8 and an unquoted one would be a syntax error.
        foreach (ReferenceTables::SPEED_SYMBOLS as $symbol) {
            $rows[] = [
                'symbol' => $symbol['symbol'],
                'speed_rank' => $symbol['rank'],
                'max_kmh' => $symbol['max_kmh'],
            ];
        }

        DB::table('speed_symbol_table')->upsert($rows, ['symbol'], ['speed_rank', 'max_kmh']);
    }

    /**
     * The starter catalogue. Codes are stable internal keys — never the `A02` a particular
     * manufacturer prints, which `condition_code_aliases` maps onto these.
     */
    private function seedConditionCodes(): void
    {
        $now = now();
        $rows = [];
        $sort = 0;

        foreach (self::CONDITION_CODES as $code => [$severity, $textDe, $tyreChoice, $purchase]) {
            $rows[] = [
                'code' => $code,
                'severity' => $severity->value,
                'text_de' => $textDe,
                'text_en' => null,
                'affects_tyre_choice' => $tyreChoice,
                'affects_purchase' => $purchase,
                'requires_acknowledgement' => $severity->requiresAcknowledgement(),
                'sort_order' => $sort += 10,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('condition_codes')->upsert(
            $rows,
            ['code'],
            ['severity', 'affects_tyre_choice', 'affects_purchase', 'requires_acknowledgement', 'sort_order', 'updated_at'],
        );
    }

    /**
     * Internal key => [severity, German sentence, affects tyre choice, affects purchase].
     *
     * `text_de` is deliberately NOT in the upsert's update list: the Compliance Editor owns the
     * wording once it has been edited, and a re-seed must not overwrite their work.
     *
     * @var array<string, array{0: ConditionSeverity, 1: string, 2: bool, 3: bool}>
     */
    private const CONDITION_CODES = [
        'ENTRY_REQUIRED' => [
            ConditionSeverity::Action,
            'Eintragung in die Fahrzeugpapiere erforderlich.',
            false, true,
        ],
        'NO_ENTRY_REQUIRED' => [
            ConditionSeverity::Info,
            'Keine Eintragung erforderlich.',
            false, false,
        ],
        'ARCH_ROLLING' => [
            ConditionSeverity::Workshop,
            'Bördeln der Radläufe erforderlich.',
            false, true,
        ],
        'ARCH_TRIM' => [
            ConditionSeverity::Workshop,
            'Anpassung der Radlaufkante erforderlich.',
            false, true,
        ],
        'SPECIFIC_BOLTS' => [
            ConditionSeverity::Action,
            'Nur mit den angegebenen Radschrauben zulässig.',
            false, true,
        ],
        'CENTRING_RING' => [
            ConditionSeverity::Action,
            'Zentrierring erforderlich.',
            false, true,
        ],
        'TYRE_BRAND_LIMIT' => [
            ConditionSeverity::Restriction,
            'Nur mit Reifen der angegebenen Hersteller zulässig.',
            true, true,
        ],
        'NO_SNOW_CHAINS' => [
            ConditionSeverity::Restriction,
            'Verwendung von Schneeketten nicht zulässig.',
            false, true,
        ],
        'FRONT_AXLE_ONLY' => [
            ConditionSeverity::Restriction,
            'Nur für die Vorderachse zulässig.',
            false, true,
        ],
        'REAR_AXLE_ONLY' => [
            ConditionSeverity::Restriction,
            'Nur für die Hinterachse zulässig.',
            false, true,
        ],
        'TYRE_SIZE_NOTE' => [
            ConditionSeverity::Info,
            'Hinweis zur Reifengröße beachten.',
            false, false,
        ],
        'SPEED_STICKER' => [
            ConditionSeverity::Action,
            'Geschwindigkeitsaufkleber im Sichtfeld des Fahrers erforderlich.',
            false, true,
        ],
    ];
}
