<?php

declare(strict_types=1);

use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;

/**
 * The three FAQ answers reworded by the copy sweep of 01.10.2026 reach a database seeded before — but only where
 * the old words still stand and nobody has edited the answer in Inhalte › FAQ.
 */
function faqRewordRow(string $question, string $answer, bool $edited = false): void
{
    DB::table('faq_entries')->insert([
        'group_key' => 'KOMPATIBILITÄT & FREIGABE',
        'question_de' => $question,
        'answer_de' => $answer,
        'sort_order' => 10,
        'published' => true,
        'team_edited_at' => $edited ? now() : null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function faqRewordAnswer(string $question): string
{
    return (string) DB::table('faq_entries')->where('question_de', $question)->value('answer_de');
}

it('rewords the three seeded answers, leaves an edited one alone, and goes back', function (): void {
    $migration = require database_path('migrations/commerce/2026_10_01_000100_reword_three_faq_answers.php');
    $how = 'Woher weiß ich, ob eine Felge zu meinem Auto passt?';
    $keys = 'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?';
    $old = 'Sobald du dein Fahrzeug gewählt hast, prüfen wir jede Felge gegen das zugehörige Gutachten – Felgenbreite, Einpresstiefe, zulässige Reifengrößen und Auflagen. Was dir angezeigt wird, ist freigegeben. Einzelne Kombinationen kannst du jederzeit über RIMIFY-CHECK nachprüfen.';

    faqRewordRow($how, $old);
    faqRewordRow(ContentSeeder::FAQ_ENTRY_QUESTION, 'Eine Antwort, die das Team selbst geschrieben hat.', edited: true);
    faqRewordRow($keys, 'In der Zulassungsbescheinigung Teil I stehen sie in den Feldern 2.1 (HSN, vierstellig) und 2.2 (TSN, dreistellig). Im älteren Fahrzeugschein stehen dieselben Nummern an anderer Stelle – beide Varianten zeigen wir dir in der Fahrzeugauswahl.');

    $migration->up();

    expect(faqRewordAnswer($how))->toBe(ContentSeeder::FAQ_HOW_WE_KNOW)
        ->and(faqRewordAnswer($how))->not->toContain('ist freigegeben')
        ->and(faqRewordAnswer($keys))->toBe(ContentSeeder::FAQ_KEY_NUMBERS)
        ->and(faqRewordAnswer(ContentSeeder::FAQ_ENTRY_QUESTION))->toBe('Eine Antwort, die das Team selbst geschrieben hat.');

    $migration->down();

    expect(faqRewordAnswer($how))->toBe($old);
});

it('seeds the reworded answers on a fresh database', function (): void {
    $this->seed(ContentSeeder::class);

    expect(faqRewordAnswer('Woher weiß ich, ob eine Felge zu meinem Auto passt?'))->toBe(ContentSeeder::FAQ_HOW_WE_KNOW)
        ->and(faqRewordAnswer(ContentSeeder::FAQ_ENTRY_QUESTION))->toBe(ContentSeeder::FAQ_ENTRY)
        ->and(faqRewordAnswer('Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?'))->toBe(ContentSeeder::FAQ_KEY_NUMBERS);
});
