<?php

declare(strict_types=1);

/*
 * Where the suite's page assertions look for a component must be spelt exactly as the folder is. A Windows checkout
 * finds `js/pages` when the folder is `js/Pages`; Linux (CI, the host) does not, and every `->component()` failed
 * there. The directory listing is case-exact on every system, so this fails on Windows too.
 */
it('looks for the pages in a folder spelt exactly as it is on disk', function (): void {
    $paths = config('inertia.pages.paths');

    expect($paths)->toBeArray()->not->toBeEmpty();

    foreach ($paths as $path) {
        $parent = dirname((string) $path);
        $name = basename((string) $path);

        expect(scandir($parent))->toContain($name);
    }
});

it('finds a page through the same finder the assertions use', function (): void {
    expect(app('inertia.view-finder')->find('Admin/Profil/Index'))->toEndWith('Index.vue');
});
