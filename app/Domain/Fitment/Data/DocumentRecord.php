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
    ) {}

    /**
     * @return array{
     *     id: string, kind: string, number: string|null, revision: int,
     *     issuedOn: string|null, pdfUrl: string|null, pdfSha256: string|null, sourcePage: int|null
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
        ];
    }

    /**
     * @param array{
     *     id: string|int, kind: string, number: string|null, revision: int,
     *     issuedOn?: string|null, pdfUrl?: string|null, pdfSha256?: string|null, sourcePage?: int|null
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
        );
    }
}
