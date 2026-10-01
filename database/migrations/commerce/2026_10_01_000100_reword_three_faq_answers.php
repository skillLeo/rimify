<?php

declare(strict_types=1);

use Database\Seeders\ContentSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Three FAQ answers reworded by the copy sweep of 01.10.2026 (ContentSeeder::FAQ_HOW_WE_KNOW and its two siblings),
 * brought to a database seeded before. A release seed would bring them too, but it re-applies every seeder; this
 * touches three rows and nothing else.
 *
 * A row changes only while it still holds exactly the old words and nobody has edited it in Inhalte › FAQ: an answer
 * the team wrote is theirs. A fresh database has no rows yet, and the seeder writes the new words itself.
 */
return new class extends Migration
{
    /** @var array<string, string> question => the answer as it was seeded before */
    private const BEFORE = [
        'Woher weiß ich, ob eine Felge zu meinem Auto passt?' => 'Sobald du dein Fahrzeug gewählt hast, prüfen wir jede Felge gegen das zugehörige Gutachten – Felgenbreite, Einpresstiefe, zulässige Reifengrößen und Auflagen. Was dir angezeigt wird, ist freigegeben. Einzelne Kombinationen kannst du jederzeit über RIMIFY-CHECK nachprüfen.',
        'Was bedeutet „Eintragung erforderlich"?' => 'Bei manchen Felgen verlangt das Gutachten, dass die Änderung von einer amtlich anerkannten Prüfstelle abgenommen und in die Fahrzeugpapiere eingetragen wird. Wir weisen darauf hin, bevor du die Felge in den Warenkorb legst – und du kannst gezielt nach Felgen ohne Eintragungspflicht filtern.',
        'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?' => 'In der Zulassungsbescheinigung Teil I stehen sie in den Feldern 2.1 (HSN, vierstellig) und 2.2 (TSN, dreistellig). Im älteren Fahrzeugschein stehen dieselben Nummern an anderer Stelle – beide Varianten zeigen wir dir in der Fahrzeugauswahl.',
    ];

    public function up(): void
    {
        foreach (self::after() as $question => $answer) {
            DB::table('faq_entries')
                ->where('question_de', $question)
                ->where('answer_de', self::BEFORE[$question])
                ->whereNull('team_edited_at')
                ->update(['answer_de' => $answer, 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        foreach (self::after() as $question => $answer) {
            DB::table('faq_entries')
                ->where('question_de', $question)
                ->where('answer_de', $answer)
                ->whereNull('team_edited_at')
                ->update(['answer_de' => self::BEFORE[$question], 'updated_at' => now()]);
        }
    }

    /** @return array<string, string> question => the answer it is reworded to */
    private static function after(): array
    {
        return [
            'Woher weiß ich, ob eine Felge zu meinem Auto passt?' => ContentSeeder::FAQ_HOW_WE_KNOW,
            ContentSeeder::FAQ_ENTRY_QUESTION => ContentSeeder::FAQ_ENTRY,
            'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?' => ContentSeeder::FAQ_KEY_NUMBERS,
        ];
    }
};
