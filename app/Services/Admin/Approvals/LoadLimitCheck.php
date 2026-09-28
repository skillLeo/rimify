<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Support\GermanFormat;

/**
 * The free cross-check on a load-index Auflage (the operator's review of C9, §3): every limit a Gutachten
 * states is exactly twice the capacity of its load index — T88 → 2 × 560 kg = 1.120 kg, fourteen out of
 * fourteen in ABE 55255. A limit that is not twice a capacity from the table, or not twice the capacity of
 * the index its code names, is a typing error, and it is refused where it is typed, in words.
 */
final readonly class LoadLimitCheck
{
    public function __construct(private LoadIndexDeriver $loadIndex) {}

    /** Null when the limit reads; otherwise the sentence the person sees under the field. */
    public function problem(string $code, int $kg): ?string
    {
        $named = self::indexNamedBy($code);

        if ($named !== null) {
            $capacity = $this->loadIndex->capacityOf($named);

            if ($capacity !== null && $kg !== 2 * $capacity) {
                return sprintf(
                    '%s steht für Tragfähigkeitsindex %d: das sind 2 × %s = %s. Bitte prüf die Zahl im Gutachten.',
                    $code,
                    $named,
                    GermanFormat::kilograms($capacity),
                    GermanFormat::kilograms(2 * $capacity),
                );
            }

            return null;
        }

        if ($kg % 2 !== 0 || $this->loadIndex->indexForCapacity(intdiv($kg, 2)) === null) {
            return sprintf(
                '%s ist nicht das Doppelte einer Tragfähigkeit aus der Tabelle — so eine Grenze druckt kein Gutachten. Bitte prüf die Zahl.',
                GermanFormat::kilograms($kg),
            );
        }

        return null;
    }

    /** The index a code in the usual form names: T88 → 88, T00 → 100; null for any other code. */
    public static function indexNamedBy(string $code): ?int
    {
        if (preg_match('/^T(\d{2})$/', strtoupper(trim($code)), $m) !== 1) {
            return null;
        }

        return (int) $m[1] === 0 ? 100 : (int) $m[1];
    }
}
