<?php

declare(strict_types=1);

use App\Console\Commands\Smoke;

/*
 * rimify:smoke never places an order by itself (the operator's rule of 13.10.2026: nothing permanent in the shop the
 * client works in). An order's frozen approval is never deleted (R-12); a release's smoke left a paid test order in the
 * client's preview that day (RMF-2026-0003), because his shop had begun to sell a wheel of its own.
 */

it('orders only where it was asked to by name — never by default, whatever the shop sells', function (bool $demoWheel, bool $sandbox, bool $asked, string $step): void {
    expect(Smoke::orderStep($demoWheel, $sandbox, $asked))->toBe($step);
})->with([
    'the shop\'s own wheel, test payments, not asked' => [false, true, false, 'before'],
    'the shop\'s own wheel, test payments, asked by name' => [false, true, true, 'order'],
    'the acceptance set\'s wheel, asked by name' => [true, true, true, 'demo'],
    'the acceptance set\'s wheel, not asked' => [true, true, false, 'demo'],
    'the acceptance set\'s wheel, no test payment' => [true, false, false, 'none'],
    'no test payment (the live shop), even when asked' => [false, false, true, 'none'],
    'no test payment, not asked' => [false, false, false, 'none'],
]);

it('walks to the point before ordering wherever it may not order but could — the acceptance set\'s wheel too', function (string $step, bool $walks): void {
    // After the client's own entries were taken back (16.10.2026) the acceptance wheel was the preview's only released
    // wheel, and the smoke's checkout row (D-224) vanished from the release with it.
    expect(Smoke::walksToCheckout($step))->toBe($walks);
})->with([
    'the shop\'s own wheel' => ['before', true],
    'the acceptance set\'s wheel' => ['demo', true],
    'an order asked for by name (it walks the whole way)' => ['order', false],
    'no test payment' => ['none', false],
]);

it('is not asked for an order by the release script, and names the switch in its own help', function (): void {
    $release = (string) file_get_contents(base_path('deploy/remote.sh'));

    expect($release)->toContain('rimify:smoke')
        ->not->toContain('--testbestellung');

    $this->artisan('rimify:smoke', ['--help' => true])->expectsOutputToContain('--testbestellung')->assertSuccessful();
});

it('finds the order button where a smoke that may not order can see it: in the checkout the release ships', function (): void {
    $dir = sys_get_temp_dir().'/rimify-smoke-build-'.bin2hex(random_bytes(4));
    mkdir($dir.'/assets', 0777, true);
    file_put_contents($dir.'/manifest.json', json_encode(['resources/js/Pages/Kasse/Index.vue' => ['file' => 'assets/Kasse-abc.js']]));

    try {
        file_put_contents($dir.'/assets/Kasse-abc.js', 'const t="Zahlungspflichtig bestellen";');
        expect(Smoke::orderButtonShips($dir))->toBeTrue();

        // A checkout whose button says anything else — or a build without the page — fails the row (§ 312j BGB).
        file_put_contents($dir.'/assets/Kasse-abc.js', 'const t="Jetzt kaufen";');
        expect(Smoke::orderButtonShips($dir))->toBeFalse()
            ->and(Smoke::orderButtonShips($dir.'/nirgends'))->toBeFalse();
    } finally {
        @unlink($dir.'/assets/Kasse-abc.js');
        @unlink($dir.'/manifest.json');
        @rmdir($dir.'/assets');
        @rmdir($dir);
    }
});
