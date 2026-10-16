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
     * @param  string|null  $textDe  the code's sentence as its document prints it — named in the answer when the code keeps a car out (512a)
     */
    public function __construct(
        public string $code,
        public string $kind,
        public array $bodyForms = [],
        public ?string $driveMode = null,
        public ?string $drive = null,
        public ?string $textDe = null,
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

    /**
     * The codes that keep this vehicle out, so the answer can name them (the operator's brief of 17.10.2026 §1: a total
     * refusal names its condition in the verdict's reason): the body-style codes together, where its body style is none
     * of theirs; the „nicht mit“ code of its drive, or else the „nur mit“ codes that leave its drive out. Empty where
     * these codes do not exclude it.
     *
     * @param  list<self>  $filters
     * @return list<self>
     */
    public static function refusing(array $filters, VehicleRecord $vehicle): array
    {
        if (self::admitAll($filters, $vehicle) !== false) {
            return [];
        }

        $bodies = array_values(array_filter($filters, static fn (self $f): bool => $f->kind === self::BODY_FORM));
        $drives = array_values(array_filter($filters, static fn (self $f): bool => $f->kind === self::DRIVE));
        $out = [];

        if ($bodies !== [] && self::admitAll($bodies, $vehicle) === false) {
            $out = $bodies;
        }

        if ($drives !== [] && self::admitAll($drives, $vehicle) === false) {
            $drive = self::known($vehicle->driveAxle);
            $not = array_values(array_filter($drives, static fn (self $f): bool => $f->driveMode === 'not' && $f->drive !== null && self::normalise($f->drive) === $drive));

            $out = [...$out, ...($not !== [] ? $not : array_values(array_filter($drives, static fn (self $f): bool => $f->driveMode === 'only')))];
        }

        return $out;
    }

    /**
     * Which of the car's own facts these codes would need and the car does not have — `bodyForm`, `driveAxle` —
     * so the customer is asked for exactly that (the operator's last prompt §1.1, EF-01). A code whose own
     * parameter is missing is not the customer's to answer, and codes that admit every body style or drive
     * need neither.
     *
     * @param  list<self>  $filters
     * @return list<string>
     */
    public static function openFacts(array $filters, VehicleRecord $vehicle): array
    {
        $bodies = [];
        $bodyCodes = false;
        $driveCodes = false;
        $only = [];
        $not = false;

        foreach ($filters as $filter) {
            if ($filter->kind === self::BODY_FORM && $filter->bodyForms !== []) {
                $bodyCodes = true;

                foreach ($filter->bodyForms as $form) {
                    $bodies[self::normalise($form)] = true;
                }
            }

            if ($filter->kind === self::DRIVE && $filter->drive !== null && in_array($filter->driveMode, ['only', 'not'], true)
                && self::normalise($filter->drive) !== 'allradlenkung') {
                $driveCodes = true;

                if ($filter->driveMode === 'only') {
                    $only[self::normalise($filter->drive)] = true;
                } else {
                    $not = true;
                }
            }
        }

        $everyBody = array_diff(array_map(self::normalise(...), self::BODY_FORMS), array_keys($bodies)) === [];
        $everyDrive = ! $not && array_diff(array_map(self::normalise(...), self::DRIVE_AXLES), array_keys($only)) === [];
        $open = [];

        if ($bodyCodes && ! $everyBody && self::known($vehicle->bodyForm) === null) {
            $open[] = 'bodyForm';
        }

        if ($driveCodes && ! $everyDrive && self::known($vehicle->driveAxle) === null) {
            $open[] = 'driveAxle';
        }

        return $open;
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
