<?php

declare(strict_types=1);

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Inertia\Testing\AssertableInertia;

/*
 * D-243 — an error page opened on purpose (`/__fehlerseite/{status}`): the 500 above all, which otherwise takes a real failure
 * to see. In a test environment it is the page the exception handler builds; in the live shop the address does not exist.
 */

it('opens the 500 page the shop shows on a failure, inside its frame', function (): void {
    $this->get('/__fehlerseite/500')
        ->assertStatus(500)
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Fehler/Index')->where('status', 500)->has('reloadHref'));
});

it('opens the standalone 500 page a failed boot gets, which needs neither bundle nor database', function (): void {
    $this->get('/__fehlerseite/500?eigenstaendig=1')
        ->assertStatus(500)
        ->assertSee('Da ist etwas schiefgelaufen.')
        ->assertDontSee('data-page=', false);
});

it('opens every page the shop wrote sentences for, and nothing else', function (int $status): void {
    expect($this->get("/__fehlerseite/{$status}")->getStatusCode())->toBe($status);
})->with([403, 404, 429, 500, 503]);

it('answers an address it has no page for with the 404 every unknown one gets', function (): void {
    $this->get('/__fehlerseite/418')->assertNotFound();
    $this->get('/__fehlerseite/200')->assertNotFound();
});

it('does not exist in the live shop', function (): void {
    app()->detectEnvironment(static fn (): string => 'production');

    try {
        $this->withoutMiddleware(PreventRequestForgery::class)->get('/__fehlerseite/500')->assertNotFound();
    } finally {
        app()->detectEnvironment(static fn (): string => 'testing');
    }
});
