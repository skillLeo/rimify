<?php

declare(strict_types=1);

use App\Support\GermanFormat;
use Carbon\CarbonImmutable;

/**
 * „vor 2 Std.“ — how long ago, as a colleague says it, counted in Berlin calendar days.
 */
it('says how long ago, the way a colleague would', function (string $then, string $expected): void {
    $now = CarbonImmutable::parse('2026-09-26 11:40:00', 'UTC'); // 13:40 in Berlin

    expect(GermanFormat::ago(CarbonImmutable::parse($then, 'UTC'), $now))->toBe($expected);
})->with([
    ['2026-09-26 11:39:40', 'gerade eben'],
    ['2026-09-26 11:35:00', "vor 5\u{00A0}Min."],
    ['2026-09-26 09:40:00', "vor 2\u{00A0}Std."],
    // 23:30 UTC on 25 September is 01:30 on the 26th in Berlin: today, 12 hours ago.
    ['2026-09-25 23:30:00', "vor 12\u{00A0}Std."],
    // 21:30 UTC on 24 September is 23:30 on the 24th in Berlin: two calendar days ago.
    ['2026-09-24 21:30:00', 'vor 2 Tagen'],
    ['2026-09-25 08:00:00', 'gestern'],
    ['2026-07-01 08:00:00', '01.07.2026'],
]);

it('has nothing to say about no time at all', function (): void {
    expect(GermanFormat::ago(null))->toBeNull();
});
