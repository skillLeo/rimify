<?php

declare(strict_types=1);

namespace App\Payments;

use RuntimeException;

/** A webhook whose signature does not verify, or whose body is not an event: refused, nothing stored. */
final class WebhookRejected extends RuntimeException {}
