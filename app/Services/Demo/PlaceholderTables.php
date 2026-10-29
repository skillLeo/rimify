<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\ApprovalDocument;
use App\Services\Storage\DocumentFiles;
use Database\Seeders\ApprovalSeeder;

/**
 * The walkthrough's placeholder document — „Platzhalter – kein echtes Gutachten“, typed through the admin by
 * the golden-record walkthrough — gets ABE 55255's table of tyre load at speed, marked as the demo seed's so
 * nobody reads it as the document's own content (the operator's decision of 29.09.2026). Without it every
 * fast car in the walkthrough would answer UNKNOWN, and the demo would teach that the product is broken.
 *
 * Idempotent: a document that has any table keeps it. Never in the live shop, which holds no placeholder.
 */
final class PlaceholderTables
{
    /** The issuer the walkthrough types: it says on every page that it is no Gutachten. */
    public const ISSUER = 'Platzhalter – kein echtes Gutachten';

    /** @return int the documents that got a table */
    public static function seed(): int
    {
        if (app()->environment('production')) {
            return 0;
        }

        $seeded = 0;

        foreach (ApprovalDocument::query()->where('issuer', self::ISSUER)->whereDoesntHave('speedDeratings')->get() as $document) {
            ApprovalSeeder::seedDerating($document);
            $seeded++;
        }

        return $seeded;
    }

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
