<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\InvoiceDownloadRequest;
use App\Services\Commerce\Invoices;
use Symfony\Component\HttpFoundation\Response;

/**
 * An invoice's PDF, by its signed link only (Invoices::link — in the order mail and on the confirmation page). The
 * file lives on the private disk; there is no other way to it, and the bytes are checked against the checksum
 * written when it was issued before they leave.
 */
class RechnungController extends Controller
{
    public function __invoke(InvoiceDownloadRequest $request, Invoices $invoices): Response
    {
        $invoice = $request->invoice();

        return response($invoices->pdf($invoice), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$invoice->number.'.pdf"',
            'Cache-Control' => 'private, no-store',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
}
