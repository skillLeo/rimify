<?php

declare(strict_types=1);

namespace App\Mail;

use App\Support\GermanFormat;
use App\Support\Seller;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The deliverability test (the brief „AFTER CI“, §3; `rimify:mail-test --anhaenge`): a message shaped like the order
 * confirmation — the same layout, a link to the shop, two PDFs from the same renderer — so Gmail, Outlook and GMX judge
 * what a customer will receive, not a line of plain text. The PDFs say on every page that they are samples.
 */
class DeliverabilityTestMail extends Mailable
{
    public const ATTACHMENTS = ['Rechnung-Muster.pdf', 'Widerrufsbelehrung-Muster.pdf'];

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'RIMIFY – Zustellprüfung mit zwei PDF-Anhängen');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.test.deliverability', with: ['shop' => (string) config('app.url')]);
    }

    /** @return list<Attachment> */
    public function attachments(): array
    {
        return [
            Attachment::fromData(static fn (): string => self::sample('Rechnung – Muster für die Zustellprüfung'), self::ATTACHMENTS[0])->withMime('application/pdf'),
            Attachment::fromData(static fn (): string => self::sample('Widerrufsbelehrung – Muster für die Zustellprüfung'), self::ATTACHMENTS[1])->withMime('application/pdf'),
        ];
    }

    private static function sample(string $title): string
    {
        return Pdf::loadView('pdf.legal', [
            'title' => $title,
            'text' => "Dieses Dokument ist ein Muster. Es gehört zu einer Testnachricht, mit der RIMIFY prüft, ob seine Mails mit zwei PDF-Anhängen im Posteingang ankommen.\n\nEs ist keine Rechnung und keine Belehrung.",
            'form' => null,
            'order' => null,
            'date' => GermanFormat::date(CarbonImmutable::now('Europe/Berlin')),
            'seller' => Seller::current()->documentLine(),
        ])->setPaper('a4')->output();
    }
}
