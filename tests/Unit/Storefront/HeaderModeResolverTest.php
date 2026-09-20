<?php

declare(strict_types=1);

use App\Domain\Storefront\HeaderMode;
use App\Domain\Storefront\HeaderModeResolver;

/*
 * R-08 and the client's own Figma annotation: the white box and the blue bar are mutually
 * exclusive, the header is decided on the server, and checkout/confirmation suppress it.
 */

dataset('routes', [
    'startseite', 'felgen-suchen', 'felgen.index', 'felgen.show', 'felgen.fuer', 'warenkorb.index',
    'kasse.index', 'kasse.store', 'bestellung.show', 'rimify-check.index', 'check.show', 'faq',
    'kontakt', 'rechtliches', 'admin.dashboard', 'does.not.exist',
]);

it('shows a plain header without a vehicle on every non-checkout route', function (string $route): void {
    $mode = (new HeaderModeResolver)->resolve(false, $route, true);

    expect($mode)->toBe(
        in_array($route, HeaderModeResolver::SUPPRESSED_ROUTES, true) ? HeaderMode::Suppressed : HeaderMode::Plain
    );
})->with('routes');

it('shows the white box only inside the booking process', function (string $route): void {
    $mode = (new HeaderModeResolver)->resolve(true, $route, true);

    expect($mode === HeaderMode::WhiteBox)->toBe(in_array($route, HeaderModeResolver::BOOKING_ROUTES, true));
})->with('routes');

it('shows the blue bar outside the booking process once the listing has been seen', function (): void {
    $resolver = new HeaderModeResolver;

    expect($resolver->resolve(true, 'faq', true))->toBe(HeaderMode::BlueBar)
        ->and($resolver->resolve(true, 'kontakt', true))->toBe(HeaderMode::BlueBar)
        ->and($resolver->resolve(true, 'startseite', true))->toBe(HeaderMode::BlueBar);
});

it('implements the literal Figma rule for edge case E3 by default', function (): void {
    // Vehicle stored, but the visitor has never entered the booking process: plain header.
    expect((new HeaderModeResolver)->resolve(true, 'faq', false))->toBe(HeaderMode::Plain);
});

it('can switch edge case E3 to "blue bar whenever a vehicle is set" with one flag', function (): void {
    $resolver = new HeaderModeResolver(blueBarBeforeBooking: true);

    expect($resolver->resolve(true, 'faq', false))->toBe(HeaderMode::BlueBar)
        ->and($resolver->resolve(true, 'felgen.index', false))->toBe(HeaderMode::WhiteBox)
        ->and($resolver->resolve(false, 'faq', false))->toBe(HeaderMode::Plain);
});

it('suppresses the header on checkout and confirmation whatever the state', function (string $route): void {
    foreach ([true, false] as $vehicle) {
        foreach ([true, false] as $seen) {
            foreach ([true, false] as $flag) {
                expect((new HeaderModeResolver($flag))->resolve($vehicle, $route, $seen))->toBe(HeaderMode::Suppressed);
            }
        }
    }
})->with(HeaderModeResolver::SUPPRESSED_ROUTES);

it('never yields the white box and the blue bar for the same state — exhaustively', function (): void {
    $routes = ['startseite', 'felgen-suchen', 'felgen.index', 'felgen.show', 'felgen.fuer', 'warenkorb.index',
        'kasse.index', 'kasse.store', 'bestellung.show', 'rimify-check.index', 'check.show', 'faq', 'kontakt',
        'rechtliches', null];
    $seenModes = [];

    foreach ([true, false] as $flag) {
        foreach ([true, false] as $vehicle) {
            foreach ([true, false] as $entered) {
                foreach ($routes as $route) {
                    $mode = (new HeaderModeResolver($flag))->resolve($vehicle, $route, $entered);
                    $seenModes[$mode->value] = true;

                    // One value per state is the structural guarantee; assert the semantics too.
                    if ($mode === HeaderMode::WhiteBox) {
                        expect($vehicle)->toBeTrue()->and(HeaderModeResolver::isBookingRoute($route))->toBeTrue();
                    }

                    if ($mode === HeaderMode::BlueBar) {
                        expect($vehicle)->toBeTrue()->and(HeaderModeResolver::isBookingRoute($route))->toBeFalse();
                    }
                }
            }
        }
    }

    expect(array_keys($seenModes))->toEqualCanonicalizing(['PLAIN', 'WHITE_BOX', 'BLUE_BAR', 'SUPPRESSED']);
});

it('treats an unnamed route as outside the booking process', function (): void {
    expect((new HeaderModeResolver)->resolve(true, null, true))->toBe(HeaderMode::BlueBar)
        ->and((new HeaderModeResolver)->resolve(false, null, true))->toBe(HeaderMode::Plain);
});
