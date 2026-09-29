<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * A car's body style and drive where the vehicle data holds none (the operator's last prompt §1.1). Most cars a
 * Gutachten names are typed from the document itself, without either; a row printed for „Kombi“ or „nur mit
 * Allradantrieb“ then could not be answered, and the shop said „Keine Freigabe hinterlegt“ for most of them.
 *
 * Derived first, asked second: a value comes from the vehicle data where it has one; otherwise from what the
 * owner told us (the same `rmf_papiere` cookie as 8.1, 8.2 and T); otherwise from an unambiguous word of the
 * car's name (BuildFromName) — shown to the customer as such, with „stimmt das?“ and one click to change it.
 * Every verdict carries where each value came from.
 */
final readonly class VehicleBuild
{
    public const FROM_CUSTOMER = 'customer';

    public const FROM_NAME = 'name';

    private function __construct(
        public ?string $bodyForm,
        public ?string $driveAxle,
    ) {}

    /** Null when neither is one the engine knows: no answer rather than a made-up one. */
    public static function tryFrom(?string $bodyForm, ?string $driveAxle): ?self
    {
        $body = in_array($bodyForm, RowFilter::BODY_FORMS, true) ? $bodyForm : null;
        $drive = in_array($driveAxle, RowFilter::DRIVE_AXLES, true) ? $driveAxle : null;

        return $body === null && $drive === null ? null : new self($body, $drive);
    }

    /**
     * The car as the engine reads it: the vehicle data's own values stand; a gap is filled from the owner's
     * answer, else from the name, and says which.
     */
    public static function overlay(VehicleRecord $vehicle, ?self $answer): VehicleRecord
    {
        if ($vehicle->bodyForm !== null && $vehicle->driveAxle !== null) {
            return $vehicle;
        }

        $name = BuildFromName::of($vehicle->model, $vehicle->variant);
        [$body, $bodySource] = self::fill($vehicle->bodyForm, $vehicle->bodyFormSource, $answer?->bodyForm, $name['bodyForm']);
        [$drive, $driveSource] = self::fill($vehicle->driveAxle, $vehicle->driveAxleSource, $answer?->driveAxle, $name['driveAxle']);

        return $vehicle->withBuild($body, $bodySource, $drive, $driveSource);
    }

    /** @return array{0: string|null, 1: string|null} */
    private static function fill(?string $data, ?string $dataSource, ?string $customer, ?string $derived): array
    {
        return match (true) {
            $data !== null => [$data, $dataSource],
            $customer !== null => [$customer, self::FROM_CUSTOMER],
            $derived !== null => [$derived, self::FROM_NAME],
            default => [null, null],
        };
    }
}
