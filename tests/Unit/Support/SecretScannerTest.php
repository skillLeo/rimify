<?php

declare(strict_types=1);

use App\Support\Security\SecretScanner;

/*
 * The credential shapes secrets:scan refuses (docs/dev/SECRETS.md). Every fake below is assembled at
 * run time, so this file itself holds no key shape for the scanner — or anyone's — to find.
 */

function fakeKey(string $prefix, int $length = 24): string
{
    return $prefix.substr(str_repeat('a1B2c3D4', 8), 0, $length);
}

it('finds every credential shape it guards, and shows only the last four characters', function (string $line, string $rule, string $masked): void {
    $found = SecretScanner::line($line);

    expect($found)->toHaveCount(1)
        ->and($found[0]['rule'])->toBe($rule)
        ->and($found[0]['masked'])->toBe($masked);
})->with([
    'Stripe live secret' => [fn () => 'STRIPE_SECRET='.fakeKey('sk_'.'live_'), 'stripe-live-secret', 'sk_live_…c3D4'],
    'Stripe live restricted' => [fn () => '"'.fakeKey('rk_'.'live_').'"', 'stripe-live-restricted', 'rk_live_…c3D4'],
    'Stripe test secret' => [fn () => fakeKey('sk_'.'test_'), 'stripe-test-secret', 'sk_test_…c3D4'],
    'Stripe live publishable' => [fn () => "key: '".fakeKey('pk_'.'live_')."'", 'stripe-live-publishable', 'pk_live_…c3D4'],
    'Stripe webhook secret' => [fn () => 'STRIPE_WEBHOOK_SECRET='.fakeKey('wh'.'sec_', 32), 'stripe-webhook-secret', 'whsec_…c3D4'],
    'AWS access key id' => [fn () => 'AWS_ACCESS_KEY_ID='.'AK'.'IA'.'Q3EGRX7L5OZ4W2MB', 'aws-access-key', 'AKIA …W2MB'],
    'AWS secret' => [fn () => 'AWS_SECRET_ACCESS_KEY='.'wJalrXUtnFEMI/K7MDENG/bPxRfi'.'CYEXAMPLEKEY', 'aws-secret-key', '…EKEY'],
    'PEM private key' => [fn () => '-----BEGIN RSA '.'PRIVATE KEY-----', 'private-key', '-----BEGIN RSA '.'PRIVATE KEY-----'],
    'database URL with password' => [fn () => 'DB_URL=mysql://rimify:'.'s3cr3t-Pass@127.0.0.1:3306/rimify', 'database-url-password', 'DB_URL …Pass'],
]);

it('leaves the repository’s own words about keys alone', function (string $line): void {
    expect(SecretScanner::line($line))->toBe([]);
})->with([
    'a sentence naming the prefix' => ['A key whose prefix marks it as live (`sk_live_…`) is refused.'],
    'phpunit’s test secret' => ['<env name="STRIPE_WEBHOOK_SECRET" value="whsec_test_secret"/>'],
    'an empty .env.example entry' => ['STRIPE_SECRET='],
    'a placeholder' => ['STRIPE_SECRET=sk_test_replace_me'],
    'a SHA-1 in a lock file' => ['"reference": "5c360c56a3255437d81cc7de9cb03cdce3823278",'],
    'a Git commit hash beside the word secret' => ['secret: 5c360c56a3255437d81cc7de9cb03cdce3823278'],
    'a database URL without a password' => ['DB_URL=mysql://rimify@127.0.0.1/rimify'],
    'a public key' => ['-----BEGIN PUBLIC KEY-----'],
    'an ordinary line' => ['return GermanFormat::money($cents);'],
]);

it('numbers the lines of a text from one', function (): void {
    $text = "first\n\nSTRIPE_SECRET=".fakeKey('sk_'.'live_')."\r\nlast";

    expect(SecretScanner::text($text))->toBe([
        ['line' => 3, 'rule' => 'stripe-live-secret', 'what' => 'Stripe live secret key', 'masked' => 'sk_live_…c3D4'],
    ]);
});
