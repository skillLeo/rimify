<?php

declare(strict_types=1);

use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Support\RangeSql;
use Illuminate\Support\Facades\DB;

/*
 * The overlap predicate is written once, in two forms: SQL (RangeSql) and in memory
 * (BuildWindow::overlaps). This suite asserts every NULL combination against REAL MySQL — the
 * predicate's whole purpose is NULL handling, and PHP's null semantics are not SQL's — and then
 * asserts the two forms agree. A second copy that gets one branch wrong is the defect this design
 * exists to prevent, and it would be wrong in the permissive direction.
 *
 * The windows are fed through derived tables rather than scratch tables on purpose: DDL inside a
 * test transaction causes an implicit commit in MySQL, which drops RefreshDatabase's transaction
 * and forces a full re-migration per case.
 */

/** Ask MySQL itself, using the real column names the schema uses. */
function sqlOverlaps(?string $aFrom, ?string $aTo, ?string $bFrom, ?string $bTo): bool
{
    $expression = RangeSql::windowsOverlapExpression('a', 'b');

    $row = DB::selectOne(
        "SELECT ({$expression}) AS overlaps FROM
            (SELECT ? AS build_from, ? AS build_to) AS a,
            (SELECT ? AS build_from, ? AS build_to) AS b",
        [$aFrom, $aTo, $bFrom, $bTo],
    );

    return (bool) $row->overlaps;
}

function phpOverlaps(?string $aFrom, ?string $aTo, ?string $bFrom, ?string $bTo): bool
{
    $window = fn (?string $from, ?string $to): BuildWindow => new BuildWindow(
        $from === null ? null : new DateTimeImmutable($from),
        $to === null ? null : new DateTimeImmutable($to),
    );

    return $window($aFrom, $aTo)->overlaps($window($bFrom, $bTo));
}

dataset('window combinations', [
    // Both bounded — the ordinary case, overlapping and not.
    'both closed, overlapping' => ['2018-01-01', '2020-12-31', '2019-01-01', '2021-12-31', true],
    'both closed, disjoint' => ['2010-01-01', '2012-12-31', '2019-01-01', '2021-12-31', false],
    'both closed, touching on one day' => ['2018-01-01', '2019-06-01', '2019-06-01', '2020-01-01', true],
    'both closed, one inside the other' => ['2018-01-01', '2022-12-31', '2019-01-01', '2019-12-31', true],

    // Open at the end — "still in production", which must NOT be read as ending today.
    'a open-ended, b later' => ['2019-12-01', null, '2024-01-01', '2024-12-31', true],
    'a open-ended, b earlier and closed' => ['2019-12-01', null, '2010-01-01', '2012-12-31', false],
    'b open-ended, a later' => ['2024-01-01', '2024-12-31', '2019-12-01', null, true],
    'both open-ended' => ['2019-12-01', null, '2005-01-01', null, true],

    // Open at the start.
    'a open-started, b earlier' => [null, '2015-12-31', '2010-01-01', '2012-12-31', true],
    'a open-started, b after a ends' => [null, '2015-12-31', '2016-01-01', '2016-12-31', false],
    'both open-started' => [null, '2015-12-31', null, '2012-12-31', true],

    // Fully unbounded: the document does not scope the fitment by build window at all.
    'a fully unbounded' => [null, null, '2019-01-01', '2021-12-31', true],
    'b fully unbounded' => ['2019-01-01', '2021-12-31', null, null, true],
    'both fully unbounded' => [null, null, null, null, true],
    'a unbounded, b open-ended' => [null, null, '2019-12-01', null, true],
    'a open-started, b open-ended overlapping' => [null, '2020-12-31', '2019-12-01', null, true],
    'a open-started, b open-ended disjoint' => [null, '2018-12-31', '2019-12-01', null, false],
]);

it('decides overlap correctly for every NULL combination, in MySQL', function (
    ?string $aFrom, ?string $aTo, ?string $bFrom, ?string $bTo, bool $expected
): void {
    expect(sqlOverlaps($aFrom, $aTo, $bFrom, $bTo))->toBe($expected);
})->with('window combinations');

it('decides overlap identically in memory', function (
    ?string $aFrom, ?string $aTo, ?string $bFrom, ?string $bTo, bool $expected
): void {
    expect(phpOverlaps($aFrom, $aTo, $bFrom, $bTo))->toBe($expected);
})->with('window combinations');

it('keeps the SQL and the in-memory twin in agreement', function (
    ?string $aFrom, ?string $aTo, ?string $bFrom, ?string $bTo
): void {
    // If these ever disagree, one of them is permitting a fitment the other refuses.
    expect(sqlOverlaps($aFrom, $aTo, $bFrom, $bTo))->toBe(phpOverlaps($aFrom, $aTo, $bFrom, $bTo));
})->with('window combinations');

it('is symmetric: overlap does not depend on which window is named first', function (
    ?string $aFrom, ?string $aTo, ?string $bFrom, ?string $bTo, bool $expected
): void {
    expect(sqlOverlaps($bFrom, $bTo, $aFrom, $aTo))->toBe($expected)
        ->and(phpOverlaps($bFrom, $bTo, $aFrom, $aTo))->toBe($expected);
})->with('window combinations');

it('never treats an open-ended window as ending today', function (): void {
    // The bug R-02 exists to prevent: a car still in production silently expired by an import.
    $future = now()->addYears(3)->toDateString();

    expect(sqlOverlaps('2019-12-01', null, $future, $future))->toBeTrue()
        ->and(phpOverlaps('2019-12-01', null, $future, $future))->toBeTrue();
});

it('matches a still-built vehicle against an open-ended approval window', function (): void {
    // The seeded RS 4 B9 facelift: build_from 12/2019, no end. An approval scoped "ab 12/2019"
    // with no end must cover it.
    expect(sqlOverlaps('2019-12-01', null, '2019-12-01', null))->toBeTrue();
});

it('refuses to build a window that ends before it starts', function (): void {
    expect(fn () => new BuildWindow(new DateTimeImmutable('2020-01-01'), new DateTimeImmutable('2019-01-01')))
        ->toThrow(InvalidArgumentException::class);
});

it('reports an open-ended window in German without inventing an end date', function (): void {
    $open = new BuildWindow(new DateTimeImmutable('2019-12-01'), null);
    $closed = new BuildWindow(new DateTimeImmutable('2018-03-01'), new DateTimeImmutable('2019-11-30'));

    expect($open->labelDe())->toBe("12/2019\u{2013}heute")
        ->and($open->isOpenEnded())->toBeTrue()
        ->and($closed->labelDe())->toBe("03/2018\u{2013}11/2019")
        ->and(BuildWindow::unbounded()->labelDe())->toBe('Bauzeitraum unbekannt')
        ->and(BuildWindow::unbounded()->isUnbounded())->toBeTrue();
});

it('decides containment in an open-ended numeric range, in MySQL', function (
    ?float $min, ?float $max, float $value, bool $expected
): void {
    $expression = RangeSql::withinExpression('c.width_in', 'f.permitted_width');

    $row = DB::selectOne(
        "SELECT ({$expression}) AS inside FROM
            (SELECT ? AS width_in) AS c,
            (SELECT ? AS permitted_width_min, ? AS permitted_width_max) AS f",
        [$value, $min, $max],
    );

    expect((bool) $row->inside)->toBe($expected);
})->with([
    'inside a closed range' => [8.0, 9.0, 8.5, true],
    'on the lower bound' => [8.5, 9.0, 8.5, true],
    'on the upper bound' => [8.0, 8.5, 8.5, true],
    'below a closed range' => [9.0, 10.0, 8.5, false],
    'above a closed range' => [7.0, 8.0, 8.5, false],
    'unbounded below' => [null, 9.0, 8.5, true],
    'unbounded below, still too wide' => [null, 8.0, 8.5, false],
    'unbounded above' => [8.0, null, 8.5, true],
    'unbounded above, still too narrow' => [9.0, null, 8.5, false],
    'wholly unbounded' => [null, null, 8.5, true],
]);

it('compares widths numerically, not as the strings MySQL returns for DECIMAL', function (): void {
    // '10.00' < '9.00' as strings. A 10J wheel must not be silently excluded from a 9–11J range.
    $expression = RangeSql::withinExpression('c.width_in', 'f.permitted_width');

    $row = DB::selectOne(
        "SELECT ({$expression}) AS inside FROM
            (SELECT CAST(? AS DECIMAL(4,2)) AS width_in) AS c,
            (SELECT CAST(? AS DECIMAL(4,2)) AS permitted_width_min,
                    CAST(? AS DECIMAL(4,2)) AS permitted_width_max) AS f",
        [10.0, 9.0, 11.0],
    );

    expect((bool) $row->inside)->toBeTrue();
});

it('refuses an unsafe identifier rather than interpolating it', function (): void {
    expect(fn () => RangeSql::windowsOverlapExpression('fitments; DROP TABLE orders', 'vehicles'))
        ->toThrow(InvalidArgumentException::class)
        ->and(fn () => RangeSql::withinExpression('wheel_configs.width_in', '`evil`'))
        ->toThrow(InvalidArgumentException::class)
        ->and(fn () => RangeSql::windowsOverlapExpression('a', 'b', 'build_from; --'))
        ->toThrow(InvalidArgumentException::class);
});

it('quotes every identifier in the expressions it produces', function (): void {
    expect(RangeSql::withinExpression('wheel_configs.width_in', 'fitments.permitted_width'))
        ->toContain('`fitments`.`permitted_width_min`')
        ->toContain('`fitments`.`permitted_width_max`')
        ->toContain('`wheel_configs`.`width_in`');

    expect(RangeSql::windowsOverlapExpression('fitments', 'vehicles'))
        ->toContain('`fitments`.`build_from`')
        ->toContain('`vehicles`.`build_to`');
});

it('works through the query builder as well as as a bare expression', function (): void {
    // Both entry points must produce the same predicate; the builder form is what the resolver
    // uses, the bare form is what the single-statement listing query needs.
    $builder = DB::table('vehicles as a')->crossJoin('vehicles as b')->whereColumn('a.id', '<>', 'b.id');

    expect(RangeSql::windowsOverlap($builder, 'a', 'b')->toSql())
        ->toContain(RangeSql::windowsOverlapExpression('a', 'b'));
});
