<?php

declare(strict_types=1);

namespace App\Payments\Stripe;

use App\Models\Dispute;
use App\Models\Order;
use App\Models\PaymentEvent;
use App\Payments\PaymentAccount;
use App\Payments\PaymentConfig;
use App\Payments\PaymentFailure;
use App\Payments\PaymentGateway;
use App\Payments\PaymentIntentHandle;
use App\Payments\PaymentSignal;
use App\Payments\RefundResult;
use App\Payments\WebhookReceipt;
use App\Payments\WebhookRejected;
use App\Support\GermanFormat;
use Illuminate\Database\UniqueConstraintViolationException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Exception\UnexpectedValueException;
use Stripe\PaymentIntent;
use Stripe\StripeClient;
use Stripe\Webhook;
use Throwable;

/**
 * Stripe, behind PaymentGateway — the one place in the shop that knows Stripe (an architecture test refuses the
 * SDK's namespace anywhere else).
 *
 * A PaymentIntent per order, created once — its idempotency key is the order number, so a double click or a
 * reload returns the same intent — at the order's total from the server, in euro, with Stripe's automatic payment
 * methods; the browser confirms it with the Payment Element. The order is paid only when the signed
 * `payment_intent.succeeded` arrives (handleWebhook → ProcessPaymentEvent), never at the return address.
 */
final class StripeGateway implements PaymentGateway
{
    /** Seconds a webhook signature stays valid: Stripe's own default. */
    public const TOLERANCE = 300;

    /** Every event the shop acts on (translate); the webhook endpoint must send each. */
    public const EVENTS = [
        'payment_intent.succeeded', 'payment_intent.processing', 'payment_intent.payment_failed', 'payment_intent.canceled',
        'charge.refunded', 'charge.dispute.created', 'charge.dispute.closed',
    ];

    /** The capabilities „Verbindung testen“ names, in the customer's words. */
    private const METHODS = [
        'card_payments' => 'Karte (mit Apple Pay und Google Pay)',
        'sepa_debit_payments' => 'SEPA-Lastschrift',
        'klarna_payments' => 'Klarna',
        'paypal_payments' => 'PayPal',
        'link_payments' => 'Link',
        'eps_payments' => 'EPS',
        'bancontact_payments' => 'Bancontact',
        'ideal_payments' => 'iDEAL',
        'giropay_payments' => 'giropay',
        'sofort_payments' => 'Sofort',
    ];

    private ?StripeClient $client = null;

    public function __construct(private readonly PaymentConfig $config) {}

    public function method(): string
    {
        return 'stripe';
    }

    /** Stripe keeps at most 50 metadata keys; two are the order's own. */
    private const LINE_KEYS = 40;

    /**
     * The order's rows beside its payment in Stripe (his #15, D-355), each its own entry: a Komplettrad's rim, tyre,
     * mounting and weights apart, a rim sold alone, the RDKS sensors, the shipping — `pos_3` → `Reifen · 4 × 189,00 € =
     * 756,00 €`. Stripe's own invoice line items are drawn from the same rows (Batch 2, Admin 17).
     *
     * @return array<string, string>
     */
    public static function lineMetadata(Order $order): array
    {
        // The same rows as the invoice's line items (InvoiceRows): what was paid and what is invoiced never drift apart.
        $rows = array_map(
            static fn (array $row): string => $row['shipping']
                ? 'Versand = '.GermanFormat::money($row['totalCents'])
                : sprintf('%s · %d × %s = %s', $row['label'], $row['quantity'], GermanFormat::money($row['unitCents']), GermanFormat::money($row['totalCents'])),
            InvoiceRows::of($order),
        );

        $out = [];

        foreach (array_slice($rows, 0, self::LINE_KEYS) as $i => $row) {
            $out['pos_'.($i + 1)] = mb_substr($row, 0, 500);
        }

        return $out;
    }

    public function start(Order $order): ?string
    {
        return null;
    }

    public function authorize(Order $order): PaymentIntentHandle
    {
        try {
            $known = (string) ($order->getAttribute('stripe_payment_intent_id') ?? '');

            if ($known !== '') {
                $intent = $this->client()->paymentIntents->retrieve($known);

                if ((int) $intent->amount === $order->total_cents && $intent->status !== PaymentIntent::STATUS_CANCELED) {
                    return self::handle($intent);
                }
            }

            $intent = $this->client()->paymentIntents->create([
                'amount' => $order->total_cents,
                'currency' => 'eur',
                // Stripe attaches a payment to an invoice of the same customer (docs.stripe.com/invoicing/partial-payments):
                // the invoice it issues for this order once paid (StripeInvoices, D-361) is this customer's.
                'customer' => $this->customerFor($order),
                'automatic_payment_methods' => ['enabled' => true],
                'description' => 'RIMIFY-Bestellung '.$order->order_number,
                'metadata' => ['order_id' => (string) $order->id, 'order_number' => $order->order_number, ...self::lineMetadata($order)],
            ], ['idempotency_key' => 'rmf-pi-'.$order->order_number.'-'.$order->total_cents]);
        } catch (ApiErrorException $e) {
            throw new PaymentFailure($e->getMessage());
        }

        $order->forceFill(['stripe_payment_intent_id' => $intent->id])->save();

        return self::handle($intent);
    }

    public function capture(Order $order): void
    {
        $intent = $this->intentOf($order);

        if ($intent !== null && $intent->status === PaymentIntent::STATUS_REQUIRES_CAPTURE) {
            try {
                $this->client()->paymentIntents->capture($intent->id, [], ['idempotency_key' => 'rmf-capture-'.$order->order_number]);
            } catch (ApiErrorException $e) {
                throw new PaymentFailure($e->getMessage());
            }
        }
    }

    public function refund(Order $order, int $amountCents, string $reason, string $idempotencyKey): RefundResult
    {
        $intentId = (string) ($order->getAttribute('stripe_payment_intent_id') ?? '');

        if ($intentId === '') {
            throw new PaymentFailure('The order has no Stripe payment to refund.', 'Zu dieser Bestellung gibt es keine Zahlung bei Stripe.');
        }

        try {
            $refund = $this->client()->refunds->create([
                'payment_intent' => $intentId,
                'amount' => $amountCents,
                'metadata' => ['order_number' => $order->order_number, 'reason' => mb_substr($reason, 0, 450)],
            ], ['idempotency_key' => $idempotencyKey]);
        } catch (ApiErrorException $e) {
            throw new PaymentFailure($e->getMessage(), 'Stripe hat die Erstattung abgelehnt: '.$e->getMessage());
        }

        return new RefundResult((string) $refund->id, (string) $refund->status, (int) $refund->amount);
    }

    public function status(Order $order): ?string
    {
        return $this->intentOf($order)?->status;
    }

    public function cancel(Order $order): bool
    {
        $intent = $this->intentOf($order);

        if ($intent === null) {
            return true;
        }

        if (! in_array($intent->status, [PaymentIntent::STATUS_REQUIRES_PAYMENT_METHOD, PaymentIntent::STATUS_REQUIRES_CONFIRMATION, PaymentIntent::STATUS_REQUIRES_ACTION, PaymentIntent::STATUS_REQUIRES_CAPTURE], true)) {
            return $intent->status === PaymentIntent::STATUS_CANCELED;
        }

        try {
            $this->client()->paymentIntents->cancel($intent->id, ['cancellation_reason' => 'abandoned']);
        } catch (ApiErrorException) {
            return false;
        }

        return true;
    }

    public function handleWebhook(string $payload, ?string $signature): WebhookReceipt
    {
        $secret = $this->config->webhookSecret;

        if ($secret === null) {
            throw new WebhookRejected('No webhook signing secret is configured.');
        }

        try {
            $event = Webhook::constructEvent($payload, (string) $signature, $secret, self::TOLERANCE);
        } catch (SignatureVerificationException|UnexpectedValueException $e) {
            throw new WebhookRejected($e->getMessage());
        }

        $existing = PaymentEvent::query()->where('provider', 'stripe')->where('event_id', $event->id)->first();

        if ($existing !== null) {
            return new WebhookReceipt($existing, false);
        }

        try {
            $stored = PaymentEvent::query()->create([
                'provider' => 'stripe',
                'event_id' => (string) $event->id,
                'type' => (string) $event->type,
                'livemode' => (bool) $event->livemode,
                'payload' => $payload,
                'order_id' => self::orderIdOf(json_decode($payload, true)),
                'received_at' => now(),
            ]);
        } catch (UniqueConstraintViolationException) {
            // Two deliveries of one event at once: the other stored it.
            return new WebhookReceipt(PaymentEvent::query()->where('provider', 'stripe')->where('event_id', $event->id)->firstOrFail(), false);
        }

        return new WebhookReceipt($stored, true);
    }

    public function translate(PaymentEvent $event): ?PaymentSignal
    {
        $data = $event->data();
        /** @var array<string, mixed> $object */
        $object = is_array($data['data']['object'] ?? null) ? $data['data']['object'] : [];
        $orderId = self::orderIdOf($data);

        return match ($event->type) {
            'payment_intent.processing' => new PaymentSignal(PaymentSignal::PROCESSING, self::str($object['id'] ?? null), $orderId, self::int($object['amount'] ?? null), self::currency($object)),
            'payment_intent.succeeded' => new PaymentSignal(PaymentSignal::SUCCEEDED, self::str($object['id'] ?? null), $orderId, self::int($object['amount_received'] ?? $object['amount'] ?? null), self::currency($object)),
            'payment_intent.payment_failed' => new PaymentSignal(PaymentSignal::FAILED, self::str($object['id'] ?? null), $orderId, self::int($object['amount'] ?? null), self::currency($object), message: self::str($object['last_payment_error']['message'] ?? null)),
            'payment_intent.canceled' => new PaymentSignal(PaymentSignal::CANCELED, self::str($object['id'] ?? null), $orderId),
            'charge.refunded' => new PaymentSignal(PaymentSignal::REFUNDED, self::str($object['payment_intent'] ?? null), $orderId, self::int($object['amount'] ?? null), self::currency($object), self::int($object['amount_refunded'] ?? null)),
            'charge.dispute.created', 'charge.dispute.closed' => new PaymentSignal(
                $event->type === 'charge.dispute.created' ? PaymentSignal::DISPUTE_OPENED : PaymentSignal::DISPUTE_CLOSED,
                self::str($object['payment_intent'] ?? null),
                $orderId,
                self::int($object['amount'] ?? null),
                self::currency($object),
                dispute: [
                    'id' => (string) ($object['id'] ?? ''),
                    'charge' => self::str($object['charge'] ?? null),
                    'reason' => (string) ($object['reason'] ?? 'general'),
                    'amountCents' => (int) ($object['amount'] ?? 0),
                    'currency' => self::currency($object) ?? 'EUR',
                    'status' => (string) ($object['status'] ?? ''),
                    'dueBy' => self::int($object['evidence_details']['due_by'] ?? null),
                    'outcome' => $event->type === 'charge.dispute.closed' ? match ((string) ($object['status'] ?? '')) {
                        'won', 'warning_closed' => 'won',
                        'lost' => 'lost',
                        default => null,
                    } : null,
                ],
            ),
            default => null,
        };
    }

    public function account(): PaymentAccount
    {
        if ($this->config->secretKey === null) {
            return PaymentAccount::failed('Kein geheimer Schlüssel hinterlegt.');
        }

        try {
            $account = $this->client()->accounts->retrieve();
        } catch (ApiErrorException $e) {
            return PaymentAccount::failed($e->getMessage());
        } catch (Throwable $e) {
            return PaymentAccount::failed($e->getMessage());
        }

        // Read as data: a sparse account (a new one, a Connect one) leaves settings and profile out.
        $data = $account->toArray();
        $capabilities = is_array($data['capabilities'] ?? null) ? $data['capabilities'] : [];
        $methods = [];

        foreach (self::METHODS as $key => $label) {
            if (($capabilities[$key] ?? null) === 'active') {
                $methods[] = $label;
            }
        }

        $name = $data['settings']['dashboard']['display_name'] ?? $data['business_profile']['name'] ?? $data['email'] ?? $data['id'] ?? null;

        return new PaymentAccount(
            true,
            is_string($name) ? $name : null,
            is_string($data['country'] ?? null) ? $data['country'] : null,
            is_string($data['default_currency'] ?? null) ? strtoupper($data['default_currency']) : null,
            $methods,
            ! str_contains((string) $this->config->secretKey, '_test_'),
        );
    }

    public function webhookProblem(string $url): ?string
    {
        try {
            $endpoints = $this->client()->webhookEndpoints->all(['limit' => 100])->data;
        } catch (ApiErrorException $e) {
            return 'Stripe nicht erreichbar: '.$e->getMessage();
        }

        foreach ($endpoints as $endpoint) {
            if (rtrim((string) $endpoint->url, '/') !== rtrim($url, '/')) {
                continue;
            }

            if ($endpoint->status !== 'enabled') {
                return "Der Endpunkt {$url} ist bei Stripe deaktiviert.";
            }

            /** @var list<string> $events */
            $events = (array) $endpoint->enabled_events;
            $missing = in_array('*', $events, true) ? [] : array_values(array_diff(self::EVENTS, $events));

            return $missing === [] ? null : 'Stripe schickt diese Ereignisse nicht: '.implode(', ', $missing).'.';
        }

        return "Kein Webhook-Endpunkt für {$url} bei Stripe eingetragen.";
    }

    public function submitEvidence(Dispute $dispute, string $text, array $files): void
    {
        $evidence = ['uncategorized_text' => mb_substr($text, 0, 20000)];

        try {
            foreach ($files as $file) {
                $handle = fopen($file['path'], 'rb');

                if ($handle === false) {
                    throw new PaymentFailure("Evidence file {$file['name']} could not be read.", 'Eine Datei ließ sich nicht lesen. Es wurde nichts gesendet.');
                }

                $id = $this->client()->files->create(['purpose' => 'dispute_evidence', 'file' => $handle])->id;

                match ($file['field']) {
                    'receipt' => $evidence['receipt'] = $id,
                    'shipping_documentation' => $evidence['shipping_documentation'] = $id,
                    default => $evidence['uncategorized_file'] = $id,
                };
            }

            $this->client()->disputes->update($dispute->provider_dispute_id, ['evidence' => $evidence, 'submit' => true]);
        } catch (ApiErrorException $e) {
            throw new PaymentFailure($e->getMessage(), 'Stripe hat die Nachweise nicht angenommen: '.$e->getMessage());
        }
    }

    /**
     * The Stripe customer the order is paid and invoiced for, made once per order: the billing name, e-mail and address
     * Stripe prints on the invoice (§ 14 UStG asks the recipient's name and address). One customer per order, never
     * matched by e-mail — a typed address is no proof of who someone is.
     */
    private function customerFor(Order $order): string
    {
        $known = (string) ($order->stripe_customer_id ?? '');

        if ($known !== '') {
            return $known;
        }

        $address = $order->billingAddress ?? $order->deliveryAddress;
        $customer = $this->client()->customers->create(array_filter([
            'name' => trim((string) ($address?->company ?: $address?->full_name)) ?: null,
            'email' => $order->customer?->email,
            'address' => $address === null ? null : array_filter([
                'line1' => trim($address->street.' '.$address->house_number),
                'line2' => trim((string) $address->address_extra) ?: null,
                'postal_code' => (string) $address->zip_code,
                'city' => (string) $address->city,
                'country' => strtoupper((string) ($address->country ?: 'DE')),
            ], static fn (mixed $v): bool => $v !== null && $v !== ''),
            // German invoice PDF and mails: Stripe writes them in the customer's language.
            'preferred_locales' => ['de'],
            'metadata' => ['order_number' => $order->order_number],
        ], static fn (mixed $v): bool => $v !== null), ['idempotency_key' => 'rmf-cus-'.($order->public_id ?? $order->order_number)]);

        $order->forceFill(['stripe_customer_id' => $customer->id])->save();

        return $customer->id;
    }

    private function client(): StripeClient
    {
        if ($this->config->secretKey === null) {
            throw new PaymentFailure('No Stripe secret key is configured.', 'Bezahlen ist gerade nicht möglich. Es wurde nichts abgebucht.');
        }

        return $this->client ??= new StripeClient(['api_key' => $this->config->secretKey]);
    }

    private function intentOf(Order $order): ?PaymentIntent
    {
        $id = (string) ($order->getAttribute('stripe_payment_intent_id') ?? '');

        if ($id === '') {
            return null;
        }

        try {
            return $this->client()->paymentIntents->retrieve($id);
        } catch (ApiErrorException $e) {
            throw new PaymentFailure($e->getMessage());
        }
    }

    private static function handle(PaymentIntent $intent): PaymentIntentHandle
    {
        return new PaymentIntentHandle((string) $intent->id, $intent->client_secret, (int) $intent->amount, strtoupper((string) $intent->currency), (string) $intent->status);
    }

    /**
     * The order an event is about: the intent's own metadata where it carries it; for a charge or a dispute, the
     * order whose intent it names.
     *
     * @param  mixed  $data  the decoded event
     */
    private static function orderIdOf(mixed $data): ?int
    {
        $object = is_array($data) && is_array($data['data']['object'] ?? null) ? $data['data']['object'] : [];
        $meta = $object['metadata']['order_id'] ?? null;

        if (is_string($meta) && ctype_digit($meta)) {
            $id = (int) $meta;

            return Order::query()->whereKey($id)->exists() ? $id : null;
        }

        $intent = ($object['object'] ?? null) === 'payment_intent' ? ($object['id'] ?? null) : ($object['payment_intent'] ?? null);

        if (! is_string($intent) || $intent === '') {
            return null;
        }

        $id = Order::query()->where('stripe_payment_intent_id', $intent)->value('id');

        return $id === null ? null : (int) $id;
    }

    /** @param  array<string, mixed>  $object */
    private static function currency(array $object): ?string
    {
        return is_string($object['currency'] ?? null) ? strtoupper($object['currency']) : null;
    }

    private static function int(mixed $value): ?int
    {
        return is_int($value) || (is_string($value) && ctype_digit($value)) ? (int) $value : null;
    }

    private static function str(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }
}
