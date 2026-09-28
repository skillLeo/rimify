<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * An Auflage that is not a sentence but a narrowing of the row: only these body styles (`Cpe`, `Cbo`), or
 * only with / not with a drive (the Borbet brief §2.3). A person entered its parameter from the document;
 * the engine never reads it from the sentence.
 *
 * `decide()` answers three ways: the vehicle passes, it is excluded, or we cannot tell — a filter without
 * its parameter, or a vehicle whose body style or drive we do not hold. „Cannot tell“ is never a pass.
 */
final readonly class RowFilter
{
    public const BODY_FORM = 'karosserieform';

    public const DRIVE = 'antrieb';

    /**
     * @param  list<string>  $bodyForms  for BODY_FORM: the body styles permitted
     * @param  string|null  $driveMode  for DRIVE: `only` or `not`
     */
    public function __construct(
        public string $code,
        public string $kind,
        public array $bodyForms = [],
        public ?string $driveMode = null,
        public ?string $drive = null,
    ) {}

    /** True: the vehicle is covered. False: excluded. Null: we cannot tell. */
    public function decide(VehicleRecord $vehicle): ?bool
    {
        if ($this->kind === self::BODY_FORM) {
            if ($this->bodyForms === [] || $vehicle->bodyForm === null || trim($vehicle->bodyForm) === '') {
                return null;
            }

            return in_array(self::normalise($vehicle->bodyForm), array_map(self::normalise(...), $this->bodyForms), true);
        }

        if ($this->kind === self::DRIVE) {
            if ($this->drive === null || ! in_array($this->driveMode, ['only', 'not'], true) || $vehicle->driveAxle === null || trim($vehicle->driveAxle) === '') {
                return null;
            }

            // Four-wheel steering is not a drive axle: no vehicle record says whether a car has it.
            if (self::normalise($this->drive) === 'allradlenkung') {
                return null;
            }

            $same = self::normalise($vehicle->driveAxle) === self::normalise($this->drive);

            return $this->driveMode === 'only' ? $same : ! $same;
        }

        return null;
    }

    /** `Coupé` and `Coupe`, `SUV` and `suv`: one word. */
    private static function normalise(string $value): string
    {
        return mb_strtolower(strtr(trim($value), ['é' => 'e', 'É' => 'e']));
    }
}
