<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

use JsonException;

/**
 * What the `rmf_vehicle` cookie carries: the vehicle id and whether the visitor has entered the
 * booking process. No name, no address, no identifier that outlives the selection — which keeps
 * it outside consent-requiring categories (spec §5.2). Laravel encrypts and authenticates
 * the cookie, so the payload cannot be forged or read client-side.
 */
final readonly class VehicleContext
{
    public const COOKIE = 'rmf_vehicle';

    /** 90 days, rolling. */
    public const LIFETIME_MINUTES = 60 * 24 * 90;

    public function __construct(
        public int $vehicleId,
        public bool $hasEnteredBooking = false,
    ) {}

    /**
     * Anything malformed decodes to null: a broken cookie means "no vehicle", never an error page.
     */
    public static function decode(?string $payload): ?self
    {
        if ($payload === null || $payload === '') {
            return null;
        }

        try {
            $data = json_decode($payload, true, 4, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        if (! is_array($data) || ! isset($data['v']) || ! is_int($data['v']) || $data['v'] < 1) {
            return null;
        }

        return new self($data['v'], ($data['b'] ?? false) === true);
    }

    public function encode(): string
    {
        return json_encode(['v' => $this->vehicleId, 'b' => $this->hasEnteredBooking], JSON_THROW_ON_ERROR);
    }

    public function enteredBooking(): self
    {
        return $this->hasEnteredBooking ? $this : new self($this->vehicleId, true);
    }

    /** Selecting a different vehicle keeps the booking flag: the visitor has already seen a listing. */
    public function withVehicle(int $vehicleId): self
    {
        return new self($vehicleId, $this->hasEnteredBooking);
    }
}
