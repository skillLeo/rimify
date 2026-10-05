<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
 * The operator's brief of 05.10.2026, §5: the shop's documents and page data leave the app gzipped at level 6, so no
 * browser gets them at the host's weakest brotli (CompressDocuments). Everything else goes out as it is.
 */

beforeEach(function (): void {
    Route::middleware('web')->get('/_compress/html', fn () => response(str_repeat('<p>Felgen, die an dein Auto dürfen.</p>', 200)));
    Route::middleware('web')->get('/_compress/json', fn () => response()->json(['props' => array_fill(0, 200, 'Gutachten')]));
    Route::middleware('web')->get('/_compress/small', fn () => response('<p>kurz</p>'));
    Route::middleware('web')->get('/_compress/pdf', fn () => response(str_repeat('%PDF-1.7 ', 500), 200, ['Content-Type' => 'application/pdf']));
    Route::middleware('web')->get('/_compress/stream', fn () => response()->streamDownload(fn () => print (str_repeat('a;b;c'."\n", 500)), 'liste.csv'));
});

it('gzips a document for a browser that takes gzip, and says so in its headers', function (): void {
    $response = $this->get('/_compress/html', ['Accept-Encoding' => 'gzip, deflate, br, zstd'])->assertOk();
    $body = (string) $response->getContent();

    expect($response->headers->get('Content-Encoding'))->toBe('gzip')
        ->and(gzdecode($body))->toBe(str_repeat('<p>Felgen, die an dein Auto dürfen.</p>', 200))
        ->and($response->headers->get('Content-Length'))->toBe((string) strlen($body))
        // Caches keep the two answers apart, and the device split stays in the same header.
        ->and($response->headers->get('Vary'))->toContain('Accept-Encoding')->toContain('User-Agent');
});

it('gzips the page data an Inertia visit fetches', function (): void {
    $response = $this->get('/_compress/json', ['Accept-Encoding' => 'gzip'])->assertOk();

    expect($response->headers->get('Content-Encoding'))->toBe('gzip')
        ->and(json_decode((string) gzdecode((string) $response->getContent()), true)['props'])->toHaveCount(200);
});

it('sends everything else as it is', function (string $path, array $headers): void {
    $response = $this->get($path, $headers)->assertOk();

    expect($response->headers->has('Content-Encoding'))->toBeFalse();
})->with([
    'a browser that takes no gzip' => ['/_compress/html', ['Accept-Encoding' => 'identity']],
    'no Accept-Encoding at all' => ['/_compress/html', []],
    'a response too small to gain' => ['/_compress/small', ['Accept-Encoding' => 'gzip']],
    'a PDF' => ['/_compress/pdf', ['Accept-Encoding' => 'gzip']],
    'a stream' => ['/_compress/stream', ['Accept-Encoding' => 'gzip']],
]);

it('serves a real page gzipped, whole underneath', function (): void {
    $response = $this->get('/rechtliches/impressum', ['Accept-Encoding' => 'gzip, br'])->assertOk();
    $document = (string) gzdecode((string) $response->getContent());

    expect($response->headers->get('Content-Encoding'))->toBe('gzip')
        ->and($document)->toStartWith('<!DOCTYPE html>')
        ->toContain('<meta http-equiv="Content-Security-Policy"')
        ->toContain('Rechtliches\/Index')
        ->toContain('</html>');
});
