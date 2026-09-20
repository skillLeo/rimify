<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

/**
 * The four header presentations of the vehicle-context state machine (spec §5.1).
 *
 * The white box and the blue bar are mutually exclusive BY CONSTRUCTION: the header renders from
 * this single value, so no combination of route and stored state can ever show both (R-08).
 */
enum HeaderMode: string
{
    /** No vehicle, or a vehicle that has not yet entered the booking process. */
    case Plain = 'PLAIN';

    /** Vehicle set and the route is inside the booking process (PLP, PDP, Warenkorb). */
    case WhiteBox = 'WHITE_BOX';

    /** Vehicle set, outside the booking process, after the listing has been seen. */
    case BlueBar = 'BLUE_BAR';

    /** Checkout and order confirmation: reduced chrome, no vehicle presentation at all. */
    case Suppressed = 'SUPPRESSED';
}
