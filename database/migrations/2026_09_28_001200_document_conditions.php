<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Auflagen belong to the document that prints them (the corrections memo §1, the Borbet brief §2.2).
 *
 * ABE 55255 uses `A01 A12 … Cpe T88`, Gutachten 366-0350-21-WIRD/N1 uses `11A 21B … YDM BDC` — no overlap,
 * no shared meaning, and nothing stops a third document from printing `A01` for something else. A global
 * catalogue keyed on the code would one day print one document's sentence under another document's wheel.
 *
 * So:
 *   - `document_conditions` is each document's own Auflagenverzeichnis: code as printed, the kind a person
 *     chose (ConditionKind), the full sentence (R-15), its page, and the parameter a kind needs — unique on
 *     (document, code), the code compared exactly as printed (`K1c` is not `K1C`);
 *   - `fitment_conditions` holds a row's codes **as printed**. The engine reads a code's sentence by joining
 *     the row's own document on the code — it cannot reach another document's list — and a code its document
 *     does not define is unresolved: the verdict is UNKNOWN and the Freigabe refused (fails closed).
 *
 * The global catalogue is moved into the documents that used it: for every document, each code its rows
 * carry becomes a row of its list, under the code that document printed (`condition_code_aliases`) or the
 * internal key otherwise, with the global sentence and a kind never lighter than what the code did before.
 * Then `condition_code_aliases` and `condition_codes` go.
 */
return new class extends Migration
{
    /** The starter keys, by what they asked of the customer. */
    private const KIND_OF = [
        'ENTRY_REQUIRED' => 'abnahme',
        'NO_ENTRY_REQUIRED' => 'hinweis',
        'ARCH_ROLLING' => 'karosseriearbeit',
        'ARCH_TRIM' => 'karosseriearbeit',
        'SPECIFIC_BOLTS' => 'befestigung',
        'CENTRING_RING' => 'befestigung',
        'TYRE_BRAND_LIMIT' => 'verbot',
        'NO_SNOW_CHAINS' => 'verbot',
        'FRONT_AXLE_ONLY' => 'reifen_achse',
        'REAR_AXLE_ONLY' => 'reifen_achse',
        'TYRE_SIZE_NOTE' => 'hinweis',
        'SPEED_STICKER' => 'tacho',
    ];

    /**
     * The starter keys were internal names (`ENTRY_REQUIRED`), never what a document printed. Where a
     * document named no code of its own for one, it gets a short code of the kind the documents use — the
     * same the demo seeder writes — so no internal key stands in a list as if printed.
     */
    private const SHORT = [
        'ENTRY_REQUIRED' => 'A01',
        'NO_ENTRY_REQUIRED' => 'A02',
        'ARCH_ROLLING' => 'K1',
        'ARCH_TRIM' => 'K2',
        'SPECIFIC_BOLTS' => 'S01',
        'CENTRING_RING' => 'S02',
        'TYRE_BRAND_LIMIT' => 'R01',
        'NO_SNOW_CHAINS' => 'A12',
        'FRONT_AXLE_ONLY' => 'R02',
        'REAR_AXLE_ONLY' => 'R03',
        'TYRE_SIZE_NOTE' => 'H01',
        'SPEED_STICKER' => 'G01',
    ];

    /** A code the team added itself: its kind by its severity, never lighter (an ACTION code becomes a Verbot, not a Hinweis). */
    private const KIND_OF_SEVERITY = [
        'INFO' => 'hinweis',
        'ACTION' => 'verbot',
        'WORKSHOP' => 'karosseriearbeit',
        'RESTRICTION' => 'verbot',
    ];

    public function up(): void
    {
        Schema::create('document_conditions', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as the document prints it');
            $t->string('kind', 24);
            $t->text('text_de')->comment('the full sentence, as the customer reads it (R-15)');
            $t->unsignedSmallInteger('source_page')->nullable();
            // The parameter a kind needs, entered by a person from the document — never parsed from the sentence.
            $t->json('body_forms')->nullable()->comment('karosserieform: the body styles permitted');
            $t->json('drive')->nullable()->comment('antrieb: {"mode": "only"|"not", "drive": "Allrad"|…}');
            $t->unsignedSmallInteger('max_axle_load_kg')->nullable()->comment('reifen_tragfaehigkeit');
            $t->string('axle', 8)->nullable()->comment('reifen_achse: FRONT or REAR');
            $t->timestamps();

            $t->unique(['approval_document_id', 'code'], 'uq_document_condition_code');
        });

        Constraints::enum('document_conditions', 'kind', ConditionKind::values());
        Constraints::add('document_conditions', 'chk_document_condition_text', "TRIM(`text_de`) <> ''");
        Constraints::add('document_conditions', 'chk_document_condition_axle', "`axle` IS NULL OR `axle` IN ('FRONT', 'REAR')");

        Schema::create('fitment_condition_codes', function (Blueprint $t): void {
            $t->foreignId('fitment_id')->constrained('fitments')->cascadeOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as printed; resolved against the row\'s own document');
            $t->text('note_de')->nullable()->comment('document-specific qualifier');
            $t->timestamps();

            $t->primary(['fitment_id', 'code']);
        });

        $now = now();
        $uses = DB::table('fitment_conditions as fc')
            ->join('fitments as f', 'f.id', '=', 'fc.fitment_id')
            ->join('condition_codes as c', 'c.id', '=', 'fc.condition_code_id')
            ->leftJoin('condition_code_aliases as a', static fn ($j) => $j->on('a.condition_code_id', '=', 'c.id')->on('a.approval_document_id', '=', 'f.approval_document_id'))
            ->orderBy('fc.fitment_id')
            ->get(['fc.fitment_id', 'fc.note_de', 'fc.created_at', 'f.approval_document_id', 'c.code', 'c.severity', 'c.text_de', 'a.printed_code']);

        $defined = [];

        foreach ($uses as $use) {
            $printed = is_string($use->printed_code) && $use->printed_code !== '' ? $use->printed_code : (self::SHORT[$use->code] ?? (string) $use->code);
            $key = $use->approval_document_id.'|'.$printed;

            if (! isset($defined[$key])) {
                $kind = self::KIND_OF[$use->code] ?? self::KIND_OF_SEVERITY[$use->severity] ?? 'verbot';

                DB::table('document_conditions')->insert([
                    'approval_document_id' => $use->approval_document_id,
                    'code' => $printed,
                    'kind' => $kind,
                    'text_de' => (string) $use->text_de,
                    'axle' => match ($use->code) {
                        'FRONT_AXLE_ONLY' => 'FRONT',
                        'REAR_AXLE_ONLY' => 'REAR',
                        default => null,
                    },
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $defined[$key] = true;
            }

            DB::table('fitment_condition_codes')->insertOrIgnore([
                'fitment_id' => $use->fitment_id,
                'code' => $printed,
                'note_de' => $use->note_de,
                'created_at' => $use->created_at ?? $now,
                'updated_at' => $now,
            ]);
        }

        Schema::drop('fitment_conditions');
        Schema::rename('fitment_condition_codes', 'fitment_conditions');
        Schema::drop('condition_code_aliases');
        Schema::drop('condition_codes');
    }

    public function down(): void
    {
        // The global catalogue comes back holding every code a document defined, once per code.
        Schema::create('condition_codes', function (Blueprint $t): void {
            $t->id();
            $t->string('code', 64)->unique();
            $t->string('severity', 16);
            $t->text('text_de');
            $t->text('text_en')->nullable();
            $t->boolean('affects_tyre_choice')->default(false);
            $t->boolean('affects_purchase')->default(false);
            $t->boolean('requires_acknowledgement')->default(false);
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->timestamps();
            $t->index('severity', 'idx_condition_severity');
        });

        Schema::create('condition_code_aliases', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('condition_code_id')->constrained('condition_codes')->cascadeOnDelete();
            $t->foreignId('approval_document_id')->nullable()->constrained('approval_documents')->cascadeOnDelete();
            $t->string('printed_code', 64);
            $t->string('issuer')->nullable();
            $t->timestamps();
            $t->unique(['approval_document_id', 'printed_code'], 'uq_alias_document_code');
            $t->index('printed_code', 'idx_alias_printed');
        });

        Schema::create('fitment_conditions_old', function (Blueprint $t): void {
            $t->foreignId('fitment_id')->constrained('fitments')->cascadeOnDelete();
            $t->foreignId('condition_code_id')->constrained('condition_codes')->restrictOnDelete();
            $t->text('note_de')->nullable();
            $t->timestamps();
            $t->primary(['fitment_id', 'condition_code_id']);
            $t->index('condition_code_id', 'idx_fitment_condition_code');
        });

        $now = now();
        $ids = [];

        foreach (DB::table('document_conditions')->orderBy('id')->get() as $condition) {
            $kind = ConditionKind::from($condition->kind);
            $ids[$condition->code] ??= DB::table('condition_codes')->insertGetId([
                'code' => $condition->code,
                'severity' => $kind->severity()->value,
                'text_de' => $condition->text_de,
                'affects_tyre_choice' => $kind->affectsTyreChoice(),
                'affects_purchase' => $kind->severity()->affectsPurchaseByDefault(),
                'requires_acknowledgement' => $kind->severity()->requiresAcknowledgement(),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        foreach (DB::table('fitment_conditions')->get() as $row) {
            if (isset($ids[$row->code])) {
                DB::table('fitment_conditions_old')->insertOrIgnore([
                    'fitment_id' => $row->fitment_id,
                    'condition_code_id' => $ids[$row->code],
                    'note_de' => $row->note_de,
                    'created_at' => $row->created_at,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::drop('fitment_conditions');
        Schema::rename('fitment_conditions_old', 'fitment_conditions');
        Schema::drop('document_conditions');
    }
};
