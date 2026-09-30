<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OpenInvoiceSeriesRequest;
use App\Services\Commerce\InvoiceSeries;
use App\Services\Commerce\InvoiceSeriesRefused;
use Illuminate\Http\RedirectResponse;

/**
 * Einstellungen › Zahlung › Rechnungsnummern: the one-way opening of the real invoice numbers, at the client's own
 * (InvoiceSeries). A refusal — already opened, a number out of range — comes back as the form's error, in a sentence.
 */
class RechnungsnummernController extends Controller
{
    public function store(OpenInvoiceSeriesRequest $request, InvoiceSeries $series): RedirectResponse
    {
        try {
            $series->open($request->admin(), $request->firstInvoice(), $request->firstCreditNote());
        } catch (InvoiceSeriesRefused $e) {
            return back()->withErrors(['first_invoice' => $e->getMessage()]);
        }

        return back()->with('toast', 'Die Rechnungsnummern sind eröffnet. Die nächste echte Rechnung trägt die Nummer '.InvoiceSeries::state()['invoice']['next'].'.');
    }
}
