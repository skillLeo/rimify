<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PaymentSettingsRequest;
use App\Http\Requests\Admin\PaymentSettingsViewRequest;
use App\Models\PaymentSetting;
use App\Payments\PaymentConfig;
use App\Payments\Stripe\StripeGateway;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\PaymentSettingsWriter;
use App\Services\Commerce\InvoiceSeries;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Einstellungen › Zahlung: the Stripe keys, entered by the operator — never written into the code or a file. The
 * keys are write-only (their last four characters are all the page ever gets), the mode says which kind of key
 * the shop takes, and „Verbindung testen“ asks Stripe for the account behind them. The page says where the keys
 * in force come from: this page, the `.env` fallback, or nowhere.
 */
class ZahlungController extends Controller
{
    public function edit(PaymentSettingsViewRequest $request, GoLiveChecks $checks): Response
    {
        $row = PaymentSetting::current();
        $config = PaymentConfig::current();

        return Inertia::render('Admin/Einstellungen/Zahlung', [
            'form' => ['mode' => $row->mode ?? $config->mode],
            'publishableMasked' => PaymentConfig::mask($row?->publishable_last4),
            'secretMasked' => PaymentConfig::mask($row?->secret_last4),
            'webhookMasked' => PaymentConfig::mask($row?->webhook_last4),
            'inForce' => $config->summary(),
            'driver' => (string) config('rimify.payments.driver', 'none'),
            'production' => app()->environment('production'),
            'test' => $request->session()->get('payment_test') ?? $row?->last_test,
            'testedAt' => $row?->tested_at?->toIso8601String(),
            'webhookUrl' => route('webhooks.payment', ['provider' => 'stripe']),
            // The real invoice numbers: opened once, at the client's own (InvoiceSeries), or still closed.
            'invoiceSeries' => InvoiceSeries::state(),
            // No real payment while a check of „Recht und Pflichtangaben" fails (GoLiveChecks::liveRefusal): named here.
            'liveBlockedBy' => array_values(array_map(
                static fn (GoLiveCheck $c): array => ['id' => $c->id, 'title' => $c->title, 'sentence' => $c->sentence, 'place' => $c->place],
                array_filter($checks->legalChecks(), static fn (GoLiveCheck $c): bool => ! $c->ok()),
            )),
        ]);
    }

    public function update(PaymentSettingsRequest $request, PaymentSettingsWriter $writer): RedirectResponse
    {
        $writer->save($request->values(), $request->admin());

        return back()->with('toast', 'Gespeichert. Mit „Verbindung testen“ prüfst du die Schlüssel bei Stripe.');
    }

    /** „Verbindung testen“ with the keys in force: the account's name, country, currency and methods, or Stripe's error. */
    public function test(PaymentSettingsViewRequest $request): RedirectResponse
    {
        abort_unless($request->user('admin')?->can('update', PaymentSetting::class) === true, 403);

        $account = (new StripeGateway(PaymentConfig::current()))->account();
        $result = $account->toArray() + ['at' => now()->toIso8601String()];

        PaymentSetting::current()?->forceFill(['last_test' => $result, 'tested_at' => now()])->save();
        AuditTrail::record($request->admin(), 'payments.connection_tested', ['ok' => $account->ok, 'account' => $account->name, 'error' => $account->error]);

        return back()
            ->with('payment_test', $result)
            ->with('toast', $account->ok ? 'Verbindung steht.' : 'Stripe hat die Verbindung abgelehnt. Der Grund steht unter dem Knopf.');
    }
}
