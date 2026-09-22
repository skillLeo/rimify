<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Support\GermanFormat;
use Illuminate\Support\Facades\DB;

/**
 * The columns of `/vergleich`: the product card plus the figures the table lines up — sizes,
 * ET range, Lochkreis, Mittenlochbohrung, the documents behind the model — and, with a vehicle,
 * the engine's verdict merged toward caution across the model's configurations, and the one
 * action the page may offer for that column.
 *
 * The card itself comes from `ProductCards`, so the head of a column is the same object as the
 * tile that was ticked. The verdict is the engine's (R-13): one call per configuration, merged
 * the way the listing merges — CONDITIONAL if any is, entry if any needs it, the union of the
 * Auflagen — and never a boolean (R-07). `buy` is `basket` only when exactly one configuration
 * is permitted and in stock: the page never picks a size for the customer.
 */
final readonly class CompareRows
{
    public function __construct(
        private ProductCards $cards,
        private FitmentResolver $resolver,
    ) {}

    /**
     * @param  list<array{0: int, 1: int}>  $pairs  `[modelId, finishId]`, in the order asked for
     * @return array{items: list<array<string, mixed>>, missing: int, demo: bool}
     */
    public function build(array $pairs, ?int $vehicleId): array
    {
        if ($pairs === []) {
            return ['items' => [], 'missing' => 0, 'demo' => false];
        }

        $modelIds = array_values(array_unique(array_map(static fn (array $pair): int => $pair[0], $pairs)));

        $cards = [];

        foreach ($this->cards->catalogue(limit: null, options: ['modelIds' => $modelIds]) as $card) {
            $cards[$card['modelId'].':'.$card['finishId']] = $card;
        }

        $configs = $this->configsFor($modelIds);
        $demoFlags = WheelModel::query()->whereIn('id', $modelIds)->pluck('is_demo', 'id');

        $items = [];
        $missing = 0;
        $demo = false;

        foreach ($pairs as [$modelId, $finishId]) {
            $key = $modelId.':'.$finishId;

            // Unknown, unpublished or without a configuration: dropped and counted, never guessed.
            if (! isset($cards[$key]) || ! isset($configs[$key])) {
                $missing++;

                continue;
            }

            $isDemo = (bool) ($demoFlags[$modelId] ?? false);
            $demo = $demo || $isDemo;

            $items[] = $this->item($cards[$key], $configs[$key], $vehicleId, $isDemo);
        }

        return ['items' => $items, 'missing' => $missing, 'demo' => $demo];
    }

    /**
     * @param  array<string, mixed>  $card
     * @param  list<WheelConfig>  $configs
     * @return array<string, mixed>
     */
    private function item(array $card, array $configs, ?int $vehicleId, bool $isDemo): array
    {
        $slug = (string) $card['slug'];
        $finishId = (int) $card['finishId'];
        $chooseHref = '/felgen/'.$slug.'?ausfuehrung='.$finishId.'#groessen';

        $verdict = null;
        $fitment = null;
        $diametersFitting = null;
        $buy = ['kind' => 'choose', 'href' => $chooseHref];

        if ($vehicleId !== null) {
            $merged = $this->verdictFor($vehicleId, $configs);
            $verdict = $merged['verdict'];
            $fitment = $merged['fitment'];
            $diametersFitting = $merged['diameters'];
            $buy = $this->buyFor($merged['status'], $merged['inStock'], $chooseHref);
        }

        return [
            ...$card,
            'compareKey' => $card['modelId'].':'.$finishId,
            'isDemo' => $isDemo,
            'diametersFitting' => $diametersFitting,
            'fitment' => $fitment,
            'specs' => $this->specs($configs),
            'verdict' => $verdict,
            'buy' => $buy,
        ];
    }

    /**
     * Every live configuration of the models asked for, keyed `modelId:finishId`, in size order.
     *
     * @param  list<int>  $modelIds
     * @return array<string, list<WheelConfig>>
     */
    private function configsFor(array $modelIds): array
    {
        $rows = WheelConfig::query()
            ->whereIn('wheel_model_id', $modelIds)
            ->orderBy('diameter_in')
            ->orderBy('width_in')
            ->orderBy('et_mm')
            ->orderBy('id')
            ->get();

        $out = [];

        foreach ($rows as $config) {
            $out[$config->wheel_model_id.':'.$config->wheel_finish_id][] = $config;
        }

        return $out;
    }

    /**
     * The figures of the *Felge* group and the documents behind the configurations.
     *
     * @param  list<WheelConfig>  $configs
     * @return array{sizes: list<string>, etRange: string, boltPattern: string, centreBore: string, documents: list<array{kind: string, number: string|null}>}
     */
    private function specs(array $configs): array
    {
        $sizes = [];
        $ets = [];
        $patterns = [];
        $bores = [];
        $ids = [];

        foreach ($configs as $config) {
            $ids[] = (int) $config->id;
            $sizes[GermanFormat::trimmedDecimal($config->width_in, 2).GermanFormat::NBSP.'J'.GermanFormat::NBSP.GermanFormat::TIMES.GermanFormat::NBSP.GermanFormat::trimmedDecimal($config->diameter_in, 1)] = true;
            $ets[] = (int) $config->et_mm;
            $patterns['LK'.GermanFormat::NBSP.GermanFormat::boltPattern((int) $config->bolt_holes, $config->bolt_circle_mm)] = true;
            $bores[GermanFormat::millimetres($config->centre_bore_mm)] = true;
        }

        $min = min($ets);
        $max = max($ets);

        return [
            'sizes' => array_keys($sizes),
            'etRange' => $min === $max
                ? $this->et($min)
                : $this->et($min).' '.GermanFormat::ENDASH.' '.$this->et($max),
            'boltPattern' => implode(' '.GermanFormat::MIDDOT.' ', array_keys($patterns)),
            'centreBore' => implode(' '.GermanFormat::MIDDOT.' ', array_keys($bores)),
            'documents' => $this->documentsFor($ids),
        ];
    }

    /** `ET 35`, `ET −10` — the typographic minus, the unit joined. */
    private function et(int $et): string
    {
        return 'ET'.GermanFormat::NBSP.($et < 0 ? GermanFormat::MINUS.abs($et) : (string) $et);
    }

    /**
     * The published, currently valid documents holding a row for any of these configurations —
     * for any vehicle. What the model is approved under, not what the chosen car may have.
     *
     * @param  list<int>  $configIds
     * @return list<array{kind: string, number: string|null}>
     */
    private function documentsFor(array $configIds): array
    {
        if ($configIds === []) {
            return [];
        }

        $today = now()->toDateString();

        $rows = DB::table('fitments as f')
            ->join('approval_documents as d', 'd.id', '=', 'f.approval_document_id')
            ->whereIn('f.wheel_config_id', $configIds)
            ->where('f.status', FitmentStatus::Published->value)
            ->where('d.status', DocumentStatus::Published->value)
            ->where(fn ($q) => $q->whereNull('d.valid_to')->orWhere('d.valid_to', '>=', $today))
            ->where(fn ($q) => $q->whereNull('d.valid_from')->orWhere('d.valid_from', '<=', $today))
            ->distinct()
            ->orderBy('d.kind')
            ->orderBy('d.id')
            ->get(['d.id', 'd.kind', 'd.kba_number', 'd.approval_mark', 'd.report_number']);

        $out = [];

        foreach ($rows as $row) {
            $kind = ApprovalKind::tryFrom((string) $row->kind);

            [$label, $number] = match ($kind) {
                ApprovalKind::Abe => ['ABE', $row->kba_number],
                ApprovalKind::Teilegutachten => ['Teilegutachten', $row->report_number],
                ApprovalKind::Ece => ['ECE', $row->approval_mark],
                ApprovalKind::Ec => ['EG-Genehmigung', $row->approval_mark ?? $row->report_number],
                null => [(string) $row->kind, null],
            };

            $out[] = ['kind' => $label, 'number' => is_string($number) && $number !== '' ? $number : null];
        }

        return $out;
    }

    /**
     * The engine's answer for the column, merged toward caution across its configurations.
     *
     * Sellable configurations decide a positive answer: CONDITIONAL if any of them is or needs
     * entry, PERMITTED otherwise, the Auflagen united, the tyre sizes united. With none sellable
     * the column is NOT_PERMITTED only when every configuration is — one UNKNOWN makes the column
     * UNKNOWN, because "we hold no document" is not "your car may not have this" (R-07).
     *
     * @param  list<WheelConfig>  $configs
     * @return array{status: VerdictStatus, verdict: array<string, mixed>, fitment: array<string, mixed>, diameters: list<string>, inStock: list<WheelConfig>}
     */
    private function verdictFor(int $vehicleId, array $configs): array
    {
        $requiresEntry = false;
        $anyConditional = false;
        $conditions = [];
        $entryNotes = [];
        $tyreSizes = [];
        $diameters = [];
        $inStock = [];
        $sellable = 0;
        $allNotPermitted = true;
        $document = null;
        /** @var array<string, FitmentVerdict> $firstOf */
        $firstOf = [];

        $verdicts = $this->resolver->resolveMany(
            $vehicleId,
            array_map(static fn (WheelConfig $config): int => (int) $config->id, $configs),
        );

        foreach ($configs as $config) {
            $verdict = $verdicts[(int) $config->id];
            $firstOf[$verdict->status->value] ??= $verdict;

            if ($verdict->status !== VerdictStatus::NotPermitted) {
                $allNotPermitted = false;
            }

            if (! $verdict->isSellable()) {
                continue;
            }

            $sellable++;
            $anyConditional = $anyConditional || $verdict->status === VerdictStatus::Conditional;
            $requiresEntry = $requiresEntry || $verdict->requiresEntry;
            $conditions = Condition::union($conditions, $verdict->conditions);

            // A list of strings, the same spelling as the card's `diameters`: `18`, never the
            // integer 18 an array key would turn it into.
            $diameter = GermanFormat::trimmedDecimal($config->diameter_in, 1);

            if (! in_array($diameter, $diameters, true)) {
                $diameters[] = $diameter;
            }

            if ($config->stock_qty > 0) {
                $inStock[] = $config;
            }

            if ($verdict->requiresEntry && $verdict->entryNoteDe !== null && trim($verdict->entryNoteDe) !== '') {
                $entryNotes[$verdict->entryNoteDe] = true;
            }

            foreach ([...$verdict->front->sizes, ...$verdict->rear->sizes] as $size) {
                /** @var TyreSize $size */
                $tyreSizes[$size->labelDe()] = true;
            }

            // The newest revision among the governing documents is the one shown.
            if ($verdict->document !== null && ($document === null || $verdict->document->revision > $document->revision)) {
                $document = $verdict->document;
            }
        }

        if ($sellable > 0) {
            $status = ($anyConditional || $requiresEntry) ? VerdictStatus::Conditional : VerdictStatus::Permitted;
            $reason = null;

            // Merged across configurations, "Keine Eintragung erforderlich." from one of them
            // would contradict the entry another one needs.
            if ($requiresEntry) {
                $conditions = array_values(array_filter($conditions, static fn (Condition $c): bool => $c->code !== 'NO_ENTRY_REQUIRED'));
            }
        } else {
            $status = $allNotPermitted ? VerdictStatus::NotPermitted : VerdictStatus::Unknown;
            $negative = $firstOf[$status->value] ?? null;
            $reason = $negative?->reason;
            $document = $negative?->document;
            $requiresEntry = false;
            $conditions = [];
        }

        $sentences = array_map(static fn (Condition $c): string => $c->sentenceDe(), $conditions);
        $sizes = array_keys($tyreSizes);
        sort($sizes, SORT_NATURAL);

        return [
            'status' => $status,
            'verdict' => [
                'status' => $status->value,
                'label' => $status->labelDe(),
                'sellable' => $status->isSellable(),
                'requiresEntry' => $requiresEntry,
                'entryNoteDe' => $entryNotes === [] ? null : implode(' ', array_keys($entryNotes)),
                // Full German sentences, never codes such as A02 (R-15).
                'conditions' => $sentences,
                'reason' => $reason?->textDe,
                'reasonCode' => $reason?->code,
                'document' => $document === null ? null : [
                    'number' => $document->number,
                    'issuer' => $document->issuer,
                    'kind' => $document->kind,
                ],
                'tyreSizes' => $sizes,
            ],
            'fitment' => [
                'status' => $status->value,
                'requiresEntry' => $requiresEntry,
                'conditions' => $sentences,
            ],
            'diameters' => $diameters,
            'inStock' => $inStock,
        ];
    }

    /**
     * The one action a column may offer: the basket only when exactly one configuration is
     * permitted and in stock; the size chooser when several or none is determined; nothing to
     * buy when the document says no.
     *
     * @param  list<WheelConfig>  $inStock
     * @return array<string, mixed>
     */
    private function buyFor(VerdictStatus $status, array $inStock, string $chooseHref): array
    {
        if ($status === VerdictStatus::NotPermitted) {
            return ['kind' => 'none'];
        }

        if ($status->isSellable() && count($inStock) === 1) {
            $config = $inStock[0];

            return [
                'kind' => 'basket',
                'configId' => (int) $config->id,
                'sizeLabel' => GermanFormat::wheelSize($config->width_in, $config->diameter_in, $config->et_mm),
            ];
        }

        return ['kind' => 'choose', 'href' => $chooseHref];
    }
}
