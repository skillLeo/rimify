<?php

declare(strict_types=1);

use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Event;

/*
 * rimify:mail-test (docs/launch/GO-LIVE.md §9): one message through the configured mailer, and a
 * mailer that only writes to the log is not called sending.
 */

it('sends one message from the configured sender and says so', function (): void {
    config(['mail.default' => 'array', 'mail.from.address' => 'shop@rimify.de']);
    $sent = [];
    Event::listen(MessageSent::class, function (MessageSent $event) use (&$sent): void {
        $sent[] = $event->message;
    });

    // The array mailer holds the message; the command reports it as not sent, which is the point.
    $this->artisan('rimify:mail-test', ['to' => 'pruefung@example.com'])
        ->expectsOutputToContain('Written to the array mailer, not sent')
        ->assertFailed();

    expect($sent)->toHaveCount(1)
        ->and($sent[0]->getSubject())->toBe('RIMIFY – Testnachricht zum E-Mail-Versand')
        ->and($sent[0]->getTo()[0]->getAddress())->toBe('pruefung@example.com')
        ->and($sent[0]->getFrom()[0]->getAddress())->toBe('shop@rimify.de');
});

it('sends the deliverability test in the confirmation\'s layout, with two PDFs, for Gmail, Outlook and GMX to judge', function (): void {
    config(['mail.default' => 'array', 'mail.from.address' => 'bestellung@rimify.de']);
    $sent = [];
    Event::listen(MessageSent::class, function (MessageSent $event) use (&$sent): void {
        $sent[] = $event->message;
    });

    $this->artisan('rimify:mail-test', ['to' => 'pruefung@gmx.de', '--anhaenge' => true])->assertFailed();

    $attachments = $sent[0]->getAttachments();

    expect($sent)->toHaveCount(1)
        ->and($sent[0]->getSubject())->toBe('RIMIFY – Zustellprüfung mit zwei PDF-Anhängen')
        ->and($sent[0]->getHtmlBody())->toContain('Zustellprüfung')
        ->and(array_map(static fn ($a): ?string => $a->getFilename(), $attachments))->toBe(['Rechnung-Muster.pdf', 'Widerrufsbelehrung-Muster.pdf'])
        ->and(array_map(static fn ($a): string => substr($a->getBody(), 0, 5), $attachments))->toBe(['%PDF-', '%PDF-']);
});

it('refuses what is not an address', function (): void {
    $this->artisan('rimify:mail-test', ['to' => 'kein-empfaenger'])->expectsOutputToContain('Not an e-mail address')->assertExitCode(2);
});

it('reports a transport that refuses, without sending anything', function (): void {
    config(['mail.default' => 'smtp', 'mail.mailers.smtp.host' => '127.0.0.1', 'mail.mailers.smtp.port' => 1, 'mail.mailers.smtp.timeout' => 1]);

    $this->artisan('rimify:mail-test', ['to' => 'pruefung@example.com'])
        ->expectsOutputToContain('Not sent (smtp)')
        ->assertFailed();
});
