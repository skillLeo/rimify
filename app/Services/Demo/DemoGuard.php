<?php

declare(strict_types=1);

namespace App\Services\Demo;

use RuntimeException;

/**
 * Where demo data may be written: a local, staging or testing environment with DEMO_DATA=1 — and
 * never production, however the command is called (`--force` included).
 */
final class DemoGuard
{
    /** Why demo data may not be written here, or null where it may. */
    public static function refusal(): ?string
    {
        $environment = (string) app()->environment();

        if (app()->environment('production')) {
            return 'Demo data is never written in production.';
        }

        /** @var list<string> $allowed */
        $allowed = config('demo.environments', []);

        if (! in_array($environment, $allowed, true)) {
            return "Demo data is written only in local, staging or testing; this is {$environment}.";
        }

        if (config('demo.enabled') !== true) {
            return 'Demo data is off here. Set DEMO_DATA=1 to allow it.';
        }

        return null;
    }

    /** @throws RuntimeException where demo data may not be written */
    public static function ensure(): void
    {
        $refusal = self::refusal();

        if ($refusal !== null) {
            throw new RuntimeException($refusal);
        }
    }
}
