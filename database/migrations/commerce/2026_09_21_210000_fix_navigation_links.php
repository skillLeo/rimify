<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Two corrections to navigation rows already in production databases.
 *
 * The footer's legal links pointed at /impressum, /agb and so on; the legal pages live under
 * /rechtliches/{slug}, so every one of them was a 404. And the header item for RIMIFY-CHECK carried
 * a decorative check mark in its label.
 *
 * A migration rather than a re-seed, because re-running the content seeder in production would
 * also overwrite anything an editor has changed since. Idempotent: on a database that is already
 * correct, or empty, it changes nothing.
 */
return new class extends Migration
{
    private const LEGAL = ['impressum', 'datenschutz', 'agb', 'widerrufsbelehrung', 'versand'];

    public function up(): void
    {
        foreach (self::LEGAL as $slug) {
            DB::table('nav_items')
                ->where('menu', 'footer_legal')
                ->where('href', '/'.$slug)
                ->update(['href' => '/rechtliches/'.$slug]);
        }

        $clean = DB::table('nav_items')
            ->where('menu', 'header')
            ->where('label', 'RIMIFY-CHECK')
            ->exists();

        if ($clean) {
            // The clean row exists already; the old one is a duplicate.
            DB::table('nav_items')->where('menu', 'header')->where('label', 'RIMIFY CHECK ✓')->delete();
        } else {
            DB::table('nav_items')
                ->where('menu', 'header')
                ->where('label', 'RIMIFY CHECK ✓')
                ->update(['label' => 'RIMIFY-CHECK']);
        }
    }

    public function down(): void
    {
        // A correction is not reversed: restoring broken links would be the only effect.
    }
};
