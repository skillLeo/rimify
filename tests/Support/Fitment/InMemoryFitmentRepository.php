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

    /**
     * @param  list<int>  $wheelConfigIds
     * @return array<int, list<FitmentRow>>
     */
    public function publishedRowsFor(int $vehicleId, array $wheelConfigIds): array
    {
        $byConfig = array_fill_keys($wheelConfigIds, []);

        foreach ($this->rows as $row) {
            if ($row->vehicleId === $vehicleId && in_array($row->wheelConfigId, $wheelConfigIds, true)) {
                $byConfig[$row->wheelConfigId][] = $row;
            }
        }

        return $byConfig;
    }

    /**
     * @param  list<int>  $wheelConfigIds
     * @return list<int>
     */
    public function configsWithPublishedDocument(array $wheelConfigIds): array
    {
        $documented = $this->configsWithAnyDocument;

        foreach ($this->rows as $row) {
            $documented[] = $row->wheelConfigId;
        }

        return array_values(array_intersect($wheelConfigIds, $documented));
    }

    /**
     * @param  list<int>  $wheelConfigIds
     * @return array<int, WheelConfigRecord>
     */
    public function findWheelConfigs(array $wheelConfigIds): array
    {
        $found = [];

        foreach ($this->configs as $config) {
            if (in_array($config->id, $wheelConfigIds, true)) {
                $found[$config->id] = $config;
            }
        }

        return $found;
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
