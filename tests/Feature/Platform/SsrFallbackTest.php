<?php

declare(strict_types=1);

use App\Services\Admin\SystemHealth;
use App\Support\Ssr\BoundedSsrGateway;
use App\Support\Ssr\SsrFallbacks;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Ssr\Gateway;

/**
 * A page sent without server rendering is never invisible (the launch release §3): each one is
 * logged with its address and why, counted for the day, and System › Zustand turns amber while it
 * keeps happening.
 */
beforeEach(function (): void {
    config([
        'inertia.ssr.enabled' => true,
        'inertia.ssr.ensure_bundle_exists' => false,
        'rimify.ssr' => ['connect_timeout' => 0.5, 'timeout' => 2.5, 'pause' => 30],
    ]);
    Cache::flush();
});

function ssrPage(string $path): Request
{
    return Request::create($path, 'GET');
}

it('logs, counts and remembers every page sent without server rendering', function (): void {
    Log::spy();
    Http::fake(['*/render' => fn () => throw new ConnectionException('Connection refused')]);

    app(Gateway::class)->dispatch(['component' => 'Felgen/Index', 'props' => []], ssrPage('/felgen'));
    // The renderer rests now: the next page goes without asking — and is counted too.
    app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []], ssrPage('/faq'));

    expect(SsrFallbacks::today())->toBe(2)
        ->and(SsrFallbacks::last())->toMatchArray(['url' => 'http://localhost/faq', 'reason' => 'Renderer pausiert nach einem Fehler.']);

    Log::shouldHaveReceived('warning')->withArgs(fn (string $message, array $context): bool => str_starts_with($message, 'SSR-Fallback') && $context['url'] === 'http://localhost/felgen')->once();
    Log::shouldHaveReceived('warning')->withArgs(fn (string $message, array $context): bool => $context['url'] === 'http://localhost/faq')->once();
});

it('shows the fallbacks as an amber row in System, with the count and the last address', function (): void {
    SsrFallbacks::record('https://rimify.test/felgen/nordfelge-fjord', 'Renderer nicht erreichbar oder zu langsam: timeout');
    SsrFallbacks::record('https://rimify.test/felgen', 'Renderer pausiert nach einem Fehler.');

    $row = collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'ssr');

    expect($row['state'])->toBe('warn')
        ->and($row['count'])->toBe('2')
        ->and($row['sentence'])->toBe('Heute 2 Seiten ohne Server-Rendering, zuletzt /felgen (Renderer pausiert nach einem Fehler.)');
});

it('is green while every page is server-rendered, and says so when it is switched off', function (): void {
    expect(collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'ssr')['state'])->toBe('ok');

    config(['inertia.ssr.enabled' => false]);
    expect(collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'ssr')['sentence'])
        ->toBe('Server-Rendering ist in dieser Umgebung ausgeschaltet.');
});

it('counts nothing while the renderer answers', function (): void {
    Http::fake(['*/render' => Http::response(['head' => [], 'body' => '<div id="app">ok</div>'])]);

    app(Gateway::class)->dispatch(['component' => 'Faq/Index', 'props' => []], ssrPage('/faq'));

    expect(SsrFallbacks::today())->toBe(0)->and(BoundedSsrGateway::paused())->toBeFalse();
});
