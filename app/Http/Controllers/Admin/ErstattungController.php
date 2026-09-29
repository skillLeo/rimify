<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RefundRequest;
use App\Models\Order;
use App\Services\Commerce\RefundOrder;
use App\Services\Commerce\RefundRefused;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;

/**
 * Verkauf › Bestellungen › one order › „Erstatten“ (Block G §5): through the provider's API, written back, credit
 * note, mail, Protokoll (RefundOrder). A refusal — too much, nothing left, the provider's own no — is said under
 * the form; nothing is ever marked refunded here by hand.
 */
class ErstattungController extends Controller
{
    public function store(RefundRequest $request, Order $order, RefundOrder $refund): RedirectResponse
    {
        try {
            $made = $refund($order, $request->amountCents(), $request->reason(), $request->admin());
        } catch (RefundRefused $e) {
            return back()->withErrors(['refund' => $e->getMessage()]);
        }

        $amount = GermanFormat::money((int) $made->amount_cents);

        return back()->with('toast', $made->status === 'succeeded'
            ? "{$amount} erstattet. Die Gutschrift ist an die Kundin oder den Kunden unterwegs."
            : "{$amount} beim Zahlungsdienst beauftragt – er bestätigt die Erstattung noch.");
    }
}
