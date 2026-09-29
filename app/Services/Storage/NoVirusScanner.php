<?php

declare(strict_types=1);

namespace App\Services\Storage;

/**
 * No scanner on this host yet: every file passes the hook. The uploads still sniff their type from
 * the bytes and re-encode every image, so what is stored is never the file as it was sent.
 */
final class NoVirusScanner implements VirusScanner
{
    public function scan(string $path): ?string
    {
        return null;
    }

    public function active(): bool
    {
        return false;
    }
}
