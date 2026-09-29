<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ApprovalDocumentPublished;
use App\Services\Admin\Dashboard\Coverage;

/**
 * A newly published document changes what the shop may show: the Abdeckungs-Matrix is counted again
 * on its next view rather than showing yesterday's coverage for up to an hour.
 */
class ForgetCoverage
{
    public function handle(ApprovalDocumentPublished $event): void
    {
        Coverage::forget();
    }
}
