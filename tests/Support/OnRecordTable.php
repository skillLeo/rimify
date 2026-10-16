<?php

declare(strict_types=1);

namespace Tests\Support;

/**
 * `docs/review/ON-RECORD.md` — R-17's ledger as the table the operator reads, made from the ledger and the scan, never
 * kept by hand: kept by hand it drifted from the ledger (10 „open“ while one was, sentences reworded long ago still
 * listed — found 16.10.2026). `OnRecordTest` holds the file to this; `php scripts/review/on-record.php` writes it.
 *
 * „Where“ names files, not lines: a line that moves is not a change of the list.
 */
final class OnRecordTable
{
    public const FILE = 'docs/review/ON-RECORD.md';

    /** Verdict => section title, the column that says why, and how the count names it. */
    private const SECTIONS = [
        'open' => ['Open — says more than the record supports, or waits for a decision', 'Finding', 'open'],
        'backed' => ['Backed — follows from a recorded and verified field', 'The field', 'backed by a recorded field'],
        'ours' => ['About the shop — what it does, holds or requires, not what a document contains', 'What it says', 'about the shop itself'],
        'code' => ['Not a sentence', 'What it is', 'not sentences'],
    ];

    private const HEAD = <<<'MD'
        # ON-RECORD — every sentence that denies something of a document, and what backs it

        CLAUDE.md R-17 (14.10.2026): the shop may state what RIMIFY has recorded and what follows from it; it may never state
        what an external document does or does not contain, unless that absence is itself a recorded and verified field.

        This is the list the rule asked for: every sentence in the product — engine, shop pages, e-mails, PDFs, admin — that
        names a Gutachten, an ABE, a Nachtrag, a manufacturer or a document **and denies or restricts something** in the same
        breath. It is written from `tests/Support/on-record-ledger.php` and the scan by `php scripts/review/on-record.php`;
        `tests/Unit/OnRecordTest.php` fails when a sentence of this shape appears that is not on the list, when an entry is
        no longer written anywhere, and when this file is not the list as it stands.
        MD;

    private const BLIND = <<<'MD'
        What the scan cannot see: a claim worded with neither a word for the document nor a word of denial („So steht es im
        Gutachten“, „Wörtlich aus dem Gutachten“). Those were read by eye; the two that matter are in finding 118.
        MD;

    private const HISTORY = <<<'MD'
        ## Reworded on 14.10.2026 — the answer is the same, the sentence now says what is on record

        No verdict changed. Each sentence said what a document does not contain; each now says what is not on record with us.
        The last two were the same bare refusal for two different causes (the rule's last sentence).

        | Now | Before | Where it is read |
        |---|---|---|
        | „Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.“ | „Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.“ | the tyre check (finding 104, the operator's wording) |
        | „Für %s km/h ist in der hinterlegten Tabelle für Geschwindigkeitsindex %s kein Wert eingetragen.“ | „Für %s km/h nennt die Tabelle des Gutachtens für Geschwindigkeitsindex %s keinen Wert.“ | the tyre check |
        | „Zu den Auflagen dieses Gutachtens sind Tragfähigkeitsindizes nur bis %s Achslast hinterlegt; die %s trägt %s.“ | „Die Auflagen des Gutachtens nennen Tragfähigkeitsindizes nur bis %s Achslast; die %s trägt %s.“ | the tyre check |
        | „Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.“ | „Das Gutachten führt dieses Fahrzeug nicht auf.“ | the reason under „nicht zulässig“ (see finding 119) |
        | „Welche Reifen dein Fahrzeug mit dieser Felge braucht, ist bei uns zu diesem Gutachten nicht hinterlegt. Die Reifen können wir deshalb nicht bestätigen.“ | „Welche Reifen dein Fahrzeug mit dieser Felge braucht, sagt das Gutachten nicht. Wir können die Freigabe deshalb nicht bestätigen.“ | the reason under an unconfirmed tyre size |
        | „Für diese Kombination ist bei uns keine Reifengröße hinterlegt.“ | „Für diese Kombination nennt das Gutachten keine Reifengröße.“ | why no Komplettrad is offered |
        | „Für die zulässige Achslast deines Fahrzeugs ist in dieser Reifengröße kein Tragfähigkeitsindex hinterlegt.“ | „Für die zulässige Achslast deines Fahrzeugs nennt das Gutachten in dieser Reifengröße keinen Tragfähigkeitsindex.“ | why no Komplettrad is offered |
        | „Unterschiedliche Reifengrößen vorne und hinten sind für dein Fahrzeug mit dieser Felge nicht hinterlegt.“ | „Unterschiedliche Reifengrößen vorne und hinten nennt das Gutachten für dein Fahrzeug mit dieser Felge nicht.“ | why no mixed set is offered |
        | „Diese Reifengrößen für vorne und hinten sind für dein Fahrzeug nicht als Kombination hinterlegt.“ | „Diese Reifengrößen für vorne und hinten nennt das Gutachten für dein Fahrzeug nicht als Kombination.“ | why this mixed set is not offered |
        | „Dieses Fahrzeug führen wir nicht mehr in unseren Daten. Wähl dein Fahrzeug bitte neu aus – dann prüfen wir die Felge dafür.“ | „Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.“ | a vehicle that was removed — the bare refusal, named |
        | „Für die Prüfung der Reifen fehlen uns gerade die Tabellen der Tragfähigkeits- und Geschwindigkeitsindizes. Das liegt an uns, nicht an deinem Fahrzeug – bis sie hinterlegt sind, können wir die Freigabe nicht bestätigen.“ | „Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.“ | a fault in our own reference data — the bare refusal, named |
        MD;

    /**
     * @param  array<string, array{0: string, 1: string}>  $ledger
     * @param  list<array{file: string, line: int, text: string, admin: bool}>  $claims
     */
    public static function render(array $ledger, array $claims): string
    {
        usort($claims, static fn (array $a, array $b): int => [$a['file'], $a['line']] <=> [$b['file'], $b['line']]);

        $rows = array_fill_keys(array_keys(self::SECTIONS), []);

        foreach ($ledger as $part => [$verdict, $why]) {
            $found = array_values(array_filter($claims, static fn (array $claim): bool => str_contains($claim['text'], $part)));
            $files = array_values(array_unique(array_map(static fn (array $claim): string => self::short($claim['file']), $found)));
            $customer = array_filter($found, static fn (array $claim): bool => ! $claim['admin']) !== [];

            $rows[$verdict][] = sprintf(
                '| „%s“ | %s | %s | %s |',
                self::cell(isset($found[0]) ? self::sentence($found[0]['text'], $part) : $part),
                $customer ? 'customer / operator' : 'admin',
                $files === [] ? '–' : implode(', ', array_map(static fn (string $file): string => '`'.$file.'`', $files)),
                self::cell($why),
            );
        }

        $counts = [];

        foreach (self::SECTIONS as $verdict => [, , $named]) {
            $counts[] = count($rows[$verdict]).' '.$named;
        }

        $out = [self::HEAD, '', sprintf('**%d sentences: %s.**', count($ledger), implode(', ', $counts)), '', self::BLIND];

        foreach (self::SECTIONS as $verdict => [$title, $column]) {
            $out[] = '';
            $out[] = '## '.$title;
            $out[] = '';

            if ($rows[$verdict] === []) {
                $out[] = 'None.';

                continue;
            }

            $out[] = "| Sentence | Read by | Where | {$column} |";
            $out[] = '|---|---|---|---|';
            array_push($out, ...$rows[$verdict]);
        }

        $out[] = '';
        $out[] = self::HISTORY;

        return implode("\n", $out)."\n";
    }

    /**
     * The sentence as a reader meets it, out of the line the scan found it on: from the quote or tag before the listed
     * part to the quote or tag after it — the string a line of code holds, the text a template line holds.
     */
    private static function sentence(string $text, string $part): string
    {
        $at = strpos($text, $part);

        if ($at === false) {
            return $text;
        }

        $before = substr($text, 0, $at);
        $after = substr($text, $at + strlen($part));
        $left = preg_match('/[\'"`>]([^\'"`>]*)$/u', $before, $l) === 1 ? $l[1] : $before;
        $right = preg_match('/^([^\'"`<]*)/u', $after, $r) === 1 ? $r[1] : $after;

        return trim($left.$part.$right);
    }

    /** `app/Domain/…` → `Domain/…`, `resources/js/Pages/…` → `Pages/…`: as the list has always named them. */
    private static function short(string $file): string
    {
        return (string) preg_replace('#^(app|resources/js|resources/views|lang)/#', '', $file);
    }

    private static function cell(string $text): string
    {
        return str_replace('|', '\|', $text);
    }
}
