<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use RuntimeException;

/**
 * The order writer's refusal: a German sentence for the customer (the basket's own), and nothing
 * written. Only this is shown on the checkout; any other failure is a fault and never reaches the page
 * as text.
 */
final class OrderRefused extends RuntimeException {}
