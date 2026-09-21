<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

/**
 * Computes the header mode on the server, from the signed vehicle cookie and the current route,
 * so it ships in the first Inertia response. No client effect may change it after hydration (R-08).
 *
 * Routes are matched by NAME, never by path, so a slug or a query string cannot change the answer.
 */
final readonly class HeaderModeResolver
{
    /** The booking process, exactly as the client's Figma annotation defines it: PLP, PDP, cart. */
    public const BOOKING_ROUTES = ['felgen.index', 'felgen.show', 'felgen.fuer', 'vergleich.index', 'warenkorb.index'];

    /** Checkout and confirmation never show a vehicle presentation (edge case E5). */
    public const SUPPRESSED_ROUTES = ['kasse.index', 'kasse.store', 'bestellung.show'];

    /**
     * @param  bool  $blueBarBeforeBooking  Edge case E3. False (default) is the literal Figma rule:
     *                                      a stored vehicle that has never entered the booking
     *                                      process shows a plain header. True shows the blue bar
     *                                      whenever a vehicle is set outside the booking process.
     */
    public function __construct(private bool $blueBarBeforeBooking = false) {}

    public function resolve(bool $hasVehicle, ?string $routeName, bool $hasEnteredBooking): HeaderMode
    {
        if ($routeName !== null && in_array($routeName, self::SUPPRESSED_ROUTES, true)) {
            return HeaderMode::Suppressed;
        }

        if (! $hasVehicle) {
            return HeaderMode::Plain;
        }

        if ($routeName !== null && in_array($routeName, self::BOOKING_ROUTES, true)) {
            return HeaderMode::WhiteBox;
        }

        return ($hasEnteredBooking || $this->blueBarBeforeBooking)
            ? HeaderMode::BlueBar
            : HeaderMode::Plain;
    }

    public static function isBookingRoute(?string $routeName): bool
    {
        return $routeName !== null && in_array($routeName, self::BOOKING_ROUTES, true);
    }
}
