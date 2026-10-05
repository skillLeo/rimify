<?php

declare(strict_types=1);

namespace App\Services\Smoke;

use App\Services\Reset\TestEnvironment;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * The files that must never leave the server — the reset's safety copies (customers' names, addresses and e-mail
 * addresses), the log — asked for over HTTP, for `rimify:smoke` (the operator's brief of 05.10.2026, §2.2). On the host
 * the project itself is the document root and one rewrite to public/ is what keeps storage/ out of reach; this asks the
 * real server, as `rimify:s3-audit` asks the bucket for `invoices/`.
 *
 * It writes a canary into storage/app/private (and into the reset folder where there is one) and asks for it, asks for
 * the newest real safety copy and the log by their paths, and expects 403 or 404 for every one. The canaries are removed
 * whatever the answer.
 */
final class PrivateFilesProbe
{
    /**
     * Each address asked, with the status it got.
     *
     * @return list<array{path: string, status: int|null}>
     */
    public function run(string $base): array
    {
        $base = rtrim($base, '/');
        $canaries = [];

        foreach (array_filter([storage_path('app/private'), is_dir(TestEnvironment::dir()) ? TestEnvironment::dir() : null]) as $dir) {
            $file = $dir.DIRECTORY_SEPARATOR.'smoke-'.Str::lower((string) Str::ulid()).'.txt';

            if (@file_put_contents($file, 'rimify smoke – darf über HTTP nie lesbar sein') !== false) {
                $canaries[] = $file;
            }
        }

        $paths = [...$canaries, ...array_filter([self::newestCopy(), storage_path('logs/laravel.log')], static fn (?string $f): bool => $f !== null && is_file($f))];
        $results = [];

        try {
            foreach ($paths as $file) {
                $path = '/'.str_replace('\\', '/', ltrim(Str::after($file, base_path()), '\\/'));
                $results[] = ['path' => $path, 'status' => self::status($base.$path)];
            }
        } finally {
            foreach ($canaries as $file) {
                @unlink($file);
            }
        }

        return $results;
    }

    /**
     * Every address that answered anything but 403 or 404, as German sentences.
     *
     * @param  list<array{path: string, status: int|null}>  $results
     * @return list<string>
     */
    public static function faults(array $results): array
    {
        $faults = [];

        foreach ($results as ['path' => $path, 'status' => $status]) {
            if (! in_array($status, [403, 404], true)) {
                $faults[] = $status === null
                    ? "{$path}: keine Antwort"
                    : "{$path} antwortet HTTP {$status} – diese Datei darf über das Netz nie erreichbar sein";
            }
        }

        return $faults;
    }

    /** The newest safety copy of a reset, the file itself — or null where there is none. */
    private static function newestCopy(): ?string
    {
        $dir = TestEnvironment::dir();

        if (! is_dir($dir)) {
            return null;
        }

        $copies = [];

        foreach (File::directories($dir) as $folder) {
            foreach (File::files($folder) as $file) {
                if (str_starts_with($file->getFilename(), 'snapshot.')) {
                    $copies[$file->getPathname()] = $file->getMTime();
                }
            }
        }

        arsort($copies);

        return array_key_first($copies);
    }

    /** The status alone: never followed, and the body is not read — a copy that did answer is not downloaded. */
    private static function status(string $url): ?int
    {
        try {
            return Http::timeout(15)->withoutRedirecting()->withOptions(['stream' => true])->get($url)->status();
        } catch (Throwable) {
            return null;
        }
    }
}
