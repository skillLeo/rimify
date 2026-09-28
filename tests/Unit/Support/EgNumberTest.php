<?php

declare(strict_types=1);

use App\Support\EgNumber;

/**
 * Block D: an EG type-approval number with the extensions a Gutachten prints — `..`, `11`, `00-09`, `04-..` —
 * as ABE 55255 prints them for BMW 1er 187, 1K2 and 1K4.
 */
function eg(string $raw): EgNumber
{
    $number = EgNumber::parse($raw);

    expect($number)->not->toBeNull($raw);

    return $number ?? throw new RuntimeException($raw);
}

it('reads the four ways a document prints the extensions', function (): void {
    expect(eg('e1*2001/116*0287*00-09'))->toMatchObject(['base' => 'e1*2001/116*0287', 'from' => 0, 'to' => 9])
        ->and(eg('e1*2007/46*0273*04-..'))->toMatchObject(['from' => 4, 'to' => null])
        ->and(eg('e1*2007/46*0316*..'))->toMatchObject(['from' => null, 'to' => null])
        ->and(eg('E1*2001/116*0447*11'))->toMatchObject(['base' => 'e1*2001/116*0447', 'from' => 11, 'to' => 11])
        ->and(eg('e1*98/14*0105*'))->toMatchObject(['from' => null, 'to' => null]);
});

it('refuses what is not an EG number', function (): void {
    expect(EgNumber::parse('0005'))->toBeNull()
        ->and(EgNumber::parse('e1*2001/116'))->toBeNull()
        ->and(EgNumber::parse(''))->toBeNull();
});

it('covers an exact extension inside its range, and none outside', function (): void {
    expect(eg('e1*2001/116*0287*00-09')->covers(eg('e1*2001/116*0287*05')))->toBeTrue()
        ->and(eg('e1*2001/116*0287*00-09')->covers(eg('e1*2001/116*0287*10')))->toBeFalse()
        ->and(eg('e1*2007/46*0273*04-..')->covers(eg('e1*2007/46*0273*17')))->toBeTrue()
        ->and(eg('e1*2007/46*0273*04-..')->covers(eg('e1*2007/46*0273*03')))->toBeFalse()
        ->and(eg('e1*2007/46*0316*..')->covers(eg('e1*2007/46*0316*07')))->toBeTrue()
        // Another approval is never covered, whatever the range.
        ->and(eg('e1*2007/46*0316*..')->covers(eg('e1*2007/46*0317*07')))->toBeFalse()
        // An open-ended number is not taken in by a closed range.
        ->and(eg('e1*2001/116*0287*00-09')->covers(eg('e1*2001/116*0287*..')))->toBeFalse();
});

it('says two ranges name the same car where they share an extension', function (): void {
    expect(eg('e1*2001/116*0287*00-09')->overlaps(eg('e1*2001/116*0287*05')))->toBeTrue()
        ->and(eg('e1*2001/116*0287*00-09')->overlaps(eg('e1*2001/116*0287*10-..')))->toBeFalse()
        ->and(eg('e1*2007/46*0316*..')->overlaps(eg('e1*2007/46*0316*11')))->toBeTrue()
        ->and(eg('e1*2007/46*0316*..')->overlaps(eg('e1*2007/46*0277*11')))->toBeFalse();
});
