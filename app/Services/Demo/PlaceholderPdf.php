<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\ApprovalDocument;
use App\Services\Storage\DocumentFiles;

/**
 * The walkthrough's placeholder document — „Platzhalter – kein echtes Gutachten“, typed through the admin by the
 * golden-record walkthrough. It needs no table of tyre load at speed: every document reads ETRTO's (D-459). What it
 * may need is its PDF, on a server whose disk lacks it. Never in the live shop, which holds no placeholder.
 */
final class PlaceholderPdf
{
    /** The issuer the walkthrough types: it says on every page that it is no Gutachten. */
    public const ISSUER = 'Platzhalter – kein echtes Gutachten';

    /**
     * The walkthrough's placeholder PDF back where its document expects it, on this server's disk. The checkouts on one
     * machine share the admin's database and not its disk: the walkthrough reuses the released placeholder another
     * checkout typed, and that checkout's disk holds the file (the gate of 29.10.2026 on the worktree). Written only for a
     * placeholder whose file is missing, and only the very bytes it was released with — its SHA-256 —, never any other
     * file and never a real document.
     *
     * @return int the documents whose file was put back
     */
    public static function restoreFile(string $pdf): int
    {
        if (app()->environment('production')) {
            return 0;
        }

        $files = app(DocumentFiles::class);
        $disk = $files->current();
        $restored = 0;

        $documents = ApprovalDocument::query()
            ->where('issuer', self::ISSUER)
            ->whereNotNull('pdf_key')
            ->where('pdf_sha256', hash('sha256', $pdf))
            ->get();

        foreach ($documents as $document) {
            $key = (string) $document->pdf_key;

            if ($disk->exists($key)) {
                continue;
            }

            $disk->put($key, $pdf);
            $files->forget($key);
            $restored++;
        }

        return $restored;
    }
}
