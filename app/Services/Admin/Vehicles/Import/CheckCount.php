<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use App\Services\Admin\Vehicles\VehicleImporter;

/**
 * How far the Probelauf's check against the cars is, counted from what each step decided (VehicleImporter::checkStep)
 * — never by counting the file's rows again after every step, which over half a million rows took longer than the
 * check itself (D-462). The rows the file did not refuse go through the shop's cars; of them, the ones no car carries
 * go on through the cars from a Gutachten.
 */
final class CheckCount
{
    /** @param  array{cars: int, open: int, gutachten: int}  $state */
    public function __construct(private readonly int $eligible, private array $state = ['cars' => 0, 'open' => 0, 'gutachten' => 0]) {}

    /**
     * @param  array{step: string, rows: int, open: int}  $step
     * @return array{step: string, done: int, total: int}
     */
    public function add(array $step): array
    {
        if ($step['step'] === VehicleImporter::STEP_CARS) {
            $this->state['cars'] += $step['rows'];
            $this->state['open'] += $step['open'];

            return ['step' => $step['step'], 'done' => $this->state['cars'], 'total' => $this->eligible];
        }

        $this->state['gutachten'] += $step['rows'];

        return ['step' => $step['step'], 'done' => $this->state['gutachten'], 'total' => $this->state['open']];
    }

    /** @return array{cars: int, open: int, gutachten: int} */
    public function state(): array
    {
        return $this->state;
    }
}
