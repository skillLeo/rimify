<?php

declare(strict_types=1);

namespace App\Observers;

use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use App\Models\FitmentConflict;
use App\Services\Admin\AdminAlerts;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Throwable;

/**
 * Tells the team when two documents are found to disagree. The conflict itself stays on the
 * dashboard until it is resolved; the alert is only the knock on the door — and names the car and
 * the Felge, so two conflicts in one morning are two different sentences.
 */
class ConflictAlertObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(private readonly AdminAlerts $alerts) {}

    public function created(FitmentConflict $conflict): void
    {
        if ($conflict->status !== ConflictStatus::Open) {
            return;
        }

        $vehicle = self::vehicle($conflict);
        $wheel = self::wheel($conflict);

        // Until someone decides, the shop answers „Unbekannt“ where the documents' answers differ
        // (the corrections memo §3) — never the stricter one by itself.
        $until = ' Bis jemand unter Konflikte entscheidet, sagt der Shop dazu „Unbekannt“.';
        $disagreement = match ($conflict->kind) {
            ConflictKind::EntryRequirement => 'Eines verlangt eine Eintragung, das andere nicht.'.$until,
            ConflictKind::TyreSizes => 'Sie nennen verschiedene Reifengrößen.'.$until,
            ConflictKind::WidthEtRange => 'Sie nennen verschiedene Felgenbreiten oder Einpresstiefen.',
            ConflictKind::Conditions => 'Sie nennen verschiedene Auflagen.'.$until,
        };

        $this->alerts->send(
            'conflict_opened',
            $vehicle === null ? 'Zwei Gutachten widersprechen sich.' : "Zwei Gutachten widersprechen sich beim {$vehicle}.",
            $wheel === null ? $disagreement : "{$wheel}: {$disagreement}",
            ['route' => 'admin.konflikte.show', 'params' => ['conflict' => (int) $conflict->getKey()]],
        );
    }

    /** `BMW 3er 320d`, or null when the vehicle cannot be read — the sentence then goes without it. */
    private static function vehicle(FitmentConflict $conflict): ?string
    {
        $vehicle = $conflict->vehicle;

        if ($vehicle === null) {
            return null;
        }

        $name = VehicleName::from($vehicle);

        return $name === '' ? null : $name;
    }

    /** `Rotor 8,5J × 18 · ET 35`, the wheel as the catalogue names it and as a Gutachten measures it. */
    private static function wheel(FitmentConflict $conflict): ?string
    {
        try {
            $config = $conflict->wheelConfig;

            if ($config === null) {
                return null;
            }

            $size = GermanFormat::wheelSize($config->width_in, $config->diameter_in, $config->et_mm);
            $model = $config->wheelModel;

            return is_string($model?->name) && $model->name !== '' ? "{$model->name} {$size}" : $size;
        } catch (Throwable) {
            return null;
        }
    }
}
