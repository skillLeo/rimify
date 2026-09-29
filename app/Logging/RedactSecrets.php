<?php

declare(strict_types=1);

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Logger as Monolog;

/**
 * The `tap` every log channel carries (config/logging.php): each record passes SecretRedactor before
 * any handler writes it.
 */
final class RedactSecrets
{
    public function __invoke(Logger $logger): void
    {
        $monolog = $logger->getLogger();

        if ($monolog instanceof Monolog) {
            $monolog->pushProcessor(new SecretRedactor);
        }
    }
}
