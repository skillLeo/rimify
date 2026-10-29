<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

/*
 * No client name, person or company, in anything committed while the repository is public (the operator's rule of
 * 29.10.2026). One reached two test fixtures on 04.10.2026 and stood there in public until 29.10.2026; a grep before a
 * push is a habit, this is the check. The names cannot stand here themselves, so the test knows them by their SHA-256:
 * every word of every tracked text file is hashed and compared. The lock files are left out (a package author shares a
 * first name), and so is the postcode list (a place does).
 */

/** SHA-256 of each name, lower case: the company, then the first name. */
const CLIENT_NAME_HASHES = [
    '7b62890dcacdf038fefb909263dc21bf23d935cef971a98ba86b1c272ca962ba',
    '4dd68e2ab3a30973318ea903e088b3d3480655ef4236109fe47272c1c1582880',
];

/** Files another party wrote, where a name is theirs. */
const CLIENT_NAME_EXEMPT = ['composer.lock', 'package-lock.json', 'resources/data/plz-de.json'];

/** @return list<string> the repository's tracked files, relative to its root */
function trackedFiles(string $root): array
{
    $git = new Process(['git', 'ls-files', '-z'], $root);
    $git->run();
    expect($git->isSuccessful())->toBeTrue('git ls-files failed: '.$git->getErrorOutput());

    return array_values(array_filter(explode("\0", $git->getOutput())));
}

/**
 * The words in the text files among `$paths` that hash to one of `$hashes`.
 *
 * @param  list<string>  $paths  relative to `$root`
 * @param  list<string>  $hashes
 * @return list<string> "path: word" per finding
 */
function wordsHashedIn(string $root, array $paths, array $hashes): array
{
    $found = [];

    foreach ($paths as $path) {
        if (in_array($path, CLIENT_NAME_EXEMPT, true) || ! is_file($root.'/'.$path)) {
            continue;
        }

        $content = (string) file_get_contents($root.'/'.$path);

        // A picture, a font, a PDF: not text, not read.
        if (str_contains(substr($content, 0, 8000), "\0")) {
            continue;
        }

        preg_match_all('/\p{L}+/u', mb_strtolower($content), $words);

        foreach (array_unique($words[0]) as $word) {
            if (in_array(hash('sha256', $word), $hashes, true)) {
                $found[] = "{$path}: {$word}";
            }
        }
    }

    return $found;
}

it('finds no client name in any tracked file', function (): void {
    $root = dirname(__DIR__, 2);
    $files = trackedFiles($root);

    // The scan reads the repository, not an empty list.
    expect(count($files))->toBeGreaterThan(1000)
        ->and(wordsHashedIn($root, $files, CLIENT_NAME_HASHES))
        ->toBe([], 'A client\'s name is committed. Replace it with a neutral one (Erika Mustermann) before anything is pushed.');
});

it('finds a word by its hash alone, whatever its case, in text and never in a binary file', function (): void {
    $dir = sys_get_temp_dir().'/rimify-names-'.bin2hex(random_bytes(4));
    mkdir($dir);
    file_put_contents($dir.'/fixture.ts', "by: 'ERIKA Mustermann'\n");
    file_put_contents($dir.'/picture.png', "\x89PNG\0\0erika");

    try {
        // A stand-in for a name: the finder knows it through its hash only.
        expect(wordsHashedIn($dir, ['fixture.ts', 'picture.png'], [hash('sha256', 'erika')]))->toBe(['fixture.ts: erika'])
            ->and(wordsHashedIn($dir, ['fixture.ts', 'picture.png'], CLIENT_NAME_HASHES))->toBe([]);
    } finally {
        unlink($dir.'/fixture.ts');
        unlink($dir.'/picture.png');
        rmdir($dir);
    }
});
