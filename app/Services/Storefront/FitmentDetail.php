<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\Axle;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Support\GermanFormat;

/**
 * What the Gutachten asks of this car, laid out the way the customer does it (Block D, item 15; the Borbet brief
 * §5): the Abnahme, the work on the car with the millimetres its document prints for this Fahrzeugtyp, the bolts
 * with their torque, the tyre sizes with the axle and the minimum each is printed with, and the document's own
 * notes — the 50 km torque check among them.
 *
 * Read from the answer the engine gave (R-13) and from what the answer's documents state beside their codes; it
 * decides nothing. Every line is a sentence from those documents, never a code, never another document's.
 */
final class FitmentDetail
{
    /** The order the customer reads them in. */
    private const SECTIONS = ['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen', 'Hinweise'];

    /**
     * @return array{
     *     sections: list<array{title: string, items: list<array{text: string, measures: list<string>}>}>,
     *     fasteners: list<array{thread: string, label: string, torque: string|null, article: string|null, limit: string|null}>,
     *     tyres: list<array{label: string, axle: string, minimum: string|null, band: string|null}>,
     *     notices: list<string>
     * }
     */
    public function for(FitmentVerdict $verdict): array
    {
        $documentIds = array_values(array_unique(array_map(
            static fn (DocumentRecord $d): int => $d->id,
            $verdict->documents === [] ? array_filter([$verdict->document]) : $verdict->documents,
        )));
        $type = $verdict->vehicle->typeDesignation;

        return [
            'sections' => $this->sections($verdict->conditions, $documentIds, $type),
            'fasteners' => $this->fasteners($verdict->conditions, $documentIds, $type),
            'tyres' => $this->tyres($verdict),
            'notices' => $documentIds === [] ? [] : DocumentNotice::query()
                ->whereIn('approval_document_id', $documentIds)
                ->orderBy('approval_document_id')->orderBy('sort_order')->orderBy('id')
                ->pluck('text_de')->map(static fn (mixed $t): string => (string) $t)->unique()->values()->all(),
        ];
    }

    /**
     * @param  list<Condition>  $conditions
     * @param  list<int>  $documentIds
     * @return list<array{title: string, items: list<array{text: string, measures: list<string>}>}>
     */
    private function sections(array $conditions, array $documentIds, ?string $type): array
    {
        // The millimetres this document prints for this Fahrzeugtyp, per code — nothing for a type it has no profile for.
        $measures = [];

        if ($type !== null && $documentIds !== []) {
            $reworks = DocumentConditionRework::query()->with('condition')
                ->where('vehicle_type', $type)
                ->whereHas('condition', static fn ($q) => $q->whereIn('approval_document_id', $documentIds))
                ->orderBy('axle')->orderBy('id')->get();

            foreach ($reworks as $rework) {
                $measures[(string) $rework->condition?->code][] = Axle::from($rework->axle)->labelDe().': '.$rework->measureDe();
            }
        }

        $grouped = array_fill_keys(self::SECTIONS, []);

        foreach ($conditions as $condition) {
            // A kW band is about the tyre sizes; a sentence without a kind (the old catalogue's) is a note.
            $title = $condition->kind?->sectionDe() ?? (str_starts_with($condition->code, 'KW ') ? 'Reifen' : 'Hinweise');

            $grouped[$title][] = [
                'text' => $condition->sentenceDe(),
                'measures' => $condition->kind === ConditionKind::Nacharbeitsprofil ? ($measures[$condition->code] ?? []) : [],
            ];
        }

        $out = [];

        foreach ($grouped as $title => $items) {
            if ($items !== []) {
                $out[] = ['title' => $title, 'items' => $items];
            }
        }

        return $out;
    }

    /**
     * The bolts for this car: a document that numbers them names them in its code (ABE 55255's S01 → Befestigungs-
     * mittel S01); one that lists them by Fahrzeugtyp names the type (the Nachtrag). Where it gives one type two
     * sets — 1C and 3C by the thread of the car's own bolts — both are said, each with what the page prints beside it.
     *
     * @param  list<Condition>  $conditions
     * @param  list<int>  $documentIds
     * @return list<array{thread: string, label: string, torque: string|null, article: string|null, limit: string|null}>
     */
    private function fasteners(array $conditions, array $documentIds, ?string $type): array
    {
        if ($documentIds === []) {
            return [];
        }

        $codes = array_map(static fn (Condition $c): string => $c->code, array_filter($conditions, static fn (Condition $c): bool => $c->kind === ConditionKind::Befestigung));
        $out = [];

        foreach (DocumentFastener::query()->whereIn('approval_document_id', $documentIds)->orderBy('id')->get() as $fastener) {
            $limit = null;
            $named = in_array($fastener->number, $codes, true);

            if (! $named && $type !== null) {
                foreach (explode(';', (string) $fastener->vehicle_types) as $part) {
                    if (preg_match('/^\s*([^()]+?)\s*(?:\((.*)\))?\s*$/u', $part, $m) === 1 && $m[1] === $type) {
                        $named = true;
                        $limit = isset($m[2]) && $m[2] !== '' ? $m[2] : null;
                    }
                }
            }

            if (! $named) {
                continue;
            }

            $out[] = [
                'thread' => $fastener->thread,
                'label' => implode(', ', array_filter([
                    $fastener->thread,
                    $fastener->seat,
                    $fastener->shaft_length_mm === null ? null : 'Schaftlänge '.GermanFormat::integer($fastener->shaft_length_mm).GermanFormat::NBSP.'mm',
                ])),
                'torque' => $fastener->torque_nm === null ? null : GermanFormat::integer($fastener->torque_nm).GermanFormat::NBSP.'Nm',
                'article' => $fastener->article_number,
                'limit' => $limit,
            ];
        }

        return $out;
    }

    /**
     * Each size the car may carry, with the axle it may go on, the minimum the document prints beside it, and its
     * kW band.
     *
     * @return list<array{label: string, axle: string, minimum: string|null, band: string|null}>
     */
    private function tyres(FitmentVerdict $verdict): array
    {
        $sizes = [];

        foreach ([['front', $verdict->front->sizes], ['rear', $verdict->rear->sizes]] as [$axle, $list]) {
            foreach ($list as $size) {
                $sizes[$size->key()] ??= ['size' => $size, 'axles' => []];
                $sizes[$size->key()]['axles'][$axle] = true;
            }
        }

        return array_values(array_map(static function (array $entry): array {
            /** @var TyreSize $size */
            $size = $entry['size'];
            $printed = ($size->documentMinLoadIndex === null ? '' : (string) $size->documentMinLoadIndex).($size->documentMinSpeedSymbol ?? '');

            return [
                'label' => $size->labelDe(),
                'axle' => match (true) {
                    isset($entry['axles']['front'], $entry['axles']['rear']) => 'Vorder- und Hinterachse',
                    isset($entry['axles']['front']) => 'nur Vorderachse',
                    default => 'nur Hinterachse',
                },
                'minimum' => $printed === '' ? null : 'laut Gutachten mindestens '.$printed,
                'band' => $size->powerBandDe(),
            ];
        }, $sizes));
    }
}
