<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\IndexTables;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\Severity;
use DateTimeImmutable;

/**
 * The worked example the spec uses throughout: an Audi RS 4 Avant B9 with a BORBET Havanna
 * 8,5J × 18 ET 35, under a Teilegutachten that requires entry in the papers.
 */
final class FitmentFixtures
{
    public const WHEEL_CONFIG_ID = 884;

    public static function wheel(float $widthIn = 8.5, int $etMm = 35): WheelConfigRecord
    {
        return new WheelConfigRecord(
            id: self::WHEEL_CONFIG_ID,
            wheelModelId: 10,
            wheelFinishId: 20,
            diameterIn: 18.0,
            widthIn: $widthIn,
            etMm: $etMm,
            boltHoles: 5,
            boltCircleMm: 112.0,
            centreBoreMm: 66.60,
            priceCents: 75_029,
            stockQty: 12,
            sku: 'RMF-000884-HV18',
            modelName: 'Havanna',
            brandName: 'BORBET',
            finishNameDe: 'Graphite matt',
        );
    }

    public static function document(int $revision = 2, string $kind = 'TEILEGUTACHTEN'): DocumentRecord
    {
        return new DocumentRecord(
            id: 57,
            kind: $kind,
            number: 'TG-2024-11-0093',
            revision: $revision,
            issuedOn: new DateTimeImmutable('2024-11-18'),
            pdfKey: 'gutachten/tg-2024-11-0093.pdf',
            pdfSha256: str_repeat('9f2c', 16),
            sourcePage: 7,
        );
    }

    public static function entryRequired(): Condition
    {
        return new Condition(
            code: 'ENTRY_REQUIRED',
            severity: Severity::Action,
            textDe: 'Eintragung in die Fahrzeugpapiere erforderlich.',
            affectsPurchase: true,
        );
    }

    public static function specificBolts(): Condition
    {
        return new Condition(
            code: 'SPECIFIC_BOLTS',
            severity: Severity::Action,
            textDe: 'Nur mit den angegebenen Radschrauben zulässig.',
            affectsPurchase: true,
        );
    }

    public static function infoOnly(): Condition
    {
        return new Condition(
            code: 'TYRE_SIZE_NOTE',
            severity: Severity::Info,
            textDe: 'Hinweis zur Reifengröße beachten.',
        );
    }

    public static function archRolling(): Condition
    {
        return new Condition(
            code: 'ARCH_ROLLING',
            severity: Severity::Workshop,
            textDe: 'Bördeln der Radläufe erforderlich.',
            affectsPurchase: true,
            requiresAcknowledgement: true,
        );
    }

    /**
     * A clean row: covers the vehicle, permits the geometry, one permitted tyre size, no
     * conditions and no entry requirement — the only shape that can produce PERMITTED.
     *
     * @param  list<TyreSize>|null  $sizes
     * @param  list<Condition>  $conditions
     */
    public static function row(
        int $vehicleId = 1,
        ?array $sizes = null,
        array $conditions = [],
        bool $requiresEntry = false,
        ?BuildWindow $window = null,
        ?float $widthMin = null,
        ?float $widthMax = null,
        ?int $etMin = null,
        ?int $etMax = null,
        int $id = 20431,
        ?DocumentRecord $document = null,
        string $axle = 'ALL',
    ): FitmentRow {
        return new FitmentRow(
            id: $id,
            document: $document ?? self::document(),
            vehicleId: $vehicleId,
            wheelConfigId: self::WHEEL_CONFIG_ID,
            axle: $axle,
            buildWindow: $window ?? BuildWindow::unbounded(),
            permittedWidthMin: $widthMin,
            permittedWidthMax: $widthMax,
            permittedEtMin: $etMin,
            permittedEtMax: $etMax,
            requiresEntry: $requiresEntry,
            entryNoteDe: $requiresEntry ? 'Eintragung durch eine amtlich anerkannte Prüfstelle.' : null,
            tyreSizes: $sizes ?? [new TyreSize(245, 45, 18.0)],
            conditions: $conditions,
        );
    }

    public static function tables(): IndexTables
    {
        return IndexTables::fromReferenceTables();
    }

    /** @param list<FitmentRow> $rows */
    public static function resolver(array $rows, ?InMemoryFitmentRepository $repository = null): FitmentResolver
    {
        $tables = self::tables();

        return new FitmentResolver(
            vehicles: VehicleFixtures::repository(),
            fitments: $repository ?? new InMemoryFitmentRepository($rows, [self::wheel()]),
            loadIndex: new LoadIndexDeriver($tables),
            speedSymbol: new SpeedSymbolDeriver($tables),
            clock: new FixedClock,
        );
    }
}
