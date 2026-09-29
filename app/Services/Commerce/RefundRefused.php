<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use RuntimeException;

/** A refund that was not made, with the sentence the order page shows under the form. */
final class RefundRefused extends RuntimeException {}
