<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SellerShippingRequest;
use App\Models\AdminUser;
use App\Models\Setting;
use App\Services\Admin\AuditTrail;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use App\Support\OwnInvoices;
use App\Support\Seller;
use App\Support\Shipping;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Einstellungen › Verkäufer & Versand: the seller as the law names it — for the Impressum, the invoice and the order
 * mail — and what delivery costs and takes — for the product page, the basket, the checkout and the mail. One place
 * each, read through Seller and Shipping; `.env` answers only while this page was never saved.
 *
 * Values marked as placeholders stay here and in the Impressum's marked preview: the shop's documents treat them as
 * not given, and the preflight refuses the live shop while any are left (D-085).
 */
class VerkaeuferVersandController extends Controller
{
    public function edit(Request $request): Response
    {
        $this->authorize('view', Seller::class);

        $seller = Seller::stored();
        $shipping = Shipping::current();
        $zone = $shipping->zones[Shipping::DOMESTIC] ?? ['cost_cents' => null, 'free_from_cents' => null];
        // What the product page would say with these values, placeholders or not: the admin sees the sentence.
        $preview = new Shipping($shipping->zones, $shipping->minDays, $shipping->maxDays, $shipping->timeText, false, $shipping->source);

        return Inertia::render('Admin/Einstellungen/VerkaeuferVersand', [
            'seller' => [
                'name' => $seller->name ?? '',
                'legal_form' => $seller->legalForm ?? '',
                'street' => $seller->street ?? '',
                'zip' => $seller->zip ?? '',
                'city' => $seller->city ?? '',
                'managing_director' => $seller->managingDirector ?? '',
                'register_court' => $seller->registerCourt ?? '',
                'register_number' => $seller->registerNumber ?? '',
                'vat_id' => $seller->vatId ?? '',
                'tax_number' => $seller->taxNumber ?? '',
                'email' => $seller->ownEmail ?? '',
                'phone' => $seller->phone ?? '',
                'placeholder' => $seller->placeholder,
                // Each Impressum field that may not apply, ticked where it was declared „entfällt“ (D-319).
                'not_applicable' => array_combine(Seller::MAY_NOT_APPLY, array_map(
                    static fn (string $field): bool => in_array($field, $seller->notApplicable, true),
                    Seller::MAY_NOT_APPLY,
                )),
            ],
            'sellerSource' => $seller->source,
            // What the Impressum still shows as a marker — what keeps the shop out of search and live payments (D-319).
            'impressumMissing' => $seller->impressumMissing(),
            // The `.env` register line, where it was written as one: shown so nobody types it in twice.
            'legacyRegister' => $seller->source === '.env' && $seller->registerCourt === null ? $seller->register : null,
            'sellerMissing' => $seller->missing(),
            // Whether the shop issues its own invoices (D-348): off, the page speaks of none.
            'ownInvoices' => OwnInvoices::enabled(),
            'shipping' => [
                // Typed back as the Wuchtgewichte page types a price: `4,90 €`, which Money::fromGerman reads again.
                'cost' => $zone['cost_cents'] === null ? '' : GermanFormat::money($zone['cost_cents']),
                'free_from' => $zone['free_from_cents'] === null ? '' : GermanFormat::money($zone['free_from_cents']),
                'min_days' => $shipping->minDays === null ? '' : (string) $shipping->minDays,
                'max_days' => $shipping->maxDays === null ? '' : (string) $shipping->maxDays,
                'placeholder' => $shipping->placeholder,
            ],
            'shippingSource' => $shipping->source,
            'legacyTime' => $shipping->timeText,
            'shippingMissing' => $shipping->missing(),
            'shippingPreview' => $preview->summary(),
            'countries' => Shipping::COUNTRIES,
            'contactEmail' => is_string($mail = config('rimify.contact.email')) && $mail !== '' ? $mail : null,
            // What this form was opened on: a save against an older state is refused (EditStamp, F-25).
            'stamp' => EditStamp::of(self::state()),
        ]);
    }

    public function update(SellerShippingRequest $request): RedirectResponse
    {
        $seller = $request->seller();
        $shipping = $request->shipping();
        $admin = $request->admin();

        DB::transaction(static function () use ($request, $seller, $shipping, $admin): void {
            // Read under a lock: two saves at once are taken one after the other, and the second is compared with the first's result.
            Setting::query()->whereIn('key', [Seller::KEY, Shipping::KEY])->lockForUpdate()->get();
            $before = self::state();
            EditStamp::guard($request, $before);

            Setting::set(Seller::KEY, $seller);
            Setting::set(Shipping::KEY, $shipping);

            self::audit($admin, $before, [$seller, $shipping]);
        });

        $open = [...Seller::stored()->missing(), ...Shipping::current()->missing()];

        return back()->with('toast', $open === []
            ? 'Gespeichert. Impressum, Rechnungen, Shop und Bestellmail zeigen jetzt diese Angaben.'
            : 'Gespeichert. Für den Live-Shop fehlt noch: '.implode(', ', $open).'.');
    }

    /**
     * The two stored values this page edits, as they are now.
     *
     * @return array{0: mixed, 1: mixed}
     */
    private static function state(): array
    {
        return [Setting::get(Seller::KEY), Setting::get(Shipping::KEY)];
    }

    /**
     * One entry: which fields changed, from what to what. Nothing here is secret — it is printed on every invoice.
     *
     * @param  array{0: mixed, 1: mixed}  $before
     * @param  array{0: array<string, mixed>, 1: array<string, mixed>}  $after
     */
    private static function audit(AdminUser $admin, array $before, array $after): void
    {
        $changes = [];

        foreach (['seller' => 0, 'shipping' => 1] as $section => $i) {
            $old = is_array($before[$i]) ? $before[$i] : [];

            foreach ($after[$i] as $field => $value) {
                if (($old[$field] ?? null) !== $value) {
                    $changes["{$section}.{$field}"] = ['old' => $old[$field] ?? null, 'new' => $value];
                }
            }
        }

        AuditTrail::record($admin, 'settings.seller_shipping_updated', ['changes' => $changes, 'first' => $before === [null, null]]);
    }
}
