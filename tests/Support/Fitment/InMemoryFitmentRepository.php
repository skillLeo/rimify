<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\WheelConfigRecord;

/**
 * An in-memory approval repository.
 *
 * It holds only rows a customer could be shown, exactly as the Eloquent implementation does —
 * draft and retired rows, and rows of superseded documents, are simply never added. That keeps
 * the contract's promise ("everything here is publishable") true in tests as well as in
 * production, rather than testing against a laxer fake.
 */
final class InMemoryFitmentRepository implements FitmentRepository
{
    /**
     * @param  list<FitmentRow>  $rows
     * @param  list<WheelConfigRecord>  $configs
     * @param  list<int>  $configsWithAnyDocument  wheel configs some published document mentions,
     *                                             even if no row covers the vehicle being asked about
     */
    public function __construct(
        private array $rows = [],
        private array $configs = [],
        private array $configsWithAnyDocument = [],
    ) {}

    /** @return list<FitmentRow> */
    public function publishedRowsFor(int $vehicleId, int $wheelConfigId): array
    {
        return array_values(array_filter(
            $this->rows,
            static fn (FitmentRow $row): bool => $row->vehicleId === $vehicleId
                && $row->wheelConfigId === $wheelConfigId,
        ));
    }

    public function hasPublishedDocumentForConfig(int $wheelConfigId): bool
    {
        if (in_array($wheelConfigId, $this->configsWithAnyDocument, true)) {
            return true;
        }

        foreach ($this->rows as $row) {
            if ($row->wheelConfigId === $wheelConfigId) {
                return true;
            }
        }

        return false;
    }

    public function findWheelConfig(int $wheelConfigId): ?WheelConfigRecord
    {
        foreach ($this->configs as $config) {
            if ($config->id === $wheelConfigId) {
                return $config;
            }
        }

        return null;
    }

    public function withRows(FitmentRow ...$rows): self
    {
        return new self(array_values($rows), $this->configs, $this->configsWithAnyDocument);
    }

    /** Documents exist for this config, but none of their rows covers the vehicle asked about. */
    public function withDocumentButNoRows(int $wheelConfigId): self
    {
        return new self([], $this->configs, [$wheelConfigId]);
    }
}
