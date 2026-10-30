<?php

declare(strict_types=1);

use App\Models\MailSetting;
use App\Support\MailDelivery;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/*
 * Whether a mail leaves the shop, said as it is (D-364). The preview's mailer writes to the log, but its LOG_LEVEL
 * is `warning` and the log mailer writes at debug, so its mails were kept nowhere while the admin said they stood in
 * the server's log; and an active SES set counts only once the mail manager is made, so a page that asked before
 * anything had sent was told „not mailed“ — the contact form would never have forwarded a message.
 */

it('counts an active, cleared SES set as delivery before anything has made the mailer', function (): void {
    config(['mail.default' => 'log']);
    MailSetting::query()->forceCreate([
        'state' => MailSetting::ACTIVE, 'from_address' => 'bestellung@rimify.de', 'access_key' => 'FAKESESKEYFORTESTS12', 'secret' => 'fake/ses/secret/for/tests/only/00X9Y8',
        'verified_at' => now(),
        'last_test' => ['ok' => true, 'steps' => [], 'at' => now()->toIso8601String(), 'production_access' => true, 'sending_enabled' => true, 'identity_verified' => true],
    ]);
    // A request that has sent nothing yet: no mail manager made.
    app()->forgetInstance('mail.manager');
    Mail::clearResolvedInstance('mail.manager');

    expect(app()->resolved('mail.manager'))->toBeFalse()
        ->and(MailDelivery::real())->toBeTrue()
        ->and(config('mail.default'))->toBe('ses-v2');
});

it('says no mail leaves while the mailer writes to the log and no SES set is cleared', function (): void {
    config(['mail.default' => 'log']);
    app()->forgetInstance('mail.manager');
    Mail::clearResolvedInstance('mail.manager');

    expect(MailDelivery::real())->toBeFalse();
});

it('keeps every mail of the log mailer in its own file, whatever LOG_LEVEL hides', function (): void {
    $base = storage_path('logs/test-d364-'.bin2hex(random_bytes(4)));
    // The preview's level: the main log keeps warnings and worse, a mail is written at debug.
    config(['mail.default' => 'log', 'logging.channels.single.level' => 'warning', 'logging.channels.daily.level' => 'warning', 'logging.channels.mail.path' => $base.'.log']);
    Log::forgetChannel('mail');
    app()->forgetInstance('mail.manager');
    Mail::clearResolvedInstance('mail.manager');

    try {
        app('mail.manager')->mailer('log')->raw('Dein Link zur Bestellung.', fn ($message) => $message->to('kunde@example.com')->subject('Pruefung D-364'));
        $files = glob($base.'*.log') ?: [];

        expect($files)->toHaveCount(1)
            ->and((string) file_get_contents($files[0]))->toContain('Subject: Pruefung D-364')->toContain('Dein Link zur Bestellung.');
    } finally {
        array_map('unlink', glob($base.'*') ?: []);
    }
});
