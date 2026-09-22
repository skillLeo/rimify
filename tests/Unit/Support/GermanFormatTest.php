<?php

declare(strict_types=1);

use App\Support\GermanFormat;
use Illuminate\Support\Carbon;

/*
 * R-10 — German formatting everywhere, through one helper. The three invisible code points are
 * asserted by value, because a plain space instead of U+00A0 looks identical in a diff and is
 * wrong on every price in the shop.
 */

it('formats money with a thousands point, a decimal comma and a non-breaking space', function (): void {
    expect(GermanFormat::money(142_500))->toBe("1.425,00\u{00A0}€")
        ->and(GermanFormat::money(75_029))->toBe("750,29\u{00A0}€")
        ->and(GermanFormat::money(0))->toBe("0,00\u{00A0}€")
        ->and(GermanFormat::money(5))->toBe("0,05\u{00A0}€")
        ->and(GermanFormat::money(100_000_000))->toBe("1.000.000,00\u{00A0}€");
});

it('uses a real no-break space before the euro sign, not a plain one', function (): void {
    $formatted = GermanFormat::money(142_500);

    // U+00A0 is C2 A0 in UTF-8; a plain space would be 0x20.
    expect(bin2hex(mb_substr($formatted, -2, 1)))->toBe('c2a0')
        ->and($formatted)->not->toContain(' €');
});

it('renders a negative amount with a true minus sign', function (): void {
    expect(GermanFormat::money(-1_250))->toBe("\u{2212}12,50\u{00A0}€");
});

it('formats rim widths the way the document does', function (): void {
    expect(GermanFormat::rimWidth(8.5))->toBe('8,5J')
        ->and(GermanFormat::rimWidth(8.0))->toBe('8J')
        ->and(GermanFormat::rimWidth(10.0))->toBe('10J')
        ->and(GermanFormat::rimWidth(9.5))->toBe('9,5J')
        // MySQL hands DECIMAL columns back as strings; the output must not change.
        ->and(GermanFormat::rimWidth('8.50'))->toBe('8,5J')
        ->and(GermanFormat::rimWidth('10.00'))->toBe('10J');
});

it('never writes a rim width with a decimal point', function (): void {
    foreach ([7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 11.5] as $width) {
        expect(GermanFormat::rimWidth($width))->not->toContain('.');
    }
});

it('formats the wheel size and the full wheel label', function (): void {
    expect(GermanFormat::wheelSize(8.5, 18.0, 35))->toBe("8,5J \u{00D7} 18 \u{00B7} ET 35")
        ->and(GermanFormat::wheelLabel(8.5, 18.0, 35, 5, 112.0, 66.60))
        ->toBe("8,5J \u{00D7} 18 \u{00B7} ET 35 \u{00B7} 5\u{00A0}\u{00D7}\u{00A0}112 \u{00B7} 66,6\u{00A0}mm");
});

it('uses the multiplication sign, not the letter x', function (): void {
    expect(GermanFormat::wheelSize(8.5, 18.0, 35))->toContain("\u{00D7}")->not->toContain(' x ');
});

it('handles a negative offset, which real wheels have', function (): void {
    expect(GermanFormat::wheelSize(9.0, 19.0, -12))->toBe("9J \u{00D7} 19 \u{00B7} ET -12");
});

it('formats bolt patterns and centre bores', function (): void {
    // Written the way a Gutachten writes it, with no-break spaces so it never wraps.
    expect(GermanFormat::boltPattern(5, 112.0))->toBe("5\u{00A0}\u{00D7}\u{00A0}112")
        ->and(GermanFormat::boltPattern(5, 114.3))->toBe("5\u{00A0}\u{00D7}\u{00A0}114,3")
        ->and(GermanFormat::millimetres(66.60))->toBe("66,6\u{00A0}mm")
        ->and(GermanFormat::millimetres(72.0))->toBe("72\u{00A0}mm");
});

it('formats a rim size, an offset and a load the way the hero states them', function (): void {
    // No-break spaces inside each value: a line of facts wraps between values, never inside one.
    expect(GermanFormat::rimSize(8.5, 19.0))->toBe("8,5J\u{00A0}\u{00D7}\u{00A0}19")
        ->and(GermanFormat::rimSize('8.00', '18.0'))->toBe("8J\u{00A0}\u{00D7}\u{00A0}18")
        ->and(GermanFormat::offset(45))->toBe("ET\u{00A0}45")
        ->and(GermanFormat::offset(-12))->toBe("ET\u{00A0}-12")
        ->and(GermanFormat::kilograms(620))->toBe("620\u{00A0}kg")
        ->and(GermanFormat::kilograms(1020))->toBe("1.020\u{00A0}kg");
});

it('formats tyre sizes with and without the indices', function (): void {
    expect(GermanFormat::tyreSize(245, 45, 18.0, 92, 'Y'))->toBe('245/45 R18 92Y')
        ->and(GermanFormat::tyreSize(225, 35, 18.0))->toBe('225/35 R18')
        ->and(GermanFormat::tyreSize(245, 45, 18.0, 92, null))->toBe('245/45 R18');
});

it('renders dates in Europe/Berlin from a UTC instant', function (): void {
    expect(GermanFormat::date(new DateTimeImmutable('2025-11-21 09:00:00', new DateTimeZone('UTC'))))
        ->toBe('21.11.2025');

    // 23:30 UTC on the 20th is already the 21st in Berlin — the date the customer looks for.
    expect(GermanFormat::date(new DateTimeImmutable('2025-11-20 23:30:00', new DateTimeZone('UTC'))))
        ->toBe('21.11.2025');

    expect(GermanFormat::date(null))->toBeNull();
});

it('accepts any DateTimeInterface, including Carbon', function (): void {
    expect(GermanFormat::date(Carbon::parse('2025-11-21 12:00:00', 'UTC')))
        ->toBe('21.11.2025');
});

it('formats a build period, and says heute rather than inventing an end date', function (): void {
    $from = new DateTimeImmutable('2018-03-01');
    $to = new DateTimeImmutable('2019-11-30');

    expect(GermanFormat::buildPeriod($from, $to))->toBe("03/2018\u{2013}11/2019")
        // An open end is the model still being built. Writing today's date here would be the
        // same mistake as coercing a NULL build_to, and it would be a lie.
        ->and(GermanFormat::buildPeriod(new DateTimeImmutable('2019-12-01'), null))->toBe("12/2019\u{2013}heute")
        ->and(GermanFormat::buildPeriod(null, $to))->toBe('bis 11/2019')
        ->and(GermanFormat::buildPeriod(null, null))->toBe('Bauzeitraum unbekannt');
});

it('uses an en dash in a build period, not a hyphen', function (): void {
    expect(GermanFormat::buildPeriod(new DateTimeImmutable('2018-03-01'), null))
        ->toContain("\u{2013}")
        ->not->toContain('-');
});

it('keeps the leading zeros on an HSN and never casts it to an integer', function (): void {
    expect(GermanFormat::hsn('0005'))->toBe('0005')
        ->and(GermanFormat::hsn('5'))->toBe('0005')
        ->and(GermanFormat::hsn('35'))->toBe('0035')
        ->and(GermanFormat::hsn('0583'))->toBe('0583')
        ->and(GermanFormat::keyNumbers('0005', '582'))->toBe("HSN 0005 \u{00B7} TSN 582")
        ->and(GermanFormat::keyNumbers('1860', 'aas'))->toBe("HSN 1860 \u{00B7} TSN AAS");
});

it('formats ratings with the German decimal comma and the right plural', function (): void {
    expect(GermanFormat::rating(4.8, 555))->toBe('4,8 (555 Bewertungen)')
        ->and(GermanFormat::rating(4.0, 1))->toBe('4,0 (1 Bewertung)')
        ->and(GermanFormat::rating(4.2, 1234))->toBe('4,2 (1.234 Bewertungen)');
});

it('formats percentages and integer quantities', function (): void {
    expect(GermanFormat::percent(12))->toBe("+12\u{00A0}%")
        ->and(GermanFormat::percent(-3))->toBe("\u{2212}3\u{00A0}%")
        ->and(GermanFormat::percent(0))->toBe("0\u{00A0}%")
        ->and(GermanFormat::integer(1234))->toBe('1.234')
        ->and(GermanFormat::integer(726))->toBe('726');
});

it('never uses a dot as a decimal separator', function (): void {
    // In German a dot groups thousands, so `1.425,00 €` is correct and `8.5` is not. A thousands
    // group is always exactly three digits, so a dot followed by one or two digits is the tell.
    $samples = [
        GermanFormat::money(142_500),
        GermanFormat::money(100_000_000),
        GermanFormat::rimWidth(8.5),
        GermanFormat::millimetres(66.6),
        GermanFormat::wheelLabel(8.5, 18.0, 35, 5, 114.3, 66.6),
        GermanFormat::rating(4.8, 1234),
        GermanFormat::decimal(1234.5),
        GermanFormat::tyreSize(245, 45, 18.0, 92, 'Y'),
        GermanFormat::integer(1234),
    ];

    foreach ($samples as $sample) {
        expect($sample)->not->toMatch('/\.\d{1,2}(?!\d)/');
    }
});

it('groups thousands in threes so the dot can only ever be a separator', function (): void {
    expect(GermanFormat::money(100_000_000))->toBe("1.000.000,00\u{00A0}€")
        ->and(GermanFormat::integer(1_234_567))->toBe('1.234.567');
});
