<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Verdict\FitmentVerdict;

/**
 * Which versions of a rim a car's released papers name together, front and rear (`fitment_wheel_sets`), read over the engine's
 * own verdicts, which it never changes. Rows a customer may not be shown form no set: the repository's boundary holds.
 *
 * A version goes on the car as four only where the verdict for it permits sizes on both axles and the papers do not name it only
 * as part of a set. A rim the car may have on one axle alone is never four: a person could otherwise buy four rear rims.
 */
final class WheelSets
{
    public function __construct(
        private readonly FitmentRepository $rows,
        private readonly FitmentResolver $resolver,
    ) {}

    /**
     * @param  array<int, FitmentVerdict>  $verdicts  the engine's verdicts by configuration id, as the caller holds them
     */
    public function of(int $vehicleId, array $verdicts): WheelSetOffer
    {
        $pairs = $this->rows->wheelSetsFor($vehicleId, array_keys($verdicts));
        $partners = [];

        foreach ($pairs as ['front' => $front, 'rear' => $rear]) {
            foreach ([$front, $rear] as $id) {
                if (! isset($verdicts[$id])) {
                    $partners[$id] = $id;
                }
            }
        }

        $all = $partners === [] ? $verdicts : $verdicts + $this->resolver->resolveMany($vehicleId, array_values($partners));
        $sets = [];
        $inSet = [];
        $alsoSame = [];

        foreach ($pairs as ['front' => $front, 'rear' => $rear]) {
            if ($front === $rear) {
                $alsoSame[$front] = true;

                continue;
            }

            $inSet[$front] = true;
            $inSet[$rear] = true;

            if (isset($all[$front], $all[$rear])) {
                $sets[] = new WheelSet($front, $rear, $all[$front], $all[$rear]);
            }
        }

        $only = [];

        foreach ($verdicts as $id => $verdict) {
            $oneAxle = $verdict->front->hasPermittedSizes() !== $verdict->rear->hasPermittedSizes();

            if ($oneAxle || (isset($inSet[$id]) && ! isset($alsoSame[$id]))) {
                $only[$id] = true;
            }
        }

        return new WheelSetOffer($sets, $only);
    }

    /** This set, where the car's papers name it; null where they do not, or where a row of it is no longer shown. */
    public function find(int $vehicleId, int $frontConfigId, int $rearConfigId): ?WheelSet
    {
        foreach ($this->rows->wheelSetsFor($vehicleId, [$frontConfigId, $rearConfigId]) as ['front' => $front, 'rear' => $rear]) {
            if ($front === $frontConfigId && $rear === $rearConfigId && $front !== $rear) {
                $verdicts = $this->resolver->resolveMany($vehicleId, [$front, $rear]);

                return isset($verdicts[$front], $verdicts[$rear]) ? new WheelSet($front, $rear, $verdicts[$front], $verdicts[$rear]) : null;
            }
        }

        return null;
    }
}
