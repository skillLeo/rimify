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
    'the acceptance set\'s wheel, asked or not' => [true, true, true, 'demo'],
    'no test payment (the live shop), even when asked' => [false, false, true, 'none'],
    'no test payment, not asked' => [false, false, false, 'none'],
]);

it('is not asked for an order by the release script, and names the switch in its own help', function (): void {
    $release = (string) file_get_contents(base_path('deploy/remote.sh'));

    expect($release)->toContain('rimify:smoke')
        ->not->toContain('--testbestellung');

    $this->artisan('rimify:smoke', ['--help' => true])->expectsOutputToContain('--testbestellung')->assertSuccessful();
});
