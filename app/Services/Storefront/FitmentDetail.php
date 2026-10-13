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
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\Vehicle;
use App\Support\EgNumber;
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
     *     sections: list<array{title: string, items: list<array{text: string, measures: list<string>, sizes: list<string>, own: bool}>}>,
     *     fasteners: list<array{number: string|null, thread: string, label: string, torque: string|null, article: string|null, limit: string|null}>,
     *     tyres: list<array{label: string, axle: string, minimum: string|null, band: string|null}>,
     *     notices: list<string>,
     *     original: list<array{text: string, page: int|null, sizes: list<string>}>
     * }
     */
    public function for(FitmentVerdict $verdict): array
    {
        $documentIds = array_values(array_unique(array_map(
            static fn (DocumentRecord $d): int => $d->id,
            $verdict->documents === [] ? array_filter([$verdict->document]) : $verdict->documents,
        )));
        $type = $verdict->vehicle->typeDesignation;
        $eg = Vehicle::withTrashed()->whereKey($verdict->vehicle->id)->value('eg_nummer_norm');

        $sizesOwning = $this->sizesOwning($verdict, $documentIds);

        return [
            'sections' => $this->sections($verdict->conditions, $documentIds, $type, $sizesOwning),
            'original' => $this->original($verdict->conditions, $sizesOwning),
            'fasteners' => $this->fasteners($verdict->conditions, $documentIds, $type, EgNumber::parse(is_string($eg) ? $eg : null)),
            'tyres' => $this->tyres($verdict),
            'notices' => $documentIds === [] ? [] : DocumentNotice::query()
                ->whereIn('approval_document_id', $documentIds)
                ->orderBy('approval_document_id')->orderBy('sort_order')->orderBy('id')
                ->pluck('text_de')->map(static fn (mixed $t): string => (string) $t)->unique()->values()->all(),
        ];
    }

    /**
     * The sizes an Auflage belongs to, where the document hangs it off some of the car's sizes and not all (D-04):
     * „Diese Reifengröße ist nur an Achse 2 zulässig.“ says which size only beside it. An Auflage any row of these
     * documents carries for this car and wheel stands for every size — the cautious reading when a code is on
     * both — and so does one every offered size carries.
     *
     * @param  list<int>  $documentIds
     * @return array<string, list<string>> by Condition::union's key (code and sentence)
     */
    private function sizesOwning(FitmentVerdict $verdict, array $documentIds): array
    {
        if ($verdict->wheel === null || $documentIds === []) {
            return [];
        }

        $sizes = [];

        foreach ([...$verdict->front->sizes, ...$verdict->rear->sizes] as $size) {
            $sizes[$size->key()] = $size;
        }

        $rowCodes = FitmentCondition::query()
            ->whereIn('fitment_id', Fitment::query()->select('id')
                ->where('vehicle_id', $verdict->vehicle->id)
                ->where('wheel_config_id', $verdict->wheel->id)
                ->whereIn('approval_document_id', $documentIds))
            ->pluck('code')->map(static fn (mixed $c): string => (string) $c)->flip()->all();
        $owning = [];

        foreach ($sizes as $size) {
            foreach ($size->conditions as $condition) {
                if (! isset($rowCodes[$condition->code])) {
                    $owning[self::key($condition)][$size->key()] = $size->labelDe();
                }
            }
        }

        $out = [];

        foreach ($owning as $key => $labels) {
            if (count($labels) < count($sizes)) {
                $out[$key] = array_values($labels);
            }
        }

        return $out;
    }

    private static function key(Condition $condition): string
    {
        return $condition->code."\u{0}".$condition->sentenceDe();
    }

    /**
     * The documents' own wording for this car, as printed and with the page it stands on (the client's #21): no section,
     * nothing left out because the verdict line already says it. The page may arrange the Auflagen; it may not change
     * what they say, so this stays one click away. Our own kW-band sentence is not the document's.
     *
     * One thing stays with a sentence: the sizes its document hangs it off (D-04). The document says that with a code
     * beside the size, and a code is never shown (R-15) — without the sizes, „nur feingliedrige Schneeketten“ and
     * „Schneeketten nicht zulässig“ would stand side by side as if both held for the same tyre (SWEEP-01).
     *
     * @param  list<Condition>  $conditions
     * @param  array<string, list<string>>  $sizesOwning
     * @return list<array{text: string, page: int|null, sizes: list<string>}>
     */
    private function original(array $conditions, array $sizesOwning = []): array
    {
        $out = [];

        foreach ($conditions as $condition) {
            if (str_starts_with($condition->code, 'KW ')) {
                continue;
            }

            $out[self::key($condition)] = [
                'text' => $condition->sentenceDe(),
                'page' => $condition->sourcePage,
                'sizes' => $sizesOwning[self::key($condition)] ?? [],
            ];
        }

        return array_values($out);
    }

    /**
     * @param  list<Condition>  $conditions
     * @param  list<int>  $documentIds
     * @param  array<string, list<string>>  $sizesOwning
     * @return list<array{title: string, items: list<array{text: string, measures: list<string>, sizes: list<string>, own: bool}>}>
     */
    private function sections(array $conditions, array $documentIds, ?string $type, array $sizesOwning = []): array
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
                'sizes' => $sizesOwning[self::key($condition)] ?? [],
                // The kW band's sentence is RIMIFY's, not the document's (D-10): said as ours.
                'own' => str_starts_with($condition->code, 'KW '),
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
     * A set the page gives a type „nur bis Nachtrag 03“ or „ab Nachtrag 04“ of its EG-Typgenehmigung is left out
     * for a car whose own extensions lie wholly on the other side (D-08); a car whose extensions are not known, or
     * straddle the boundary, is shown both.
     *
     * @param  list<Condition>  $conditions
     * @param  list<int>  $documentIds
     * @return list<array{number: string|null, thread: string, label: string, torque: string|null, article: string|null, limit: string|null}>
     */
    private function fasteners(array $conditions, array $documentIds, ?string $type, ?EgNumber $eg = null): array
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

            if (! $named || self::outsideExtensions($limit, $eg)) {
                continue;
            }

            $out[] = [
                // The number the document's own sentence names it by („… Befestigungsmittel Nr. S01 …“, D-07).
                'number' => in_array($fastener->number, $codes, true) ? $fastener->number : null,
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

    /** True when `nur bis Nachtrag 03` / `ab Nachtrag 04` excludes every extension the car's number covers. */
    private static function outsideExtensions(?string $limit, ?EgNumber $eg): bool
    {
        if ($limit === null || $eg === null || preg_match('/^\s*(nur bis|ab) Nachtrag (\d+)\s*$/u', $limit, $m) !== 1) {
            return false;
        }

        $at = (int) $m[2];

        return $m[1] === 'ab' ? $eg->to !== null && $eg->to < $at : $eg->from !== null && $eg->from > $at;
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
            // `Lastindex 91, Geschwindigkeitsindex W` — what the document prints beside the size, said in words.
            $printed = implode(', ', array_filter([
                $size->documentMinLoadIndex === null ? null : 'Lastindex '.$size->documentMinLoadIndex,
                $size->documentMinSpeedSymbol === null ? null : 'Geschwindigkeitsindex '.$size->documentMinSpeedSymbol,
            ]));

            return [
                'label' => $size->labelDe(),
                'axle' => match (true) {
                    isset($entry['axles']['front'], $entry['axles']['rear']) => 'Vorder- und Hinterachse',
                    isset($entry['axles']['front']) => 'nur Vorderachse',
                    default => 'nur Hinterachse',
                },
                'minimum' => $printed === '' ? null : $printed,
                'band' => $size->powerBandDe(),
            ];
        }, $sizes));
    }
}
