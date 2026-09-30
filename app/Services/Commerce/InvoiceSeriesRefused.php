<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use RuntimeException;

/** Why the real invoice numbers were not opened, in a sentence the admin shows as it is (InvoiceSeries::open). */
final class InvoiceSeriesRefused extends RuntimeException {}
