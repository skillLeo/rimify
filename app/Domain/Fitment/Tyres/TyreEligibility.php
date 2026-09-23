<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Contracts\TyreCatalogue;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * Decides which tyres a verdict permits on a wheel — the only place that question is answered,
 * for every surface (R-13).
 *
 * A Komplettrad is a compatibility claim about a tyre as well as a rim. Every rule below fails
 * closed: no offer, a German sentence saying why, and the Felge alone stays buyable. None of the
 * rules may be re-implemented in a controller, a service or a component.
 *
 * Only a LIVE verdict is answered. A verdict restored from `order_line_fitments.verdict` is
 * evidence of what was decided on the day, never the input to a fresh decision, and is refused
 * before any rule is read.
 */
final readonly class TyreEligibility
{
    private const MINIMUM_LEAD = 'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex %d und Geschwindigkeitsindex %s.';

    private const MINIMUM_BOTH_DERIVED = 'Diese Mindestwerte ergeben sich aus Achslast und Höchstgeschwindigkeit deines Fahrzeugs.';

    private const MINIMUM_BOTH_DOCUMENT = 'Diese Mindestwerte stehen so im Gutachten.';

    private const MINIMUM_LOAD_DERIVED_SPEED_DOCUMENT = 'Der Tragfähigkeitsindex ergibt sich aus den Daten deines Fahrzeugs, der Geschwindigkeitsindex steht so im Gutachten.';

    private const MINIMUM_LOAD_DOCUMENT_SPEED_DERIVED = 'Der Tragfähigkeitsindex steht so im Gutachten, der Geschwindigkeitsindex ergibt sich aus den Daten deines Fahrzeugs.';

    public function __construct(
        private TyreCatalogue $catalogue,
        private SpeedSymbolDeriver $speedSymbol,
    ) {}

    /** Every tyre this verdict permits on this wheel, cheapest first. */
    public function offerFor(FitmentVerdict $verdict, bool $inStockOnly = true): KomplettradOffer
    {
        $refusal = $this->verdictRefusal($verdict);

        if ($refusal !== null) {
            return KomplettradOffer::refused($refusal);
        }

        // Rule 3a has already held, so both axles list the same sizes. The intersection is taken
        // anyway: the catalogue must never be asked for a size only one axle permits.
        $sizes = TyreSize::intersect($verdict->front->sizes, $verdict->rear->sizes);
        $tyres = [];

        // One wheel's worth is the least a Komplettrad needs. With the stock filter off the offer
        // deliberately lists what is not on the shelf, so rule 9 is asked for nothing.
        $quantity = $inStockOnly ? 1 : 0;

        foreach ($this->catalogue->inSizes($sizes, $inStockOnly) as $tyre) {
            if ($this->tyreRefusal($verdict, $tyre, $quantity) === null) {
                $tyres[] = $tyre;
            }
        }

        $minimum = $this->governingMinimum($verdict);

        return new KomplettradOffer(
            tyres: $tyres,
            refusal: $tyres === [] ? KomplettradRefusal::NoTyreAvailable : null,
            minimumSentenceDe: $this->minimumSentenceDe($verdict),
            minSource: $minimum !== null
                && ($minimum['loadSource'] === MinSource::Document || $minimum['speedSource'] === MinSource::Document)
                ? MinSource::Document
                : MinSource::Derived,
        );
    }

    /** Null when the tyre may be sold on this verdict; otherwise why not. */
    public function permits(FitmentVerdict $verdict, TyreRecord $tyre, int $quantity = 1): ?KomplettradRefusal
    {
        return $this->verdictRefusal($verdict) ?? $this->tyreRefusal($verdict, $tyre, $quantity);
    }

    /**
     * `Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und
     * Geschwindigkeitsindex Y. …` — never a bare number pair, and the second sentence credits
     * each half to the source that actually governed it (R-06), never to the combined flag.
     */
    public function minimumSentenceDe(FitmentVerdict $verdict): ?string
    {
        $minimum = $this->governingMinimum($verdict);

        if ($minimum === null) {
            return null;
        }

        $tail = match (true) {
            $minimum['loadSource'] === MinSource::Document && $minimum['speedSource'] === MinSource::Document => self::MINIMUM_BOTH_DOCUMENT,
            $minimum['loadSource'] === MinSource::Document => self::MINIMUM_LOAD_DOCUMENT_SPEED_DERIVED,
            $minimum['speedSource'] === MinSource::Document => self::MINIMUM_LOAD_DERIVED_SPEED_DOCUMENT,
            default => self::MINIMUM_BOTH_DERIVED,
        };

        return sprintf(self::MINIMUM_LEAD, $minimum['loadIndex'], $minimum['speedSymbol']).' '.$tail;
    }

    /** Rules 1–5 — about the verdict as a whole, before any tyre is looked at. */
    private function verdictRefusal(FitmentVerdict $verdict): ?KomplettradRefusal
    {
        // Before rule 1, before anything: a snapshot answers nothing.
        if ($verdict->restored) {
            return KomplettradRefusal::VerdictRestored;
        }

        // Rule 1 — a null wheel first: we hold nothing, so we do not claim a refusal. Then the
        // status, selected case by case and never through one "not sellable" branch (R-07):
        // only NOT_PERMITTED means "we checked and your car may not have this".
        if ($verdict->wheel === null) {
            return KomplettradRefusal::VerdictUnknown;
        }

        $byStatus = match ($verdict->status) {
            VerdictStatus::NotPermitted => KomplettradRefusal::VerdictNotPermitted,
            VerdictStatus::Unknown => KomplettradRefusal::VerdictUnknown,
            VerdictStatus::Permitted, VerdictStatus::Conditional => null,
        };

        if ($byStatus !== null) {
            return $byStatus;
        }

        // Rule 2 — the document restricts which tyres may be fitted and we hold no structured
        // data about which; offering any tyre would be a confident wrong answer.
        foreach ($verdict->conditions as $condition) {
            if ($condition->affectsTyreChoice) {
                return KomplettradRefusal::TyreChoiceRestricted;
            }
        }

        // Rule 3 — two independent staggered guards. 3a: the two axles permit different size
        // sets. 3b: the document scoped a size to one axle, whatever the sets look like.
        if ($verdict->tyreLayout() === 'MIXED' || $this->hasAxleScopedSize($verdict)) {
            return KomplettradRefusal::StaggeredLayout;
        }

        // Rule 4
        if (! $verdict->front->hasPermittedSizes() || ! $verdict->rear->hasPermittedSizes()) {
            return KomplettradRefusal::NoPermittedSizes;
        }

        // Rule 5 — a null minimum is not "no minimum" (R-03).
        if (! $verdict->front->hasUsableMinimum() || ! $verdict->rear->hasUsableMinimum()) {
            return KomplettradRefusal::NoUsableMinimum;
        }

        return null;
    }

    /** Rules 6–9 — about one tyre, on a verdict that has already passed rules 1–5. */
    private function tyreRefusal(FitmentVerdict $verdict, TyreRecord $tyre, int $quantity): ?KomplettradRefusal
    {
        // Rule 6 — verdictRefusal() has already refused a null wheel; the check is repeated only
        // so the type system cannot be argued with.
        $wheelDiameter = $verdict->wheel?->diameterIn;

        if ($wheelDiameter === null || abs($tyre->diameterIn - $wheelDiameter) > 0.01) {
            return KomplettradRefusal::DiameterMismatch;
        }

        // Rules 7 and 8, per axle — front and rear, both.
        foreach ([$verdict->front, $verdict->rear] as $axle) {
            $refusal = $this->axleRefusal($axle, $tyre);

            if ($refusal !== null) {
                return $refusal;
            }
        }

        // Rule 9
        if ($tyre->stockQty < $quantity) {
            return KomplettradRefusal::OutOfStock;
        }

        return null;
    }

    private function axleRefusal(AxleRequirement $axle, TyreRecord $tyre): ?KomplettradRefusal
    {
        // Rule 7 — the size must appear on this axle, matched by identity.
        $listed = $this->listedSize($axle, $tyre->size());

        if ($listed === null) {
            return KomplettradRefusal::SizeNotPermitted;
        }

        // Rule 8 — R-06, refined per listed size. Every expression below is a max() against the
        // axle's already-governed value, so this can only ever RAISE the minimum, never relax it.
        // It earns its place because the axle's speed merge keeps the last size's document
        // symbol rather than the strictest; comparing the listed size's own symbol here closes
        // that hole from the safe side.
        $axleRank = $this->speedSymbol->rankOf($axle->minSpeedSymbol);

        if ($axle->minLoadIndex === null || $axleRank === null) {
            // A minimum that cannot be stated is not "no minimum" (R-03).
            return KomplettradRefusal::NoUsableMinimum;
        }

        $minLoadIndex = max($axle->minLoadIndex, $listed->documentMinLoadIndex ?? 0);

        // An unrecognised document symbol is ignored rather than trusted (D-027): it would rank
        // as nothing, and the axle's own minimum still stands beneath it.
        $documentRank = $listed->documentMinSpeedSymbol === null
            ? null
            : $this->speedSymbol->rankOf($listed->documentMinSpeedSymbol);
        $minRank = max($axleRank, $documentRank ?? 0);

        // The tyre's own symbol must be one we know: an unrecognised symbol has no rank, and no
        // rank is not "fast enough". Symbols are never compared as letters — H sits between U
        // and V.
        $tyreRank = $this->speedSymbol->rankOf($tyre->speedSymbol);

        if ($tyreRank === null || $tyre->loadIndex < $minLoadIndex || $tyreRank < $minRank) {
            return KomplettradRefusal::BelowMinimum;
        }

        return null;
    }

    private function listedSize(AxleRequirement $axle, TyreSize $size): ?TyreSize
    {
        foreach ($axle->sizes as $candidate) {
            if ($candidate->matches($size)) {
                return $candidate;
            }
        }

        return null;
    }

    private function hasAxleScopedSize(FitmentVerdict $verdict): bool
    {
        foreach ([...$verdict->front->sizes, ...$verdict->rear->sizes] as $size) {
            if ($size->axle !== 'ALL') {
                return true;
            }
        }

        return false;
    }

    /**
     * The minimum four identical tyres must meet: the stricter axle for each half, with the
     * source that governed THAT half. Null when either axle has no usable minimum, or carries a
     * symbol the table does not know.
     *
     * Where both axles agree on the number and one of them wrote it down, the document is
     * credited: "steht so im Gutachten" is true of that number, and it is the statement a customer
     * can check against the PDF.
     *
     * @return array{loadIndex: int, loadSource: MinSource, speedSymbol: string, speedSource: MinSource}|null
     */
    private function governingMinimum(FitmentVerdict $verdict): ?array
    {
        $front = $verdict->front;
        $rear = $verdict->rear;
        $frontRank = $this->speedSymbol->rankOf($front->minSpeedSymbol);
        $rearRank = $this->speedSymbol->rankOf($rear->minSpeedSymbol);

        if ($front->minLoadIndex === null || $rear->minLoadIndex === null
            || $front->minSpeedSymbol === null || $rear->minSpeedSymbol === null
            || $frontRank === null || $rearRank === null) {
            return null;
        }

        [$loadIndex, $loadSource] = $this->stricterHalf(
            $front->minLoadIndex, $front->minLoadIndex, $front->minLoadSource,
            $rear->minLoadIndex, $rear->minLoadIndex, $rear->minLoadSource,
        );

        [$speedSymbol, $speedSource] = $this->stricterHalf(
            $front->minSpeedSymbol, $frontRank, $front->minSpeedSource,
            $rear->minSpeedSymbol, $rearRank, $rear->minSpeedSource,
        );

        return [
            'loadIndex' => $loadIndex,
            'loadSource' => $loadSource,
            'speedSymbol' => $speedSymbol,
            'speedSource' => $speedSource,
        ];
    }

    /**
     * @template T of int|string
     *
     * @param  T  $frontValue
     * @param  T  $rearValue
     * @return array{0: T, 1: MinSource}
     */
    private function stricterHalf(
        int|string $frontValue,
        int $frontOrder,
        MinSource $frontSource,
        int|string $rearValue,
        int $rearOrder,
        MinSource $rearSource,
    ): array {
        if ($frontOrder > $rearOrder) {
            return [$frontValue, $frontSource];
        }

        if ($rearOrder > $frontOrder) {
            return [$rearValue, $rearSource];
        }

        return [
            $frontValue,
            ($frontSource === MinSource::Document || $rearSource === MinSource::Document)
                ? MinSource::Document
                : MinSource::Derived,
        ];
    }
}
