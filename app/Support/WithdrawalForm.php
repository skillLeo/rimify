<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The Muster-Widerrufsformular, word for word as Anlage 2 zu Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 und § 2 Abs. 2 Nr. 2
 * EGBGB prints it — in the statute's „Sie“, because the model form is the law's text, not ours (the shop's du does
 * not reach into it). Only the addressee is filled in, from the seller's own data (Seller); where that is not given
 * yet, the e-mail address stands alone, which is enough to receive a Widerruf.
 *
 * One source for the page (/rechtliches/widerrufsformular) and the order confirmation mail (§ 312f BGB).
 */
final class WithdrawalForm
{
    public const TITLE = 'Muster-Widerrufsformular';

    public const INTRO = '(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)';

    /** @var list<string> */
    public const FIELDS = [
        'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)',
        'Bestellt am (*)/erhalten am (*)',
        'Name des/der Verbraucher(s)',
        'Anschrift des/der Verbraucher(s)',
        'Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)',
        'Datum',
    ];

    public const FOOTNOTE = '(*) Unzutreffendes streichen.';

    /** „An RIMIFY GmbH, Musterstraße 1, 12345 Musterstadt, E-Mail: …“ — only what the seller's data holds. */
    public static function addressee(Seller $seller): string
    {
        $parts = $seller->addressLines();

        if ($seller->email !== null) {
            $parts[] = 'E-Mail: '.$seller->email;
        }

        return 'An '.implode(', ', $parts).':';
    }

    /** The whole form as plain text, for the mail. */
    public static function text(Seller $seller): string
    {
        $lines = [self::TITLE, '', self::INTRO, '', '– '.self::addressee($seller)];

        foreach (self::FIELDS as $field) {
            $lines[] = '– '.$field;
        }

        return implode("\n", [...$lines, '', self::FOOTNOTE]);
    }
}
