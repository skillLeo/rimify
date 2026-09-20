<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ApprovalKind;
use App\Enums\Axle;
use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\ConditionCode;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Five approval documents, and the fitment rows that hang off them.
 *
 * The fitment row is the primary object in this database: compatibility is a relationship between
 * a vehicle, a wheel configuration and the document that permits it, never an attribute of the
 * wheel. Everything the customer sees about fitment is read from these rows.
 *
 * The fifth document disagrees with the first, on purpose. It claims a BORBET Havanna fitment that
 * the first document permits freely requires entry in the vehicle papers — the one disagreement
 * the system treats as a hard block, because there is no safe way to average "you need a TÜV
 * appointment" with "you do not". It is seeded as a DRAFT row plus an open, blocking conflict, so
 * the storefront is unaffected and the admin panel has a genuine unresolved conflict on day one.
 */
class ApprovalSeeder extends Seeder
{
    /**
     * Which wheel brands each document covers.
     *
     * One report per manufacturer range, which is how approvals are actually commissioned — never
     * one report per car. The conflicting document re-states a single BORBET fitment and nothing
     * else, so the admin's conflict queue opens on one clear disagreement.
     *
     * @var array<string, list<string>>
     */
    private const COVERAGE = [
        'borbet' => ['BORBET'],
        'oz' => ['OZ RACING', 'ALUTEC'],
        'bbs' => ['BBS'],
        'yido' => ['YIDO', 'rotiform'],
        'conflicting' => ['BORBET'],
    ];

    public function run(): void
    {
        // Guarded on the data rather than on `callOnce`, which Laravel tracks in a process-static
        // array and which therefore lies to the second test of a RefreshDatabase run.
        if (WheelConfig::query()->doesntExist()) {
            $this->call(CatalogueSeeder::class);
        }

        if (Vehicle::query()->doesntExist()) {
            $this->call(VehicleSeeder::class);
        }

        $documents = $this->seedDocuments();

        // R-03: a vehicle whose axle loads or top speed we could not parse never appears in a
        // listing as permitted, so it gets no fitment rows here either.
        $vehicles = Vehicle::query()
            ->where('needs_review', false)
            ->whereNotNull('axle_load_front_kg')
            ->whereNotNull('axle_load_rear_kg')
            ->whereNotNull('max_speed_kmh')
            ->orderBy('id')
            ->get();

        foreach ($documents as $slot => $document) {
            $this->seedFitments($document, $vehicles, $slot);
        }

        $this->seedConflict($documents['conflicting'], $documents['borbet']);
    }

    /**
     * @return array{
     *     borbet: ApprovalDocument,
     *     oz: ApprovalDocument,
     *     bbs: ApprovalDocument,
     *     yido: ApprovalDocument,
     *     conflicting: ApprovalDocument
     * }
     */
    private function seedDocuments(): array
    {
        $issued = now()->subMonths(8)->toDateString();

        return [
            'borbet' => $this->document(
                'TG-2026-0001',
                ApprovalKind::Teilegutachten,
                'TÜV Rheinland',
                $issued,
                null,
                14,
            ),
            'oz' => $this->document(
                'TG-2026-0002',
                ApprovalKind::Teilegutachten,
                'DEKRA',
                $issued,
                null,
                18,
            ),
            // An ABE carries a KBA number and is the document customers most want to see,
            // because it is the one that usually means no entry in the papers.
            'bbs' => $this->document(
                'ABE-46120',
                ApprovalKind::Abe,
                'Kraftfahrt-Bundesamt',
                now()->subMonths(14)->toDateString(),
                '46120',
                9,
            ),
            'yido' => $this->document(
                'TG-2026-0004',
                ApprovalKind::Teilegutachten,
                'TÜV SÜD',
                now()->subMonths(3)->toDateString(),
                null,
                11,
            ),
            'conflicting' => $this->document(
                'TG-2026-0005',
                ApprovalKind::Teilegutachten,
                'DEKRA',
                now()->subMonths(1)->toDateString(),
                null,
                7,
            ),
        ];
    }

    private function document(
        string $reportNumber,
        ApprovalKind $kind,
        string $issuer,
        string $issuedOn,
        ?string $kbaNumber,
        int $pageCount,
    ): ApprovalDocument {
        return ApprovalDocument::updateOrCreate(
            ['report_number' => $reportNumber],
            [
                'kind' => $kind->value,
                'kba_number' => $kbaNumber,
                'issuer' => $issuer,
                'issued_on' => $issuedOn,
                'revision' => 1,
                'valid_from' => $issuedOn,
                // NULL means still valid. Never today's date — that would expire every current
                // document the moment the clock ticked past midnight (R-02).
                'valid_to' => null,
                'pdf_key' => sprintf('gutachten/%s.pdf', strtolower($reportNumber)),
                'pdf_sha256' => hash('sha256', $reportNumber),
                'page_count' => $pageCount,
                'status' => DocumentStatus::Published->value,
            ],
        );
    }

    /**
     * Each document covers the wheels of one or two brands, which is how approvals actually work:
     * a manufacturer commissions one report covering its own range, not a report per car.
     *
     * @param  Collection<int, Vehicle>  $vehicles
     */
    private function seedFitments(ApprovalDocument $document, Collection $vehicles, string $slot): void
    {
        $brands = self::COVERAGE[$slot] ?? [];

        if ($brands === []) {
            return;
        }

        $configs = WheelConfig::query()
            ->whereIn(
                'wheel_model_id',
                WheelModel::query()
                    ->whereIn('brand_id', fn ($q) => $q->select('id')->from('brands')->whereIn('name', $brands))
                    ->select('id'),
            )
            ->orderBy('id')
            ->get();

        if ($configs->isEmpty()) {
            return;
        }

        $draft = $slot === 'conflicting';
        $now = now();

        // Which rows this document already has, as one query. Written as a bulk insert rather than
        // a row-at-a-time `updateOrCreate` because the demo catalogue is around 1,500 fitments,
        // each with tyre sizes and conditions: per-row round trips turn a three-second seed into a
        // minute, and a slow seeder is a slow test suite for the rest of the project.
        $existing = $this->fitmentIds($document->id);

        $rows = [];
        /** @var array<string, array{entry: bool, offset: int, diameter: float}> $meta */
        $meta = [];

        foreach ($vehicles as $vehicleOffset => $vehicle) {
            // The conflicting document touches exactly one car, so the conflict queue has one
            // clear entry rather than fifteen copies of the same argument.
            if ($draft && $vehicleOffset !== 0) {
                break;
            }

            $slice = $draft
                ? $configs->take(1)
                : $configs->slice(($vehicleOffset * 3) % max(1, $configs->count()))->take(6);

            foreach ($slice as $configOffset => $config) {
                $key = $vehicle->id.':'.$config->id;

                // Roughly one in four fitments needs entry in the papers, which matches the real
                // mix closely enough that the `Ohne Eintragung` facet is worth having.
                $requiresEntry = $draft || ($configOffset % 4 === 0 && $slot !== 'bbs');

                $meta[$key] = [
                    'entry' => $requiresEntry,
                    'offset' => $configOffset,
                    'diameter' => (float) $config->diameter_in,
                ];

                if (isset($existing[$key])) {
                    continue;
                }

                $rows[] = [
                    'approval_document_id' => $document->id,
                    'vehicle_id' => $vehicle->id,
                    'wheel_config_id' => $config->id,
                    'axle' => Axle::All->value,
                    // NULL on both sides: the document does not narrow the vehicle's own build
                    // window, which is the common case.
                    'build_from' => null,
                    'build_to' => null,
                    'permitted_width_min' => 7.0,
                    'permitted_width_max' => 9.5,
                    'permitted_et_min' => 30,
                    'permitted_et_max' => 48,
                    'requires_entry' => $requiresEntry,
                    'entry_note_de' => $requiresEntry
                        ? 'Eintragung durch eine amtlich anerkannte Prüfstelle erforderlich.'
                        : null,
                    'source_page' => 3 + ($configOffset % 5),
                    'status' => $draft ? FitmentStatus::Draft->value : FitmentStatus::Published->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('fitments')->insert($chunk);
        }

        if ($meta === []) {
            return;
        }

        $ids = $this->fitmentIds($document->id);

        $this->seedTyreSizes($ids, $meta, $now);
        $this->seedConditions($ids, $meta, $now);
    }

    /**
     * This document's fitment ids, keyed `vehicleId:configId` — one query for the whole document.
     *
     * @return array<string, int>
     */
    private function fitmentIds(int $documentId): array
    {
        $rows = DB::table('fitments')
            ->where('approval_document_id', $documentId)
            ->get(['id', 'vehicle_id', 'wheel_config_id']);

        $ids = [];

        foreach ($rows as $row) {
            $ids[$row->vehicle_id.':'.$row->wheel_config_id] = (int) $row->id;
        }

        return $ids;
    }

    /**
     * Two permitted sizes per fitment where the diameter allows it. A single size would make the
     * intersection rule — where two documents agree only on the sizes both name — untestable from
     * seeded data.
     *
     * @param  array<string, int>  $ids
     * @param  array<string, array{entry: bool, offset: int, diameter: float}>  $meta
     */
    private function seedTyreSizes(array $ids, array $meta, \DateTimeInterface $now): void
    {
        $rows = [];

        foreach ($meta as $key => $row) {
            if (! isset($ids[$key])) {
                continue;
            }

            $sizes = match (true) {
                $row['diameter'] >= 20.0 => [[255, 35], [265, 35]],
                $row['diameter'] >= 19.0 => [[255, 40], [245, 40]],
                $row['diameter'] >= 18.0 => [[245, 45], [225, 45]],
                $row['diameter'] >= 17.0 => [[225, 50]],
                default => [[205, 55]],
            };

            foreach ($sizes as [$width, $aspect]) {
                $rows[] = [
                    'fitment_id' => $ids[$key],
                    'width_mm' => $width,
                    'aspect' => $aspect,
                    'diameter_in' => $row['diameter'],
                    'axle' => Axle::All->value,
                    // NULL minima mean the document states none, so the derivation from the
                    // vehicle's axle load and top speed is the only floor. Never "no minimum".
                    'min_load_index' => null,
                    'min_speed_symbol' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('fitment_tyre_sizes')->insertOrIgnore($chunk);
        }
    }

    /**
     * @param  array<string, int>  $ids
     * @param  array<string, array{entry: bool, offset: int, diameter: float}>  $meta
     */
    private function seedConditions(array $ids, array $meta, \DateTimeInterface $now): void
    {
        $codes = $this->conditionCodes();
        $rows = [];

        foreach ($meta as $key => $row) {
            if (! isset($ids[$key])) {
                continue;
            }

            $attach = [];

            if ($row['entry'] && $codes['entry'] !== null) {
                $attach[$codes['entry']->id] = null;
            }

            // A share of fitments carries conditions, which is what the Auflagen panel and the
            // amber CONDITIONAL verdict exist for.
            if ($row['offset'] % 3 === 0 && $codes['bolts'] !== null) {
                $attach[$codes['bolts']->id] = null;
            }

            if ($row['offset'] % 5 === 2 && $codes['arch'] !== null) {
                $attach[$codes['arch']->id] = 'Nur an der Hinterachse.';
            }

            foreach ($attach as $conditionCodeId => $note) {
                $rows[] = [
                    'fitment_id' => $ids[$key],
                    'condition_code_id' => $conditionCodeId,
                    'note_de' => $note,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('fitment_conditions')->insertOrIgnore($chunk);
        }
    }

    /** @return array<string, ConditionCode|null> */
    private function conditionCodes(): array
    {
        return [
            'entry' => ConditionCode::query()->where('code', 'ENTRY_REQUIRED')->first(),
            'bolts' => ConditionCode::query()->where('code', 'SPECIFIC_BOLTS')->first(),
            'arch' => ConditionCode::query()->where('code', 'ARCH_ROLLING')->first(),
        ];
    }

    /**
     * The disagreement, recorded as a row with a status rather than announced and forgotten.
     *
     * Entry requirement is the one conflict kind that blocks: every other kind can be published as
     * the intersection of the two documents, but there is no intersection between "requires entry"
     * and "does not".
     */
    private function seedConflict(ApprovalDocument $candidate, ApprovalDocument $existing): void
    {
        $candidateFitment = Fitment::query()
            ->where('approval_document_id', $candidate->id)
            ->orderBy('id')
            ->first();

        if ($candidateFitment === null) {
            return;
        }

        $existingFitment = Fitment::query()
            ->where('approval_document_id', $existing->id)
            ->where('vehicle_id', $candidateFitment->vehicle_id)
            ->where('wheel_config_id', $candidateFitment->wheel_config_id)
            ->first();

        if ($existingFitment === null) {
            return;
        }

        FitmentConflict::updateOrCreate(
            [
                'candidate_fitment_id' => $candidateFitment->id,
                'existing_fitment_id' => $existingFitment->id,
            ],
            [
                'kind' => ConflictKind::EntryRequirement->value,
                'status' => ConflictStatus::Open->value,
                'vehicle_id' => $candidateFitment->vehicle_id,
                'wheel_config_id' => $candidateFitment->wheel_config_id,
                'blocking' => true,
                // Both sides, as they are shown side by side in the admin panel. The reviewer
                // decides; the system never picks a winner for a blocking conflict.
                'detail' => [
                    'field' => 'requires_entry',
                    'existing' => [
                        'document' => $existing->report_number,
                        'issuer' => $existing->issuer,
                        'requires_entry' => (bool) $existingFitment->requires_entry,
                        'source_page' => $existingFitment->source_page,
                    ],
                    'candidate' => [
                        'document' => $candidate->report_number,
                        'issuer' => $candidate->issuer,
                        'requires_entry' => (bool) $candidateFitment->requires_entry,
                        'source_page' => $candidateFitment->source_page,
                    ],
                ],
            ],
        );
    }
}
