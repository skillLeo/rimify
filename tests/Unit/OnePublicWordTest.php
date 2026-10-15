<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\VerdictStatus;

/*
 * Finding 122 (the operator's brief of 14.10.2026 §5, D-234): the fourth answer had three names — „Unbekannt“ in the
 * legends, „Keine Freigabe hinterlegt“ in the panel, „Keine Angabe“ in the tyre row. In public it is „Noch nicht
 * bestätigt“ everywhere; the admin says „nicht hinterlegt“ for a record nobody has entered. This keeps the old three
 * out of everything a customer reads: the shop's pages and components, its mails, the engine's sentences.
 */

/** @return list<string> */
function publicSourceFiles(): array
{
    $root = dirname(__DIR__, 2);
    $files = [];

    foreach (['resources/js', 'app/Mail', 'app/Domain', 'resources/views'] as $dir) {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/'.$dir, FilesystemIterator::SKIP_DOTS));

        foreach ($iterator as $file) {
            $path = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));

            // The admin, the design specimen and the tests are not the shop.
            if (in_array($file->getExtension(), ['php', 'vue', 'ts'], true)
                && preg_match('#/Admin/|/admin/|/Design/|\.test\.ts$|\.spec\.ts$#', '/'.$path) !== 1) {
                $files[] = $path;
            }
        }
    }

    return $files;
}

it('names the fourth answer „Noch nicht bestätigt“', function (): void {
    expect(VerdictStatus::Unknown->labelDe())->toBe('Noch nicht bestätigt');
});

it('says none of its three old names anywhere a customer reads', function (): void {
    $root = dirname(__DIR__, 2);
    $found = [];

    foreach (publicSourceFiles() as $path) {
        // Comments say what the words used to be; a customer never reads them.
        $code = (string) preg_replace('#/\*.*?\*/|<!--.*?-->|\{\{--.*?--\}\}#su', '', (string) file_get_contents($root.'/'.$path));

        foreach (explode("\n", $code) as $number => $line) {
            if (preg_match('#^\s*(//|\*)#', $line) === 1) {
                continue;
            }

            if (preg_match('/\bUnbekannt\b|Keine Angabe|Keine Freigabe hinterlegt/u', $line) === 1) {
                $found[] = $path.': '.trim($line);
            }
        }
    }

    expect($found)->toBe([]);
});
