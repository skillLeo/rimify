<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\MixedPair;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;

/**
 * Every car × rim pair the fitments name, with what the shop answers for it — the verdict, and the Komplettrad as the
 * combinations it may be sold in —, so the carry-over of his admin item 19 (D-358) can be held to changing none of them:
 * read before it as the shop read the lists then (EloquentFitmentRepository::beforeEntries()) and per entry after it.
 *
 * Left out of the comparison: the snapshot (when it was read, and the catalogue's version, which the carry-over itself
 * moves). A combination is named by its number and sizes, never by its row: a further entry's copy is a new row with
 * the same content.
 */
final class CombinationCensus
{
    public function __construct(
        private readonly VehicleRepository $vehicles,
        private readonly LoadIndexDeriver $loadIndex,
        private readonly SpeedSymbolDeriver $speedSymbol,
        private readonly Clock $clock,
        private readonly TyreEligibility $eligibility,
    ) {}

    /**
     * @param  bool  $listedOnly  only the pairs a document with a list of combinations reaches — the only ones a
     *                            carry-over can touch
     * @return array<string, array<string, mixed>> keyed `vehicle:config`, in that order
     */
    public function take(EloquentFitmentRepository $fitments, bool $listedOnly = false): array
    {
        $resolver = new FitmentResolver($this->vehicles, $fitments, $this->loadIndex, $this->speedSymbol, $this->clock);
        $pairs = Fitment::query()
            ->when($listedOnly, static fn ($q) => $q->whereIn('approval_document_id', DocumentTyreCombination::query()->select('approval_document_id')))
            ->distinct()
            ->orderBy('vehicle_id')
            ->orderBy('wheel_config_id')
            ->get(['vehicle_id', 'wheel_config_id']);

        $census = [];

        foreach ($pairs->groupBy('vehicle_id') as $vehicleId => $rows) {
            $configIds = $rows->map(static fn (Fitment $row): int => (int) $row->wheel_config_id)->values()->all();

            foreach ($resolver->resolveMany((int) $vehicleId, $configIds) as $configId => $verdict) {
                $census[$vehicleId.':'.$configId] = $this->read($verdict);
            }
        }

        return $census;
    }

    /** @return array<string, mixed> */
    private function read(FitmentVerdict $verdict): array
    {
        $answer = $verdict->toArray();
        unset($answer['snapshot']);
        // The Komplettrad as it would be offered, whatever the shelves hold: four of one size or the combinations.
        $offer = $this->eligibility->offerFor($verdict, false);
        $mixed = $this->eligibility->mixedOfferFor($verdict, false);

        return [
            'verdict' => $answer,
            'komplettrad' => $offer->refusal?->value,
            'combinations' => [
                'refusal' => $mixed->refusal?->value,
                'listed' => $mixed->listed,
                'sourcePage' => $mixed->sourcePage,
                'pairs' => array_map(static fn (MixedPair $pair): string => 'Nr. '.$pair->pairing->number.': '.$pair->front->labelDe().' | '.$pair->rear->labelDe(), $mixed->pairs),
            ],
        ];
    }
}
