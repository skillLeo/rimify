<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Contracts\TyreCatalogue;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\LoadIndexCode;
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
 *
 * Mischbereifung (#20, D-105) is answered here too, and only through the document: a front/rear pair is offered
 * where the released Gutachten's own table (`reifen_kombination`, ABE 55255's V19) lists it and the car's row lists
 * both sizes on their axle; each axle's tyres are measured against that axle's own load.
 *
 * A document's own list of „Bereifungskombinationen“, where one is entered (D-256), is closed: the wheel is approved
 * only with those (BBS's Anlage BMW15, „in Verbindung mit“ four combinations). A mixed pair is offered only where it
 * names the pair, and four tyres of one size only where it names that size on both axles (rules 4b and 7b).
 *
 * @phpstan-import-type AxleMinimum from MixedPair
 */
final readonly class TyreEligibility
{
    /** A mixed set is two wheels on each axle: the least the shelf must hold of each tyre. */
    public const MIXED_PER_AXLE = 2;

    private const MINIMUM_LEAD = 'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex %d und Geschwindigkeitsindex %s.';

    private const MINIMUM_BOTH_DERIVED = 'Diese Mindestwerte ergeben sich aus Achslast und Höchstgeschwindigkeit deines Fahrzeugs.';

    private const MINIMUM_BOTH_DOCUMENT = 'Diese Mindestwerte stehen so im Gutachten.';

    private const MINIMUM_LOAD_DERIVED_SPEED_DOCUMENT = 'Der Tragfähigkeitsindex ergibt sich aus den Daten deines Fahrzeugs, der Geschwindigkeitsindex steht so im Gutachten.';

    private const MINIMUM_LOAD_DOCUMENT_SPEED_DERIVED = 'Der Tragfähigkeitsindex steht so im Gutachten, der Geschwindigkeitsindex ergibt sich aus den Daten deines Fahrzeugs.';

    /* The papers' own index, where it was the stricter (15.1, 15.2, as the customer typed them — D-242). */
    private const MINIMUM_BOTH_PAPERS = 'Diese Mindestwerte stehen nach deinen Angaben so in deinen Fahrzeugpapieren (Felder 15.1 und 15.2).';

    private const MINIMUM_LOAD_PAPERS = 'Der Tragfähigkeitsindex steht nach deinen Angaben so in deinen Fahrzeugpapieren (Felder 15.1 und 15.2), %s';

    private const MINIMUM_SPEED_PAPERS = '%s, der Geschwindigkeitsindex steht nach deinen Angaben so in deinen Fahrzeugpapieren (Felder 15.1 und 15.2).';

    private const SPEED_FROM = [
        'DERIVED' => 'der Geschwindigkeitsindex ergibt sich aus den Daten deines Fahrzeugs.',
        'DOCUMENT' => 'der Geschwindigkeitsindex steht so im Gutachten.',
    ];

    private const LOAD_FROM = [
        'DERIVED' => 'Der Tragfähigkeitsindex ergibt sich aus den Daten deines Fahrzeugs',
        'DOCUMENT' => 'Der Tragfähigkeitsindex steht so im Gutachten',
    ];

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
        // anyway: the catalogue must never be asked for a size only one axle permits. Where the document
        // lists its combinations, only the sizes it names on both axles — rule 4b has left at least one.
        $sizes = $this->sameSizes($verdict);
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
     * Every front/rear pair the document's table permits for this car on this wheel, each with the tyre sets that meet
     * both axles — or the sentence saying why there is none (#20, D-105).
     *
     * The rules, in order, each failing closed: the verdict sells (rule 1); every tyre rule the document writes is one
     * the engine reads (rule 2); the document prints a pairing table; the car's axle loads and top speed settled every
     * axle (R-03 — Mischbereifung is never offered on the document's minimum alone); the pair is in the table, front
     * first, and the car's row lists the front size on the front axle and the rear size on the rear; each tyre meets
     * its own axle; front and rear are one maker's one profile, as the table's own sentence asks.
     */
    public function mixedOfferFor(FitmentVerdict $verdict, bool $inStockOnly = true): MixedOffer
    {
        [$table, $refusal, $source] = $this->mixedGate($verdict);

        // A list of combinations that pairs no two different sizes says nothing about Mischbereifung (D-256).
        if ($refusal !== null) {
            return MixedOffer::refused($refusal, $table->hasMixedPair());
        }

        $pairs = [];

        foreach ($this->listedPairs($verdict, $table) as [$pairing, $front, $rear]) {
            $frontMinimum = $this->sizeMinimum($verdict, 'FRONT', $verdict->front, $front);
            $rearMinimum = $this->sizeMinimum($verdict, 'REAR', $verdict->rear, $rear);

            // A size the axle's load rules out is not a pair this car may have.
            if (! is_array($frontMinimum) || ! is_array($rearMinimum)) {
                continue;
            }

            $perAxle = $inStockOnly ? self::MIXED_PER_AXLE : 0;
            $fronts = [];
            $rears = [];

            foreach ($this->catalogue->inSizes([$front, $rear], $inStockOnly) as $tyre) {
                if ($tyre->size()->matches($front) && $this->axleTyreRefusal($verdict, 'FRONT', $tyre, $perAxle) === null) {
                    $fronts[] = $tyre;
                } elseif ($tyre->size()->matches($rear) && $this->axleTyreRefusal($verdict, 'REAR', $tyre, $perAxle) === null) {
                    $rears[] = $tyre;
                }
            }

            $sets = [];

            foreach ($fronts as $frontTyre) {
                foreach ($rears as $rearTyre) {
                    if (self::oneMakerOneProfile($frontTyre, $rearTyre)) {
                        $sets[] = ['front' => $frontTyre, 'rear' => $rearTyre];
                    }
                }
            }

            // Cheapest set first: two of each, so the sum of one of each orders them the same way.
            usort($sets, static fn (array $a, array $b): int => [$a['front']->priceCents + $a['rear']->priceCents, $a['front']->id]
                <=> [$b['front']->priceCents + $b['rear']->priceCents, $b['front']->id]);

            $pairs[] = new MixedPair(
                $pairing,
                $front,
                $rear,
                self::minimum($frontMinimum, $verdict->vehicle->axleLoadFrontKg),
                self::minimum($rearMinimum, $verdict->vehicle->axleLoadRearKg),
                $sets,
            );
        }

        if ($pairs === []) {
            return MixedOffer::refused(KomplettradRefusal::NoMixedPairing, $table->hasMixedPair());
        }

        // The pairs' page is that of their numbering — a recorded list's, or the Auflage's whose sentence prints the
        // table; the rules come from that sentence alone, and carry its page.
        return new MixedOffer($pairs, null, true, $table->rulesDe, $source?->code, $table->sourcePage, $table->rulesDe === null ? null : $source?->sourcePage);
    }

    /**
     * Null when this front tyre and this rear tyre may be sold as a mixed set on this verdict, `$perAxle` of each;
     * otherwise why not — the basket's gate on every add and every render (R-11).
     */
    public function permitsMixed(FitmentVerdict $verdict, TyreRecord $front, TyreRecord $rear, int $perAxle = self::MIXED_PER_AXLE): ?KomplettradRefusal
    {
        [$table, $refusal] = $this->mixedGate($verdict);

        if ($refusal !== null) {
            return $refusal;
        }

        $listed = null;

        foreach ($this->listedPairs($verdict, $table) as [$pairing, $frontSize, $rearSize]) {
            if ($frontSize->matches($front->size()) && $rearSize->matches($rear->size())) {
                $listed = $pairing;

                break;
            }
        }

        if ($listed === null) {
            return KomplettradRefusal::MixedPairNotListed;
        }

        return $this->axleTyreRefusal($verdict, 'FRONT', $front, $perAxle)
            ?? $this->axleTyreRefusal($verdict, 'REAR', $rear, $perAxle)
            ?? (self::oneMakerOneProfile($front, $rear) ? null : KomplettradRefusal::MixedNotOneMaker);
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

        $load = $minimum['loadSource'];
        $speed = $minimum['speedSource'];

        $tail = match (true) {
            // Where the papers governed a half, it is credited to them — and the other half to its own source.
            $load === MinSource::Papers && $speed === MinSource::Papers => self::MINIMUM_BOTH_PAPERS,
            $load === MinSource::Papers => sprintf(self::MINIMUM_LOAD_PAPERS, self::SPEED_FROM[$speed->value]),
            $speed === MinSource::Papers => sprintf(self::MINIMUM_SPEED_PAPERS, self::LOAD_FROM[$load->value]),
            $load === MinSource::Document && $speed === MinSource::Document => self::MINIMUM_BOTH_DOCUMENT,
            $load === MinSource::Document => self::MINIMUM_LOAD_DOCUMENT_SPEED_DERIVED,
            $speed === MinSource::Document => self::MINIMUM_LOAD_DERIVED_SPEED_DOCUMENT,
            default => self::MINIMUM_BOTH_DERIVED,
        };

        return sprintf(self::MINIMUM_LEAD, $minimum['loadIndex'], $minimum['speedSymbol']).' '.$tail;
    }

    /** Rules 1–5 — about the verdict as a whole, before any tyre is looked at. */
    private function verdictRefusal(FitmentVerdict $verdict): ?KomplettradRefusal
    {
        $byStatus = $this->statusRefusal($verdict);

        if ($byStatus !== null) {
            return $byStatus;
        }

        // Rule 2 — the document restricts which tyres may be fitted in a way the engine does not read itself;
        // offering any tyre would be a confident wrong answer. What it reads (D-105) does not stop the offer: a
        // pairing table says nothing about four identical tyres, an axle code makes the sizes axle-scoped (rule 3b),
        // and a load-index limit is applied per size from the car's own axle load (rule 8).
        if ($this->hasUnreadTyreRule($verdict)) {
            return KomplettradRefusal::TyreChoiceRestricted;
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

        // Rule 4b — the document's own list of combinations (D-256): four of a kind only in a size it names on both
        // axles. Before rule 5: there is no point asking for the axle loads of a set the list does not hold.
        if ($this->combinations($verdict) !== null && $this->sameSizes($verdict) === []) {
            return KomplettradRefusal::NoSameSizeCombination;
        }

        // Rule 5 — a null minimum is not "no minimum" (R-03).
        if (! $verdict->front->hasUsableMinimum() || ! $verdict->rear->hasUsableMinimum()) {
            return KomplettradRefusal::NoUsableMinimum;
        }

        return null;
    }

    /** Rule 1, and the guard before it — the verdict sells, and it is live. */
    private function statusRefusal(FitmentVerdict $verdict): ?KomplettradRefusal
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

        // Since R-03 was split the wheel can be approved while the tyres are not: the sentence names the
        // half that refused, and never says „kein Gutachten“ about a car the document names.
        $wheelApproved = in_array($verdict->wheelStatus, [VerdictStatus::Permitted, VerdictStatus::Conditional], true);

        return match ($verdict->status) {
            VerdictStatus::NotPermitted => $wheelApproved ? KomplettradRefusal::TyresNotPermitted : KomplettradRefusal::VerdictNotPermitted,
            VerdictStatus::Unknown => $wheelApproved ? KomplettradRefusal::TyresUnknown : KomplettradRefusal::VerdictUnknown,
            VerdictStatus::Permitted, VerdictStatus::Conditional => null,
        };
    }

    /**
     * Whether the document writes a tyre rule the engine does not read itself (D-105). It reads three kinds, and only
     * when they are whole: a load-index limit that names its index and its axle load (T95 → 95 up to 1.380 kg), and
     * only once the car's own figures settled every axle; a pairing table it can read strictly; an axle code with its
     * axle entered. Anything else — a maker list, an unread table, a code without a kind — stops every tyre offer.
     */
    private function hasUnreadTyreRule(FitmentVerdict $verdict): bool
    {
        $figures = $verdict->tyre?->figuresPermitted === true;

        foreach ($verdict->conditions as $condition) {
            if (! $condition->affectsTyreChoice) {
                continue;
            }

            $read = match ($condition->kind) {
                ConditionKind::ReifenTragfaehigkeit => $figures && $condition->maxAxleLoadKg !== null && LoadIndexCode::indexNamedBy($condition->code) !== null,
                ConditionKind::ReifenKombination => TyrePairingTable::parse($condition->textDe)->isRead(),
                ConditionKind::ReifenAchse => $condition->axle !== null,
                default => false,
            };

            if (! $read) {
                return true;
            }
        }

        return false;
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
        foreach (['FRONT' => $verdict->front, 'REAR' => $verdict->rear] as $name => $axle) {
            $refusal = $this->axleRefusal($verdict, $name, $axle, $tyre);

            if ($refusal !== null) {
                return $refusal;
            }
        }

        // Rule 7b — the document's own list of combinations (D-256) names this size on both axles.
        if ($this->combinations($verdict)?->listsSame($tyre->size()) === false) {
            return KomplettradRefusal::SizeNotACombination;
        }

        // Rule 9
        if ($tyre->stockQty < $quantity) {
            return KomplettradRefusal::OutOfStock;
        }

        return null;
    }

    /** Rules 6–9 for a tyre on ONE axle of a mixed set: its diameter, its size on that axle, that axle's minimum, the shelf. */
    private function axleTyreRefusal(FitmentVerdict $verdict, string $name, TyreRecord $tyre, int $quantity): ?KomplettradRefusal
    {
        $wheelDiameter = $verdict->wheel?->diameterIn;

        if ($wheelDiameter === null || abs($tyre->diameterIn - $wheelDiameter) > 0.01) {
            return KomplettradRefusal::DiameterMismatch;
        }

        $refusal = $this->axleRefusal($verdict, $name, $name === 'FRONT' ? $verdict->front : $verdict->rear, $tyre);

        if ($refusal !== null) {
            return $refusal;
        }

        return $tyre->stockQty < $quantity ? KomplettradRefusal::OutOfStock : null;
    }

    private function axleRefusal(FitmentVerdict $verdict, string $name, AxleRequirement $axle, TyreRecord $tyre): ?KomplettradRefusal
    {
        // Rule 7 — the size must appear on this axle, matched by identity.
        $listed = $this->listedSize($axle, $tyre->size());

        if ($listed === null) {
            return KomplettradRefusal::SizeNotPermitted;
        }

        // Rule 8 — R-06, refined per listed size (sizeMinimum()).
        $minimum = $this->sizeMinimum($verdict, $name, $axle, $listed);

        if (! is_array($minimum)) {
            return $minimum;
        }

        // The tyre's own symbol must be one we know: an unrecognised symbol has no rank, and no
        // rank is not "fast enough". Symbols are never compared as letters — H sits between U
        // and V.
        $tyreRank = $this->speedSymbol->rankOf($tyre->speedSymbol);

        if ($tyreRank === null || $tyre->loadIndex < $minimum['loadIndex'] || $tyreRank < $minimum['speedRank']) {
            return KomplettradRefusal::BelowMinimum;
        }

        return null;
    }

    /**
     * What a tyre of this listed size must carry on this axle — R-06, refined per size. Every figure is a max() against
     * the axle's already-governed value, so this can only ever RAISE the minimum, never relax it:
     *
     * - the size's own printed index and symbol (the axle's speed merge keeps the strictest printed symbol, but the
     *   listed size's own is compared here too, from the safe side);
     * - the document's load-index limits that apply to THIS size — the row's and its own, never another size's —
     *   read at this axle's load (D-105): the smallest index whose limit reaches it. The axle requirement merges the
     *   limits of every size on the axle, which for one size can be a lower index than its own codes allow.
     *
     * @return array{loadIndex: int, speedSymbol: string, speedRank: int}|KomplettradRefusal
     */
    private function sizeMinimum(FitmentVerdict $verdict, string $name, AxleRequirement $axle, TyreSize $listed): array|KomplettradRefusal
    {
        $axleRank = $this->speedSymbol->rankOf($axle->minSpeedSymbol);

        if ($axle->minLoadIndex === null || $axle->minSpeedSymbol === null || $axleRank === null) {
            // A minimum that cannot be stated is not "no minimum" (R-03).
            return KomplettradRefusal::NoUsableMinimum;
        }

        $limit = $this->sizeLimitIndex($verdict, $name, $listed);

        if ($limit instanceof KomplettradRefusal) {
            return $limit;
        }

        $loadIndex = max($axle->minLoadIndex, $listed->documentMinLoadIndex ?? 0, $limit ?? 0);

        // An unrecognised document symbol is ignored rather than trusted (D-027): it would rank
        // as nothing, and the axle's own minimum still stands beneath it.
        $printed = $listed->documentMinSpeedSymbol;
        $documentRank = $printed === null ? null : $this->speedSymbol->rankOf($printed);

        return $printed !== null && $documentRank !== null && $documentRank > $axleRank
            ? ['loadIndex' => $loadIndex, 'speedSymbol' => $printed, 'speedRank' => $documentRank]
            : ['loadIndex' => $loadIndex, 'speedSymbol' => $axle->minSpeedSymbol, 'speedRank' => $axleRank];
    }

    /**
     * The load index this size's own limits (and its row's) ask for at this axle's load: null where none applies; a
     * refusal where they exist and the axle's load is unknown, or above every one of them.
     */
    private function sizeLimitIndex(FitmentVerdict $verdict, string $name, TyreSize $listed): int|KomplettradRefusal|null
    {
        // Live verdicts carry the row's own Auflagen apart; without them a size's limits cannot be told from another
        // size's, and the blended list could hand this size a lower index than its own codes allow.
        $row = $verdict->combinationConditions;
        $limits = array_values(array_filter(
            [...($row ?? []), ...$listed->conditions],
            static fn (Condition $c): bool => $c->kind === ConditionKind::ReifenTragfaehigkeit
                && $c->maxAxleLoadKg !== null
                && LoadIndexCode::indexNamedBy($c->code) !== null,
        ));

        if ($limits === []) {
            return $row === null && $this->anyLimit($verdict) ? KomplettradRefusal::NoUsableMinimum : null;
        }

        $load = $name === 'FRONT' ? $verdict->vehicle->axleLoadFrontKg : $verdict->vehicle->axleLoadRearKg;

        if ($load === null || $load <= 0) {
            return KomplettradRefusal::NoUsableMinimum;
        }

        $index = null;

        foreach ($limits as $limit) {
            $named = (int) LoadIndexCode::indexNamedBy($limit->code);

            if ((int) $limit->maxAxleLoadKg >= $load && ($index === null || $named < $index)) {
                $index = $named;
            }
        }

        return $index ?? KomplettradRefusal::AxleLoadAboveLimit;
    }

    private function anyLimit(FitmentVerdict $verdict): bool
    {
        foreach ($verdict->conditions as $condition) {
            if ($condition->kind === ConditionKind::ReifenTragfaehigkeit) {
                return true;
            }
        }

        return false;
    }

    /**
     * Rules 1, 2 and the table, for a mixed set: the verdict sells, every tyre rule is read, a pairing table is
     * printed, and the car's own figures settled every axle.
     *
     * @return array{0: TyrePairingTable, 1: KomplettradRefusal|null, 2: Condition|null}
     */
    private function mixedGate(FitmentVerdict $verdict): array
    {
        $refusal = $this->statusRefusal($verdict);

        if ($refusal !== null) {
            return [TyrePairingTable::none(), $refusal, null];
        }

        [$table, $source] = $this->pairingTable($verdict);

        if ($this->hasUnreadTyreRule($verdict) && ! $this->onlyUnreadForWantOfFigures($verdict)) {
            return [$table, KomplettradRefusal::TyreChoiceRestricted, $source];
        }

        if (! $table->isRead()) {
            return [$table, KomplettradRefusal::NoMixedPairing, $source];
        }

        // The load calculation runs per axle, from the car's own axle loads and top speed — never on the
        // document's minimum alone (R-03).
        if ($verdict->tyre?->figuresPermitted !== true) {
            return [$table, KomplettradRefusal::NoUsableMinimum, $source];
        }

        return [$table, null, $source];
    }

    /**
     * Whether the only tyre rules left unread are load-index limits waiting for the car's figures — said then as „trag
     * deine Achslasten ein“, not as „wir klären das persönlich“.
     */
    private function onlyUnreadForWantOfFigures(FitmentVerdict $verdict): bool
    {
        if ($verdict->tyre?->figuresPermitted === true) {
            return false;
        }

        foreach ($verdict->conditions as $condition) {
            if (! $condition->affectsTyreChoice) {
                continue;
            }

            $wellFormed = match ($condition->kind) {
                ConditionKind::ReifenTragfaehigkeit => $condition->maxAxleLoadKg !== null && LoadIndexCode::indexNamedBy($condition->code) !== null,
                ConditionKind::ReifenKombination => TyrePairingTable::parse($condition->textDe)->isRead(),
                ConditionKind::ReifenAchse => $condition->axle !== null,
                default => false,
            };

            if (! $wellFormed) {
                return false;
            }
        }

        return true;
    }

    /**
     * The pairs the documents permit: their own lists of combinations, where any is entered (D-256), and the tables
     * their `reifen_kombination` Auflagen print, read strictly — where several speak, only the pairs all of them permit,
     * numbered as the first. With it the Auflage a printed table came from, for its code, its rules and its page.
     *
     * @return array{0: TyrePairingTable, 1: Condition|null}
     */
    private function pairingTable(FitmentVerdict $verdict): array
    {
        $table = $this->combinations($verdict);
        $source = null;
        $seen = [];

        foreach ($verdict->conditions as $condition) {
            if ($condition->kind !== ConditionKind::ReifenKombination || isset($seen[$condition->code."\u{0}".$condition->textDe])) {
                continue;
            }

            $seen[$condition->code."\u{0}".$condition->textDe] = true;
            $read = TyrePairingTable::parse($condition->textDe)->onPage($condition->sourcePage);

            if (! $read->isRead()) {
                return [TyrePairingTable::none(), $condition];
            }

            $table = $table === null ? $read : $table->intersect($read);
            $source ??= $condition;
        }

        return [$table ?? TyrePairingTable::none(), $source];
    }

    /**
     * The documents' own lists of tyre combinations (D-256), where any is entered: only the pairs every one of them names
     * — read together, toward caution. Null where none is.
     */
    private function combinations(FitmentVerdict $verdict): ?TyrePairingTable
    {
        $table = null;

        foreach ($verdict->documents !== [] ? $verdict->documents : array_filter([$verdict->document]) as $document) {
            if ($document->tyreCombinations !== null) {
                $table = $table === null ? $document->tyreCombinations : $table->intersect($document->tyreCombinations);
            }
        }

        return $table;
    }

    /**
     * The sizes four of a kind may come in: those both axles list — and, where the documents list their combinations,
     * that a combination names on both axles.
     *
     * @return list<TyreSize>
     */
    private function sameSizes(FitmentVerdict $verdict): array
    {
        $sizes = TyreSize::intersect($verdict->front->sizes, $verdict->rear->sizes);
        $combinations = $this->combinations($verdict);

        return $combinations === null ? $sizes : array_values(array_filter($sizes, static fn (TyreSize $size): bool => $combinations->listsSame($size)));
    }

    /**
     * The table's pairs this car's row lists on their axles: the front size among the front axle's sizes, the rear
     * among the rear's, never one size on both ends.
     *
     * @return list<array{0: TyrePairing, 1: TyreSize, 2: TyreSize}>
     */
    private function listedPairs(FitmentVerdict $verdict, TyrePairingTable $table): array
    {
        $pairs = [];

        foreach ($table->pairs as $pairing) {
            if ($pairing->front->matches($pairing->rear)) {
                continue;
            }

            $front = $this->listedSize($verdict->front, $pairing->front);
            $rear = $this->listedSize($verdict->rear, $pairing->rear);

            if ($front !== null && $rear !== null && $front->coversAxle('FRONT') && $rear->coversAxle('REAR')) {
                $pairs[] = [$pairing, $front, $rear];
            }
        }

        return $pairs;
    }

    /**
     * ABE 55255, V19: „Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig“ — the same maker
     * and the same tyre line front and rear, in the same season. A name we do not hold is not „the same“.
     */
    private static function oneMakerOneProfile(TyreRecord $front, TyreRecord $rear): bool
    {
        $same = static fn (?string $a, ?string $b): bool => $a !== null && $b !== null && trim($a) !== ''
            && mb_strtolower(trim($a)) === mb_strtolower(trim($b));

        return $same($front->brandName, $rear->brandName) && $same($front->name, $rear->name) && $same($front->season, $rear->season);
    }

    /**
     * @param  array{loadIndex: int, speedSymbol: string, speedRank: int}  $minimum
     * @return AxleMinimum
     */
    private static function minimum(array $minimum, ?int $axleLoadKg = null): array
    {
        return ['loadIndex' => $minimum['loadIndex'], 'speedSymbol' => $minimum['speedSymbol'], 'axleLoadKg' => $axleLoadKg];
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
            match (true) {
                $frontSource === MinSource::Document || $rearSource === MinSource::Document => MinSource::Document,
                $frontSource === MinSource::Papers || $rearSource === MinSource::Papers => MinSource::Papers,
                default => MinSource::Derived,
            },
        ];
    }
}
