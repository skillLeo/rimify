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
 *
 * Several of them on one row, or on one tyre size, are read together as the documents print them
 * (`admitAll()`): each body-style code permits its styles, so ABE 55255's „Cbo Cpe“ is a Cabrio OR a
 * Coupé; „nur mit“ drives likewise permit any of theirs; each „nicht mit“ keeps its own drive out.
 */
final readonly class RowFilter
{
    public const BODY_FORM = 'karosserieform';

    public const DRIVE = 'antrieb';

    /** The body styles a vehicle record and a code may name. */
    public const BODY_FORMS = ['Limousine', 'Kombi', 'Coupe', 'Cabrio', 'Schrägheck', 'SUV', 'Roadster', 'Van'];

    /** The drive axles a vehicle record may name. */
    public const DRIVE_AXLES = ['Allrad', 'Vorderachse', 'Hinterachse'];

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
        return self::admitAll([$this], $vehicle);
    }

    /**
     * The codes of one row, or of one tyre size, together. Any exclusion the vehicle's data proves wins;
     * otherwise a code we cannot decide leaves the answer open; otherwise the vehicle is covered.
     *
     * @param  list<self>  $filters
     */
    public static function admitAll(array $filters, VehicleRecord $vehicle): ?bool
    {
        $bodies = [];
        $bodyCodes = false;
        $bodyOpen = false;
        $only = [];
        $not = [];
        $driveCodes = false;
        $driveOpen = false;
        $otherOpen = false;

        foreach ($filters as $filter) {
            if ($filter->kind === self::BODY_FORM) {
                $bodyCodes = true;
                $bodyOpen = $bodyOpen || $filter->bodyForms === [];

                foreach ($filter->bodyForms as $form) {
                    $bodies[self::normalise($form)] = true;
                }

                continue;
            }

            if ($filter->kind !== self::DRIVE) {
                $otherOpen = true;

                continue;
            }

            $driveCodes = true;

            // Four-wheel steering is not a drive axle: no vehicle record says whether a car has it.
            if ($filter->drive === null || ! in_array($filter->driveMode, ['only', 'not'], true) || self::normalise($filter->drive) === 'allradlenkung') {
                $driveOpen = true;

                continue;
            }

            if ($filter->driveMode === 'only') {
                $only[self::normalise($filter->drive)] = true;
            } else {
                $not[self::normalise($filter->drive)] = true;
            }
        }

        $decisions = [];
        // Codes that together let in every body style, or every drive, narrow nothing — the 18″ Nachtrag's
        // „Pkw geschlossen; Cabrio“ — so a vehicle whose style we do not hold passes them.
        $everyBody = ! $bodyOpen && array_diff(array_map(self::normalise(...), self::BODY_FORMS), array_keys($bodies)) === [];
        $everyDrive = ! $driveOpen && $not === [] && array_diff(array_map(self::normalise(...), self::DRIVE_AXLES), array_keys($only)) === [];

        if ($bodyCodes) {
            $body = self::known($vehicle->bodyForm);
            $decisions[] = match (true) {
                $everyBody => true,
                $body === null => null,
                isset($bodies[$body]) => true,
                // A code without its parameter might have let this one in.
                $bodyOpen => null,
                default => false,
            };
        }

        if ($driveCodes) {
            $drive = self::known($vehicle->driveAxle);
            $decisions[] = match (true) {
                $everyDrive => true,
                $drive === null => null,
                isset($not[$drive]) => false,
                $only !== [] && ! isset($only[$drive]) => $driveOpen ? null : false,
                default => $driveOpen ? null : true,
            };
        }

        if ($otherOpen) {
            $decisions[] = null;
        }

        if (in_array(false, $decisions, true)) {
            return false;
        }

        return in_array(null, $decisions, true) ? null : true;
    }

    private static function known(?string $value): ?string
    {
        return $value === null || trim($value) === '' ? null : self::normalise($value);
    }

    /** `Coupé` and `Coupe`, `SUV` and `suv`: one word. */
    private static function normalise(string $value): string
    {
        return mb_strtolower(strtr(trim($value), ['é' => 'e', 'É' => 'e']));
    }
}
