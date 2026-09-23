<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\ApprovalDocument;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** A document has just become the current, published revision. */
final class ApprovalDocumentPublished
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public ApprovalDocument $document) {}
}
