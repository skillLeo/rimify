<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Support\GermanFormat;
use App\Support\Seller;
use App\Support\WithdrawalForm;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;

/**
 * The AGB and the Widerrufsbelehrung as PDFs for the order confirmation (§ 312f Abs. 2 BGB; the operator's brief of
 * 05.10.2026, §6): the pages' live words as LegalTexts reads them — exactly what the shop shows, never a second copy that
 * could drift — rendered by the same dompdf the invoice is, with the seller and the date they were sent on. The
 * Widerrufsbelehrung carries the Muster-Widerrufsformular after it, addressed with the seller's own data.
 */
final class LegalPdf
{
    public const AGB = 'AGB.pdf';

    public const WIDERRUF = 'Widerrufsbelehrung.pdf';

    public function __construct(private readonly LegalTexts $texts) {}

    /** The AGB as a PDF, or null while the page holds no text of the Kanzlei's — a placeholder is never sent as terms. */
    public function agb(?string $order = null): ?string
    {
        $text = $this->texts->placeholder('agb') ? null : $this->texts->text('agb');

        return $text === null ? null : $this->render('Allgemeine Geschäftsbedingungen', $text, null, $order);
    }

    /**
     * The Widerrufsbelehrung with the Muster-Widerrufsformular as a PDF, or null while the page holds no text of the
     * Kanzlei's. The form follows only once its own placeholder flag is off (D-319); until then the PDF holds the
     * Belehrung alone.
     */
    public function widerruf(?string $order = null): ?string
    {
        $text = $this->texts->placeholder('widerrufsbelehrung') ? null : $this->texts->text('widerrufsbelehrung');
        $form = $this->texts->placeholder(LegalTexts::FORM) ? null : WithdrawalForm::text(Seller::current());

        return $text === null ? null : $this->render('Widerrufsbelehrung', $text, $form, $order);
    }

    private function render(string $title, string $text, ?string $form, ?string $order): string
    {
        return Pdf::loadView('pdf.legal', [
            'title' => $title,
            'text' => self::printable($text),
            'form' => $form === null ? null : self::printable($form),
            'order' => $order,
            'date' => GermanFormat::date(CarbonImmutable::now('Europe/Berlin')),
            'seller' => Seller::current()->documentLine(),
        ])->setPaper('a4')->output();
    }

    /** DejaVu Sans, dompdf's bundled face, has no narrow no-break space: it is printed as a plain one, as on the invoice. */
    private static function printable(string $text): string
    {
        return str_replace("\u{202F}", "\u{00A0}", $text);
    }
}
