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

// The shared host reaches no port a customer's process opens: there the renderer listens on a socket file (D-047).
it('asks the renderer through its socket where it listens on one', function (): void {
    config(['rimify.ssr.socket' => '/home/shop/storage/framework/ssr.sock']);
    Http::fake(['http://localhost/render' => Http::response(['head' => [], 'body' => '<div id="app">über den Socket</div>'])]);

    expect(app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []])?->body)->toBe('<div id="app">über den Socket</div>')
        ->and(BoundedSsrGateway::client(BoundedSsrGateway::socket())->getOptions()['curl'][CURLOPT_UNIX_SOCKET_PATH])->toBe('/home/shop/storage/framework/ssr.sock')
        // Without one, the TCP address as before, and no socket option.
        ->and(BoundedSsrGateway::client(null)->getOptions())->not->toHaveKey('curl');

    config(['rimify.ssr.socket' => '']);
    expect(BoundedSsrGateway::socket())->toBeNull();
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

// The watchdog's restart creates the socket anew: the first page after it is rendered again, not one up to 30 s later.
it('asks a renderer started after the pause began at once, and rests one that was not restarted', function (): void {
    $socket = tempnam(sys_get_temp_dir(), 'ssr');
    touch($socket, time() - 120);
    config(['rimify.ssr.socket' => $socket]);
    $up = false;
    Http::fake(['http://localhost/render' => function () use (&$up) {
        if (! $up) {
            throw new ConnectionException('Connection refused');
        }

        return Http::response(['head' => [], 'body' => '<div id="app">neu gestartet</div>']);
    }]);

    try {
        expect(app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []]))->toBeNull()
            ->and(BoundedSsrGateway::paused())->toBeTrue();

        // The old socket file, still there from the renderer that stopped: the rest holds.
        expect(BoundedSsrGateway::paused())->toBeTrue();

        // The watchdog started a new renderer: its socket is newer than the rest.
        touch($socket, time() + 1);
        $up = true;
        expect(BoundedSsrGateway::paused())->toBeFalse()
            ->and(app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []])?->body)->toBe('<div id="app">neu gestartet</div>');
    } finally {
        @unlink($socket);
    }
});
