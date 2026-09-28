<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\ApprovalDocument;
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
}
