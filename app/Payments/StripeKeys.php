<?php

declare(strict_types=1);

namespace App\Payments;

use Illuminate\Contracts\Foundation\Application;

/**
 * Which Stripe key RIMIFY accepts where (docs/dev/SECRETS.md; CLAUDE.md, live credentials). The mode is
 * explicit — Testmodus or Livemodus — and every key must belong to it:
 *
 *   - a live key (`sk_live_`, `rk_live_`, `pk_live_`) is refused anywhere but production, whatever the
 *     mode says: it is typed into the admin on the live site by a person, and nowhere else;
 *   - in Testmodus only test keys, in Livemodus only live keys;
 *   - a key of the wrong kind for its field (a publishable key as the secret) is refused.
 *
 * One set of rules for both ways a key arrives: the settings screen refuses to save a key it would
 * refuse here (the payments brief), and a key in `.env` that breaks them is not used at all
 * (`enforce()`, at boot) — the preflight says so.
 */
final class StripeKeys
{
    public const TEST = 'test';

    public const LIVE = 'live';

    /** The container key under which boot records the `.env` keys it refused, for the preflight. */
    public const REFUSED = 'rimify.stripe_keys_refused';

    /** Field => [config key, the prefixes it takes]. */
    public const FIELDS = [
        'secret' => ['services.stripe.secret', ['sk_', 'rk_']],
        'key' => ['services.stripe.key', ['pk_']],
        'webhook_secret' => ['services.stripe.webhook_secret', ['whsec_']],
    ];

    /** How a field is named in a refusal. */
    private const NAMES = [
        'secret' => 'geheime Schlüssel',
        'key' => 'öffentliche Schlüssel',
        'webhook_secret' => 'Webhook-Signaturschlüssel',
    ];

    /**
     * Why this key may not be used in this field, in this mode, on this installation — one German
     * sentence — or null when it may. An empty key is nothing to refuse.
     */
    public static function refusal(string $field, string $key, string $mode, bool $production): ?string
    {
        $key = trim($key);

        if ($key === '') {
            return null;
        }

        [, $prefixes] = self::FIELDS[$field] ?? [null, []];
        $name = self::NAMES[$field] ?? 'Schlüssel';

        $kind = array_filter($prefixes, static fn (string $prefix): bool => str_starts_with($key, $prefix));

        if ($kind === []) {
            return sprintf('Das ist kein %s von Stripe: er beginnt mit %s.', self::nominative($name), implode(' oder ', array_map(static fn (string $p): string => $p.'…', $prefixes)));
        }

        // The webhook's signing secret carries no mode; every other key names its own.
        if ($field === 'webhook_secret') {
            return null;
        }

        $live = str_contains($key, '_live_');

        if (! $live && ! str_contains($key, '_test_')) {
            return 'Der Schlüssel nennt weder test noch live. Kopier ihn bitte vollständig aus dem Stripe-Dashboard.';
        }

        if ($live && ! $production) {
            return 'Live-Schlüssel nimmt RIMIFY nur im Live-Shop an, hier nie. Wurde er hierher kopiert, roll ihn im Stripe-Dashboard.';
        }

        if ($live && $mode !== self::LIVE) {
            return 'Im Testmodus nimmt RIMIFY nur Testschlüssel (…_test_…) an. Ein Live-Schlüssel wird nie für Tests benutzt.';
        }

        if (! $live && $mode === self::LIVE) {
            return 'Im Livemodus nimmt RIMIFY nur Live-Schlüssel (…_live_…) an. Mit einem Testschlüssel käme keine echte Zahlung an.';
        }

        return null;
    }

    /**
     * At boot: a Stripe key in the configuration (from `.env`) that the rules refuse is not used — the
     * value is dropped, the refusal recorded for the preflight and written to the PHP log, the key
     * masked to its last four characters.
     */
    public static function enforce(Application $app): void
    {
        $mode = config('services.stripe.mode') === self::LIVE ? self::LIVE : self::TEST;
        $production = $app->environment('production');
        $refused = [];

        foreach (self::FIELDS as $field => [$configKey]) {
            $value = config($configKey);

            if (! is_string($value) || $value === '') {
                continue;
            }

            $refusal = self::refusal($field, $value, $mode, $production);

            if ($refusal !== null) {
                config([$configKey => null]);
                $refused[$field] = $refusal;
                error_log(sprintf('RIMIFY: %s (…%s) not used: %s', $configKey, substr($value, -4), $refusal));
            }
        }

        if ($refused !== []) {
            $app->instance(self::REFUSED, $refused);
        }
    }

    private static function nominative(string $name): string
    {
        // „der geheime Schlüssel“ → „kein geheimer Schlüssel“ (masculine, after „kein“).
        return str_replace(['geheime ', 'öffentliche ', 'Webhook-Signaturschlüssel'], ['geheimer ', 'öffentlicher ', 'Webhook-Signaturschlüssel'], $name);
    }
}
