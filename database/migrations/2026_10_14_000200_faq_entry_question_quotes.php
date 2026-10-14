<?php

declare(strict_types=1);

use Database\Seeders\ContentSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The FAQ question „Was bedeutet „Eintragung erforderlich"?“ closed its inner quotation with an ASCII quote; the copy
 * review (EIGENE-FUNDE 128, approved 14.10.2026) gives it the German one, as the seeder now writes it. The seeder upserts
 * FAQ rows on their question, so without this a database seeded before would get the corrected question as a second
 * entry beside the old one. The row changes only while nobody has edited it in Inhalte › FAQ.
 */
return new class extends Migration
{
    private const BEFORE = 'Was bedeutet „Eintragung erforderlich"?';

    public function up(): void
    {
        // Already there in the corrected form (a re-seed ran first): the old row is the duplicate, and it stays for a
        // person to remove — a migration deletes nothing the team may have looked at.
        if (DB::table('faq_entries')->where('question_de', ContentSeeder::FAQ_ENTRY_QUESTION)->exists()) {
            return;
        }

        DB::table('faq_entries')
            ->where('question_de', self::BEFORE)
            ->whereNull('team_edited_at')
            ->update(['question_de' => ContentSeeder::FAQ_ENTRY_QUESTION, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('faq_entries')
            ->where('question_de', ContentSeeder::FAQ_ENTRY_QUESTION)
            ->whereNull('team_edited_at')
            ->update(['question_de' => self::BEFORE, 'updated_at' => now()]);
    }
};
