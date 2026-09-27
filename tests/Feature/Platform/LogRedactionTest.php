<?php

declare(strict_types=1);

use App\Logging\RedactSecrets;
use Illuminate\Support\Facades\Log;

/*
 * No key reaches a log file (App\Logging\SecretRedactor, a `tap` on every channel): a value named
 * like a secret is cut to its last four, an AWS key id is masked wherever it appears.
 */

it('masks keys in the message and the context before a channel writes them', function (): void {
    $path = storage_path('logs/redaction-test-'.getmypid().'.log');
    @unlink($path);
    config(['logging.channels.redaction_test' => [...config('logging.channels.single'), 'path' => $path]]);

    // A made-up key id of the AWS shape, put together here so no scanner of the repository takes it for a real one.
    $keyId = 'AKIA'.'FAKEFORTEST0WXYZ';

    Log::channel('redaction_test')->warning("Upload mit {$keyId} abgelehnt", [
        'secret' => 'fake/secret/for/tests/only/0000X9Y8',
        'nested' => ['access_key' => 'FAKEKEYFORTESTS0AB12', 'note' => "Schlüssel {$keyId}"],
        'bucket' => 'rimify-media-test',
    ]);

    $written = (string) file_get_contents($path);
    @unlink($path);

    expect($written)->not->toContain($keyId)
        ->and($written)->not->toContain('fake/secret/for/tests/only/0000X9Y8')
        ->and($written)->not->toContain('FAKEKEYFORTESTS0AB12')
        ->and($written)->toContain('••••••••••••WXYZ')
        ->and($written)->toContain('••••••••••••X9Y8')
        ->and($written)->toContain('rimify-media-test');
});

it('carries the redaction on every channel that writes somewhere', function (): void {
    foreach (['single', 'daily', 'monthly', 'slack', 'papertrail', 'stderr', 'syslog', 'errorlog'] as $channel) {
        expect(config("logging.channels.{$channel}.tap"))->toContain(RedactSecrets::class);
    }
});
