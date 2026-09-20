<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use DateTimeImmutable;

/**
 * Everything needed to freeze a verdict onto an order line, and to identify later which build of
 * the resolver produced it.
 *
 * `engineVersion` matters for the same reason the rest of the snapshot does: if a bug in the
 * resolver is found and fixed, RIMIFY can identify precisely which orders were computed by the
 * affected build, rather than guessing or re-checking everything.
 */
final readonly class VerdictSnapshot
{
    public function __construct(
        public ?int $fitmentId,
        public ?int $documentRevision,
        public DateTimeImmutable $computedAt,
        public string $engineVersion,
    ) {}

    /**
     * @return array{fitmentId: string|null, documentRevision: int|null, computedAt: string, engineVersion: string}
     */
    public function toArray(): array
    {
        return [
            'fitmentId' => $this->fitmentId === null ? null : (string) $this->fitmentId,
            'documentRevision' => $this->documentRevision,
            // ISO-8601 in UTC: the instant, unambiguous, rendered in Europe/Berlin at the edges.
            'computedAt' => $this->computedAt->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z'),
            'engineVersion' => $this->engineVersion,
        ];
    }

    /**
     * @param  array{fitmentId: string|int|null, documentRevision: int|null, computedAt: string, engineVersion: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            fitmentId: $data['fitmentId'] === null ? null : (int) $data['fitmentId'],
            documentRevision: $data['documentRevision'],
            computedAt: new DateTimeImmutable($data['computedAt']),
            engineVersion: $data['engineVersion'],
        );
    }
}
