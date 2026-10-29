<?php

declare(strict_types=1);

use App\Domain\Fitment\Tyres\CombinationEntry;

/*
 * Which entry of a Gutachten's Verwendungsbereich a car's tyre combinations come from (his admin item 19, D-358): the
 * one whose printed EG type-approval number takes in the car's field K, never more loosely than it is printed — as the
 * Borbet documents print them: `e1*2007/46*0316*..`, `…*08`, `…*00-07`, `…*10-..` (docs/gutachten/*.json).
 */

$lists = [
    'e1*2007/46*0316*..' => ['225/40R18|225/40R18'],
    'e1*2007/46*0277*00-07' => ['235/35R19|255/30R19'],
    'e1*2001/116*0287*10-..' => ['225/35R19|245/30R19'],
    'e1*93/81*0029*08' => ['205/55R16|205/55R16'],
];

it('takes the entry whose printed extensions take in the car', function (string $carK, string $entry) use ($lists): void {
    expect(CombinationEntry::for($carK, $lists))->toBe($entry);
})->with([
    'no extension printed: every extension' => ['e1*2007/46*0316*11', 'e1*2007/46*0316*..'],
    'a range: inside it' => ['e1*2007/46*0277*05', 'e1*2007/46*0277*00-07'],
    'an open range: from its first on' => ['e1*2001/116*0287*12', 'e1*2001/116*0287*10-..'],
    'one extension: that one' => ['e1*93/81*0029*08', 'e1*93/81*0029*08'],
    'as the papers print it: spaces, capitals, a trailing asterisk' => ['E1 * 2007/46 * 0277 * 03*', 'e1*2007/46*0277*00-07'],
    'a car typed from the document carries its range: the same range' => ['e1*2007/46*0277*00-07', 'e1*2007/46*0277*00-07'],
]);

it('takes none where nothing printed takes the car in — never a neighbour, never looser than printed', function (?string $carK) use ($lists): void {
    expect(CombinationEntry::for($carK, $lists))->toBeNull();
})->with([
    'outside the range' => ['e1*2007/46*0277*08'],
    'below the open range' => ['e1*2001/116*0287*09'],
    'another extension than the one printed' => ['e1*93/81*0029*09'],
    'another approval number' => ['e1*2007/46*0317*01'],
    'a car whose K has no extension, where only one is printed' => ['e1*93/81*0029'],
    'no K at all' => [null],
    'something that is no EG number' => ['ABE 55255'],
]);

it('takes none where two entries take the car in with different lists, and either where both list the same', function (): void {
    $overlapping = [
        'e1*2007/46*0277*..' => ['235/35R19|255/30R19'],
        'e1*2007/46*0277*00-07' => ['225/35R19|245/30R19'],
    ];
    expect(CombinationEntry::for('e1*2007/46*0277*03', $overlapping))->toBeNull();

    $same = [
        'e1*2007/46*0277*..' => ['235/35R19|255/30R19', '225/40R18|225/40R18'],
        'e1*2007/46*0277*00-07' => ['225/40R18|225/40R18', '235/35R19|255/30R19'],
    ];
    expect(CombinationEntry::for('e1*2007/46*0277*03', $same))->not->toBeNull();
});
