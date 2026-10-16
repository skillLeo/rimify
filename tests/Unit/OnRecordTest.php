<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\VerdictReason;
use Tests\Support\OnRecord;
use Tests\Support\OnRecordTable;

/*
 * R-17 — say only what is on record. The shop may state what RIMIFY has recorded and what follows from it; it may never
 * state what an external document does or does not contain, unless that absence is itself a recorded and verified field.
 *
 * Three findings of one family came before the rule (the operator's decision of 14.10.2026): two tyre sizes' snow-chain
 * Auflagen printed without their sizes, „Das Gutachten druckt keine Tabelle …“ for a table that had merely not been
 * entered, and „Keine Freigabe hinterlegt“ over a wheel its Gutachten approves. This test is the class: every sentence
 * that names a Gutachten, an ABE, a Nachtrag, a manufacturer or a document *and denies or restricts something* stands in
 * `tests/Support/on-record-ledger.php` with a verdict. A new sentence of that shape fails here until someone names what
 * backs it — or rewords it to say what is on record with us („bei uns hinterlegt“, „liegt uns vor“).
 */

/** @return array<string, array{0: string, 1: string}> */
function onRecordLedger(): array
{
    return require dirname(__DIR__).'/Support/on-record-ledger.php';
}

it('lets no sentence deny something of a Gutachten, a manufacturer or a document without a verdict on it (R-17)', function (): void {
    $known = array_keys(onRecordLedger());
    $unlisted = [];

    foreach (OnRecord::claims() as $claim) {
        if (array_filter($known, fn (string $part): bool => str_contains($claim['text'], $part)) === []) {
            $unlisted[] = "{$claim['file']}:{$claim['line']}  {$claim['text']}";
        }
    }

    expect($unlisted)->toBe([], "These sentences say what an external document does not contain or allow, or that we quote it whole or word for word, and nothing says what backs them.\n"
        ."Reword each to what is on record with us (\u{201E}bei uns hinterlegt\u{201C}, \u{201E}liegt uns vor\u{201C}), or list it in tests/Support/on-record-ledger.php with the field (R-17):\n  "
        .implode("\n  ", $unlisted));
});

it('keeps no verdict for a sentence that is no longer written anywhere', function (): void {
    $texts = array_column(OnRecord::claims(), 'text');

    // An entry nobody uses is a hole waiting for the next sentence that happens to contain it.
    $stale = array_values(array_filter(
        array_keys(onRecordLedger()),
        fn (string $part): bool => array_filter($texts, fn (string $text): bool => str_contains($text, $part)) === [],
    ));

    expect($stale)->toBe([]);
});

it('keeps docs/review/ON-RECORD.md the list as it stands — kept by hand it drifted from the ledger', function (): void {
    $written = str_replace("\r\n", "\n", (string) file_get_contents(dirname(__DIR__, 2).'/'.OnRecordTable::FILE));

    expect($written)->toBe(OnRecordTable::render(onRecordLedger(), OnRecord::claims()), 'ON-RECORD.md is not the ledger as it stands: php scripts/review/on-record.php writes it.');
});

it('gives every listed sentence a verdict and a reason, and every open one its finding', function (): void {
    foreach (onRecordLedger() as $part => [$verdict, $why]) {
        expect($verdict)->toBeIn(['backed', 'ours', 'code', 'open'], $part)
            ->and(mb_strlen($why))->toBeGreaterThan(15, $part);

        if ($verdict === 'open') {
            expect($why)->toMatch('/^(EIGENE-FUNDE|ADMIN-GEFUNDEN) \d{3}: /', $part);
        }
    }
});

it('catches the sentences the rule was written for', function (string $sentence): void {
    expect(OnRecord::denies($sentence))->toBeTrue()
        ->and(OnRecord::speaksOfOurRecord($sentence))->toBeFalse();
})->with([
    'the table that was only not entered' => ['Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.'],
    'the car the record did not hold' => ['Das Gutachten führt dieses Fahrzeug nicht auf.'],
    'the tyres nobody typed in' => ['Welche Reifen dein Fahrzeug mit dieser Felge braucht, sagt das Gutachten nicht.'],
    'a denial that opens the sentence' => ['Kein Hersteller gibt diese Größe frei.'],
    'a restriction' => ['Die ABE nennt nur Sommerreifen.'],
]);

it('lets the same things be said as what is on record', function (string $sentence): void {
    expect(OnRecord::denies($sentence) && ! OnRecord::speaksOfOurRecord($sentence))->toBeFalse();
})->with([
    ['Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.'],
    ['Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.'],
    ['Für dieses Fahrzeug liegt uns die entsprechende Anlage des Gutachtens noch nicht vor.'],
    ['Eine Auflage des Gutachtens ist bei uns noch nicht vollständig erfasst.'],
    ['Das Gutachten nennt dein Fahrzeug und diese Reifengröße.'],
]);

/*
 * The other direction (the operator's brief of 14.10.2026 §9, D-236): the first pattern looks for a denial and cannot see
 * „So steht es im Gutachten“ or „Wörtlich aus dem Gutachten“ — the two of finding 118. What we hold may be a part of the
 * document, so a claim of wholeness or literalness needs a verdict just as a denial does.
 */
it('catches a claim that we hold a document whole, word for word, or always', function (string $sentence): void {
    expect(OnRecord::asserts($sentence))->toBeTrue()
        ->and(OnRecord::speaksOfOurRecord($sentence))->toBeFalse();
})->with([
    'finding 118, the heading' => ['So steht es im Gutachten.'],
    'finding 118, the lede' => ['Wörtlich aus dem Gutachten.'],
    'everything a document allows' => ['In der Felgenliste siehst du alles, was das Gutachten für dein Fahrzeug erlaubt.'],
    'always' => ['Das Gutachten verlangt immer eine Abnahme.'],
    'every one' => ['Sämtliche Auflagen des Gutachtens stehen hier.'],
]);

it('lets the same be said as what we hold, and does not trip on a word that merely starts like one', function (string $sentence): void {
    expect(OnRecord::asserts($sentence) && ! OnRecord::speaksOfOurRecord($sentence))->toBeFalse();
})->with([
    ['Der bei uns hinterlegte Wortlaut des Gutachtens, ohne unsere Gliederung.'],
    ['In der Felgenliste siehst du jede Felge, deren Freigabe für dein Fahrzeug bei uns hinterlegt ist.'],
    ['Allerdings nennt das Gutachten eine Abnahme.'],
    ['Allem voran nennt das Gutachten die Felgenbreite.'],
]);

it('reads a sentence that wraps in a template, and skips what a customer never reads', function (): void {
    $root = sys_get_temp_dir().'/rimify-on-record-'.bin2hex(random_bytes(4));
    mkdir($root.'/resources/js/Pages', 0777, true);
    file_put_contents($root.'/resources/js/Pages/Probe.vue', <<<'VUE'
        <script setup lang="ts">
        // Das Gutachten nennt dieses Fahrzeug nicht – a comment, not a sentence on the page.
        const label = 'Felge'
        </script>

        <template>
            <!-- Der Hersteller gibt nichts frei. -->
            <p>
                Der Hersteller gibt diese Größe für dein Fahrzeug
                nicht frei.
            </p>
        </template>
        VUE);

    try {
        $claims = OnRecord::claims($root);
    } finally {
        unlink($root.'/resources/js/Pages/Probe.vue');
        rmdir($root.'/resources/js/Pages');
        rmdir($root.'/resources/js');
        rmdir($root.'/resources');
        rmdir($root);
    }

    expect($claims)->toHaveCount(1)
        ->and($claims[0]['text'])->toBe('Der Hersteller gibt diese Größe für dein Fahrzeug nicht frei.')
        ->and($claims[0]['line'])->toBe(9);
});

/*
 * The rule's last sentence: where something is unknown, the wording names what is unknown, why, and what would resolve
 * it — never a blanket refusal. A blanket refusal is, by its nature, the sentence two different causes share.
 */
it('gives every reason of the engine a sentence of its own', function (): void {
    $codes = array_filter(
        (new ReflectionClass(VerdictReason::class))->getConstants(),
        fn (mixed $value): bool => is_string($value),
    );
    $sentences = array_map(fn (string $code): string => VerdictReason::sentenceFor($code), $codes);
    $shared = array_keys(array_filter(array_count_values($sentences), fn (int $n): bool => $n > 1));

    expect($codes)->not->toBe([])
        ->and($shared)->toBe([]);
});

it('never answers an unknown with the bare refusal', function (): void {
    $codes = array_filter(
        (new ReflectionClass(VerdictReason::class))->getConstants(),
        fn (mixed $value): bool => is_string($value),
    );

    foreach ($codes as $code) {
        expect(VerdictReason::sentenceFor($code))->not->toBe('Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.', $code);
    }
});
