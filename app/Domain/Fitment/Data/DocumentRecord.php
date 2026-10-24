<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Domain\Fitment\Tyres\TyrePairingTable;
use DateTimeImmutable;

/**
 * The approval document behind a verdict.
 *
 * `pdfSha256` travels on every verdict and is frozen onto the order line, because it is what
 * proves in a dispute that the PDF the customer downloaded is the PDF RIMIFY still holds.
 * `revision` travels for the same reason: a reissued document must not silently rewrite what an
 * existing order says.
 */
final readonly class DocumentRecord
{
    public function __construct(
        public int $id,
        public string $kind,
        public ?string $number,
        public int $revision,
        public ?DateTimeImmutable $issuedOn = null,
        public ?string $pdfKey = null,
        public ?string $pdfSha256 = null,
        public ?int $sourcePage = null,
        public ?string $issuer = null,
        /**
         * Full sentences about the document itself, shown wherever it is named (the corrections memo
         * §4): a Nachtrag whose base we do not hold, the month a wheel must be made from.
         *
         * @var list<string>
         */
        public array $notesDe = [],
        /**
         * The document's own table of tyre load at speed; null when it prints none — then above 210 km/h
         * its tyre answer is UNKNOWN, never borrowed from another document. Not frozen onto a snapshot: the
         * sum it produced is, in the verdict's tyre lines.
         */
        public ?SpeedDeratingTable $speedDerating = null,
        /**
         * § 15 FZV: false where the document — or, for a Nachtrag, its base — frees the papers from correction (ABE
         * 53841, point 10); null where it says nothing, and then nothing is claimed. Not the Änderungsabnahme, which the
         * Auflagen decide. Frozen with the verdict: it is part of what the customer was told.
         */
        public ?bool $papersCorrectionRequired = null,
        /** The Anlagen of the document's Verwendungsbereich we do not hold („1–15“); null while all are held. */
        public ?string $missingAnnexes = null,
        /**
         * What a person asserted about the entry at release (EIGENE-FUNDE 119, D-227): `complete` — every Anlage and
         * every vehicle entered —, `partial` or `unknown`; null where nobody has answered yet, which reads as partial. Only
         * `complete` lets a car the rows do not name be answered „nicht zulässig“.
         */
        public ?string $completeness = null,
        /**
         * An example document, born demo (`approval_documents.is_demo`): it is marked wherever it is shown or opened, and
         * a verdict resting on it never lands on a real order — refused on production, a born-demo order elsewhere
         * (decision 6, the operator's brief of 15.10.2026, D-239). Frozen with the verdict where true.
         */
        public bool $isDemo = false,
        /**
         * The document's own list of tyre combinations, front against rear, as entered (`document_tyre_combinations`,
         * D-256); null where none is entered. Entered, it is closed: the document approves the wheel only with these —
         * BBS's Anlage BMW15, „in Verbindung mit“ four combinations — so the Komplettrad is one of them, two wheels on each
         * axle in the sizes it names, never four of one size (D-335). Not frozen onto a snapshot as a list, like the
         * derating table — TyreEligibility answers live verdicts only —; the combination a set was sold in is, on its
         * order lines.
         */
        public ?TyrePairingTable $tyreCombinations = null,
        /**
         * How the document gives its tyres' load index and speed symbol (D-277): `document` — beside every size, so a car's
         * top speed is not needed —, `papers`, `table`; null where nobody has answered, read as needing the top speed.
         * Frozen with the verdict where set: whether the answer rested on the car's top speed is part of what was told.
         */
        public ?string $tyreIndexSource = null,
        /**
         * The axle load the document itself limits the wheel to — BBS's „nur für Fahrzeuge mit maximaler Achslast
         * 1160 kg“ —, as declared at release (`counted_axle_limit_kg`); null where it names none. Then the wheel's own
         * approval rests on the car's axle loads, not only its tyres' (D-289). Frozen with the verdict where set.
         */
        public ?int $axleLimitKg = null,
    ) {}

    public const COMPLETE = 'complete';

    /** The answer that frees a car from its top speed: the document prints the index beside every size (D-277). */
    public const INDEX_AT_EVERY_SIZE = 'document';

    /** Whether the document gives the speed symbol beside every size, so the car's top speed is not needed for it. */
    public function statesIndexAtEverySize(): bool
    {
        return $this->tyreIndexSource === self::INDEX_AT_EVERY_SIZE;
    }

    /** Whether a person asserted that every Anlage and every vehicle of the document is entered. */
    public function assertedComplete(): bool
    {
        return $this->completeness === self::COMPLETE;
    }

    /**
     * @return array{
     *     id: string, kind: string, number: string|null, revision: int,
     *     issuedOn: string|null, pdfUrl: string|null, pdfSha256: string|null, sourcePage: int|null,
     *     notes?: list<string>, papersCorrectionRequired?: bool, missingAnnexes?: string, completeness?: string, isDemo?: true,
     *     tyreIndexSource?: string, axleLimitKg?: int
     * }
     */
    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'kind' => $this->kind,
            'number' => $this->number,
            'revision' => $this->revision,
            'issuedOn' => $this->issuedOn?->format('Y-m-d'),
            // The signed URL is minted at render time; the key is what is stored.
            'pdfUrl' => $this->pdfKey,
            'pdfSha256' => $this->pdfSha256,
            'sourcePage' => $this->sourcePage,
            // Additive, and only where there is something to say.
            ...($this->notesDe === [] ? [] : ['notes' => $this->notesDe]),
            ...($this->papersCorrectionRequired === null ? [] : ['papersCorrectionRequired' => $this->papersCorrectionRequired]),
            ...($this->missingAnnexes === null ? [] : ['missingAnnexes' => $this->missingAnnexes]),
            // Frozen with the verdict: what the answer rested on, as asserted that day.
            ...($this->completeness === null ? [] : ['completeness' => $this->completeness]),
            // An example document, said where it is true: the snapshot of a demo order keeps it.
            ...($this->isDemo ? ['isDemo' => true] : []),
            ...($this->tyreIndexSource === null ? [] : ['tyreIndexSource' => $this->tyreIndexSource]),
            ...($this->axleLimitKg === null ? [] : ['axleLimitKg' => $this->axleLimitKg]),
        ];
    }

    /** The document — or its base — frees the papers from correction (§ 15 FZV): said as its own line to the customer. */
    public function papersExempt(): bool
    {
        return $this->papersCorrectionRequired === false;
    }

    /**
     * @param array{
     *     id: string|int, kind: string, number: string|null, revision: int,
     *     issuedOn?: string|null, pdfUrl?: string|null, pdfSha256?: string|null, sourcePage?: int|null,
     *     notes?: list<string>, papersCorrectionRequired?: bool|null, missingAnnexes?: string|null, completeness?: string|null,
     *     isDemo?: bool, tyreIndexSource?: string|null, axleLimitKg?: int|null
     * } $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (int) $data['id'],
            kind: $data['kind'],
            number: $data['number'],
            revision: $data['revision'],
            issuedOn: ($data['issuedOn'] ?? null) === null
                ? null
                : new DateTimeImmutable((string) $data['issuedOn']),
            pdfKey: $data['pdfUrl'] ?? null,
            pdfSha256: $data['pdfSha256'] ?? null,
            sourcePage: $data['sourcePage'] ?? null,
            notesDe: $data['notes'] ?? [],
            papersCorrectionRequired: $data['papersCorrectionRequired'] ?? null,
            missingAnnexes: $data['missingAnnexes'] ?? null,
            completeness: $data['completeness'] ?? null,
            isDemo: ($data['isDemo'] ?? false) === true,
            tyreIndexSource: $data['tyreIndexSource'] ?? null,
            axleLimitKg: isset($data['axleLimitKg']) ? (int) $data['axleLimitKg'] : null,
        );
    }
}
