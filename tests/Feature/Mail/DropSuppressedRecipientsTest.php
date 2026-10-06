<?php

declare(strict_types=1);

use App\Models\MailSuppression;
use Illuminate\Mail\Message;
use Illuminate\Mail\SentMessage;
use Illuminate\Mail\Transport\ArrayTransport;
use Illuminate\Support\Facades\Mail;

/*
 * Nothing leaves for an address SES reported as undeliverable or complaining (DropSuppressedRecipients): a message to
 * it alone is not sent, a message to it and others goes to the others, and a released block lets mail through again.
 * Sent with the real mailer on the array transport, so the listener runs as it does on the host.
 */

function blockAddress(string $email, ?string $released = null): MailSuppression
{
    return MailSuppression::query()->forceCreate([
        'email' => $email, 'reason' => MailSuppression::BOUNCE, 'detail' => 'Permanent/General',
        'sns_message_id' => 'msg-'.bin2hex(random_bytes(4)), 'occurred_at' => now(), 'released_at' => $released,
    ]);
}

/** @return list<SentMessage> */
function sentMails(): array
{
    /** @var ArrayTransport $transport */
    $transport = app('mail.manager')->mailer('array')->getSymfonyTransport();

    return $transport->messages()->all();
}

beforeEach(function (): void {
    config(['mail.default' => 'array']);
});

it('sends nothing to a blocked address, and the rest of a message to the others', function (): void {
    blockAddress('weg@example.org');

    Mail::raw('Hallo', static fn (Message $m) => $m->to('Weg@example.org')->subject('Nur an die gesperrte'));
    Mail::raw('Hallo', static fn (Message $m) => $m->to(['weg@example.org', 'da@example.org'])->cc('weg@example.org')->subject('An beide'));

    $sent = sentMails();
    $email = $sent[0]->getOriginalMessage();

    expect($sent)->toHaveCount(1)
        ->and($email->getSubject())->toBe('An beide')
        ->and(array_map(static fn ($a) => $a->getAddress(), $email->getTo()))->toBe(['da@example.org'])
        ->and($email->getCc())->toBe([]);
});

it('sends again once the block is released', function (): void {
    blockAddress('wieder@example.org', released: now()->toDateTimeString());

    Mail::raw('Hallo', static fn (Message $m) => $m->to('wieder@example.org')->subject('Wieder da'));

    expect(sentMails())->toHaveCount(1);
});
