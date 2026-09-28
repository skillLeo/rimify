<?php

declare(strict_types=1);

use App\Payments\StripeKeys;

/*
 * Which Stripe key is accepted where (docs/dev/SECRETS.md): a live key only in production and only in
 * Livemodus, a test key only in Testmodus, and each field only its own kind. The keys are assembled at
 * run time, so this file holds no key shape for secrets:scan to refuse.
 */

function stripeKey(string $kind, string $mode): string
{
    return $kind.'_'.$mode.'_'.str_repeat('Ab3', 8);
}

it('accepts a test key in Testmodus, anywhere', function (string $field, string $kind): void {
    expect(StripeKeys::refusal($field, stripeKey($kind, 'test'), StripeKeys::TEST, production: false))->toBeNull()
        ->and(StripeKeys::refusal($field, stripeKey($kind, 'test'), StripeKeys::TEST, production: true))->toBeNull();
})->with([['secret', 'sk'], ['secret', 'rk'], ['key', 'pk']]);

it('accepts a live key only in Livemodus on the production site', function (string $field, string $kind): void {
    expect(StripeKeys::refusal($field, stripeKey($kind, 'live'), StripeKeys::LIVE, production: true))->toBeNull();
})->with([['secret', 'sk'], ['secret', 'rk'], ['key', 'pk']]);

it('refuses a live key anywhere but production, whatever the mode', function (string $mode): void {
    expect(StripeKeys::refusal('secret', stripeKey('sk', 'live'), $mode, production: false))
        ->toBe('Live-Schlüssel nimmt RIMIFY nur im Live-Shop an, hier nie. Wurde er hierher kopiert, roll ihn im Stripe-Dashboard.');
})->with([StripeKeys::TEST, StripeKeys::LIVE]);

it('refuses a live key in Testmodus and a test key in Livemodus', function (): void {
    expect(StripeKeys::refusal('secret', stripeKey('sk', 'live'), StripeKeys::TEST, production: true))->toStartWith('Im Testmodus nimmt RIMIFY nur Testschlüssel')
        ->and(StripeKeys::refusal('secret', stripeKey('sk', 'test'), StripeKeys::LIVE, production: true))->toStartWith('Im Livemodus nimmt RIMIFY nur Live-Schlüssel')
        ->and(StripeKeys::refusal('key', stripeKey('pk', 'test'), StripeKeys::LIVE, production: true))->toStartWith('Im Livemodus');
});

it('refuses a key in the wrong field, and one that names no mode', function (): void {
    expect(StripeKeys::refusal('secret', stripeKey('pk', 'test'), StripeKeys::TEST, production: false))->toBe('Das ist kein geheimer Schlüssel von Stripe: er beginnt mit sk_… oder rk_….')
        ->and(StripeKeys::refusal('key', stripeKey('sk', 'test'), StripeKeys::TEST, production: false))->toBe('Das ist kein öffentlicher Schlüssel von Stripe: er beginnt mit pk_….')
        ->and(StripeKeys::refusal('webhook_secret', stripeKey('sk', 'test'), StripeKeys::TEST, production: false))->toStartWith('Das ist kein Webhook-Signaturschlüssel')
        ->and(StripeKeys::refusal('secret', 'sk_'.str_repeat('Ab3', 8), StripeKeys::TEST, production: false))->toStartWith('Der Schlüssel nennt weder test noch live');
});

it('takes a webhook secret in either mode, and leaves an empty field alone', function (): void {
    $webhook = 'wh'.'sec_'.str_repeat('Ab3', 11);

    expect(StripeKeys::refusal('webhook_secret', $webhook, StripeKeys::TEST, production: false))->toBeNull()
        ->and(StripeKeys::refusal('webhook_secret', $webhook, StripeKeys::LIVE, production: true))->toBeNull()
        ->and(StripeKeys::refusal('secret', '', StripeKeys::LIVE, production: false))->toBeNull()
        ->and(StripeKeys::refusal('secret', '   ', StripeKeys::TEST, production: false))->toBeNull();
});
