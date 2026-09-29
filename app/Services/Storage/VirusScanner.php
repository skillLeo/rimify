<?php

declare(strict_types=1);

namespace App\Services\Storage;

/**
 * The hook every upload passes before it is stored (ImageUpload, PdfUpload). A scanner answers with
 * nothing when the file is clean and with its reason when it is not. Bound to NoVirusScanner until
 * the host offers a scanner (ClamAV or a scanning service): docs/launch/BLOCKED.md.
 */
interface VirusScanner
{
    /** Null for a clean file; otherwise what the scanner found, in its own words. */
    public function scan(string $path): ?string;

    /** Whether there is a scanner at all — a large file is fetched for it only then. */
    public function active(): bool;
}
