<?php

declare(strict_types=1);

use App\Support\Ssr\BoundedSsrGateway;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\Gateway;
use Inertia\Ssr\HttpGateway;

/**
 * Server-side rendering can never make a page slow (BoundedSsrGateway): short bounds on every call,
 * and a renderer that failed is left alone for a while instead of being asked — and waited for —
 * on every page.
 */
beforeEach(function (): void {
    config([
        'inertia.ssr.enabled' => true,
        'inertia.ssr.ensure_bundle_exists' => false,
        'rimify.ssr' => ['connect_timeout' => 0.5, 'timeout' => 2.5, 'pause' => 30],
    ]);
    Cache::forget(BoundedSsrGateway::PAUSE_KEY);
});

it('is the gateway Inertia uses', function (): void {
    expect(app(Gateway::class))->toBeInstanceOf(BoundedSsrGateway::class)
        ->and(app(HttpGateway::class))->toBeInstanceOf(BoundedSsrGateway::class);
});

it('renders with short bounds when the renderer answers', function (): void {
    Http::fake(['*/render' => Http::response(['head' => ['<title>RIMIFY</title>'], 'body' => '<div id="app">SSR</div>'])]);

    $response = app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []]);

    expect($response?->body)->toBe('<div id="app">SSR</div>');
    Http::assertSent(fn (ClientRequest $request): bool => str_ends_with($request->url(), '/render'));
});

it('falls back at once when the renderer is gone, and does not ask again for a while', function (): void {
    $calls = 0;
    $up = false;
    Http::fake(['*/render' => function () use (&$calls, &$up) {
        $calls++;

        if (! $up) {
            throw new ConnectionException('Connection refused');
        }

        return Http::response(['head' => [], 'body' => '<div id="app">wieder da</div>']);
    }]);

    expect(app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []]))->toBeNull()
        ->and(BoundedSsrGateway::paused())->toBeTrue();

    // The next pages go without asking: one failed call, not one per page.
    app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []]);
    app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []]);
    expect($calls)->toBe(1);

    // After the pause it is asked again.
    Cache::forget(BoundedSsrGateway::PAUSE_KEY);
    $up = true;
    expect(app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []])?->body)->toBe('<div id="app">wieder da</div>');
});
