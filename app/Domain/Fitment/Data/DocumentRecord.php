<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

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
    ) {}

    public const COMPLETE = 'complete';

    /** Whether a person asserted that every Anlage and every vehicle of the document is entered. */
    public function assertedComplete(): bool
    {
        return $this->completeness === self::COMPLETE;
    }

    /**
     * @return array{
     *     id: string, kind: string, number: string|null, revision: int,
     *     issuedOn: string|null, pdfUrl: string|null, pdfSha256: string|null, sourcePage: int|null,
     *     notes?: list<string>, papersCorrectionRequired?: bool, missingAnnexes?: string, completeness?: string
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
     *     notes?: list<string>, papersCorrectionRequired?: bool|null, missingAnnexes?: string|null, completeness?: string|null
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
        );
    }
}
