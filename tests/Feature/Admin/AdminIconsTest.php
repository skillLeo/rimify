<?php

declare(strict_types=1);

use App\Services\Admin\AdminNavigation;
use App\Services\Admin\QuickActions;

/**
 * Every icon name the server sends to the admin is one the admin's own set draws
 * (resources/js/icons/admin): a rail item with a name the set does not know would render nothing,
 * and the collapsed rail is icons only.
 */
function adminIconNames(): array
{
    $source = (string) file_get_contents(resource_path('js/icons/admin/index.ts'));
    preg_match_all("/^\\s+'?([a-z-]+)'?: '</m", $source, $m);

    return $m[1];
}

it('draws every icon of the rail, group and page alike, and no two pages share one', function (): void {
    /** @var list<array{icon: string, pages: list<array{icon: string}>}> $groups */
    $groups = (new ReflectionClassConstant(AdminNavigation::class, 'GROUPS'))->getValue();
    $known = adminIconNames();
    $pages = array_merge(...array_map(static fn (array $g): array => array_column($g['pages'], 'icon'), $groups));

    // The Übersicht is its group's only page, so the two share a glyph by design.
    expect(array_diff([...array_column($groups, 'icon'), ...$pages], $known))->toBe([])
        ->and(count(array_unique($pages)))->toBe(count($pages));
});

it('draws every quick action', function (): void {
    $source = (string) file_get_contents((new ReflectionClass(QuickActions::class))->getFileName());
    preg_match_all("/'icon' => '([a-z-]+)'/", $source, $m);

    expect($m[1])->not->toBeEmpty()
        ->and(array_diff($m[1], adminIconNames()))->toBe([]);
});
