<?php

declare(strict_types=1);

namespace Tests\Support;

use Stripe\ApiRequestor;
use Stripe\Exception\ApiConnectionException;
use Stripe\HttpClient\ClientInterface;

/**
 * Stripe's API in memory, for the payment tests: the SDK's HTTP client is swapped for this one (the SDK's own
 * seam, ApiRequestor::setHttpClient), so the driver runs its real code — the request it builds, the SDK's own
 * parsing and exceptions — and nothing reaches the network. The objects it answers with have the shape of
 * Stripe's (tests/Fixtures/stripe, from the API reference; to be replaced by ones recorded with `stripe listen`
 * once the test keys are here — docs/dev/STRIPE.md).
 *
 * Honours idempotency keys as Stripe does: a repeated key answers the first response and creates nothing.
 */
final class FakeStripe implements ClientInterface
{
    /** @var list<array{method: string, path: string, params: array<string, mixed>, headers: array<string, string>}> */
    public array $sent = [];

    /** @var array<string, array<string, mixed>> id => PaymentIntent */
    public array $intents = [];

    /** @var array<string, array{0: int, 1: string}> idempotency key => the first response */
    private array $replies = [];

    /** @var array<string, array{0: int, 1: array<string, mixed>}> "METHOD /path" => [status, error] */
    private array $refusals = [];

    /** @var array<string, int> "METHOD /path" => how many more replies to this endpoint are lost on their way back */
    private array $lost = [];

    /** @var array<string, mixed> */
    public array $account;

    /** @var list<array<string, mixed>> the webhook endpoints the account has (GET /v1/webhook_endpoints) */
    public array $webhooks = [];

    /** @var array<string, array<string, mixed>> id => Customer */
    public array $customers = [];

    /** @var array<string, array<string, mixed>> id => TaxRate */
    public array $taxRates = [];

    /** @var array<string, array<string, mixed>> id => Invoice, its lines and totals kept as Stripe computes them */
    public array $invoices = [];

    private int $sequence = 0;

    public function __construct()
    {
        $this->account = self::fixture('account');
    }

    public static function install(): self
    {
        $fake = new self;
        ApiRequestor::setHttpClient($fake);

        return $fake;
    }

    public static function uninstall(): void
    {
        ApiRequestor::setHttpClient(null);
    }

    /** Every call to this endpoint is refused the way Stripe refuses one. */
    public function refuse(string $endpoint, int $status, string $message, string $type = 'invalid_request_error', ?string $code = null): void
    {
        $this->refusals[$endpoint] = [$status, ['error' => array_filter(['message' => $message, 'type' => $type, 'code' => $code])]];
    }

    /**
     * The next $times calls to this endpoint are done at Stripe — the object created, the reply kept under its
     * idempotency key — but the reply never arrives: the connection drops on its way back, and the SDK throws
     * ApiConnectionException, as its own HTTP client does. Only a retry with the same key learns what was created.
     */
    public function loseReply(string $endpoint, int $times = 1): void
    {
        $this->lost[$endpoint] = $times;
    }

    /** @return array<string, mixed> */
    public static function fixture(string $name): array
    {
        return json_decode((string) file_get_contents(dirname(__DIR__).'/Fixtures/stripe/'.$name.'.json'), true, flags: JSON_THROW_ON_ERROR);
    }

    /** @return list<array{method: string, path: string, params: array<string, mixed>, headers: array<string, string>}> */
    public function to(string $method, string $pathPattern): array
    {
        return array_values(array_filter($this->sent, static fn (array $r): bool => $r['method'] === strtoupper($method) && preg_match('#^'.$pathPattern.'$#', $r['path']) === 1));
    }

    public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
    {
        $method = strtoupper((string) $method);
        $path = (string) parse_url((string) $absUrl, PHP_URL_PATH);
        $named = [];

        foreach ((array) $headers as $header) {
            [$name, $value] = array_map('trim', explode(':', (string) $header, 2) + [1 => '']);
            $named[strtolower($name)] = $value;
        }

        $this->sent[] = ['method' => $method, 'path' => $path, 'params' => (array) $params, 'headers' => $named];
        $key = $named['idempotency-key'] ?? null;

        if ($key !== null && isset($this->replies[$key])) {
            return [$this->replies[$key][1], $this->replies[$key][0], []];
        }

        [$status, $body] = $this->answer($method, $path, (array) $params);
        $json = json_encode($body, JSON_THROW_ON_ERROR);

        if ($key !== null) {
            $this->replies[$key] = [$status, $json];
        }

        foreach ($this->lost as $endpoint => $left) {
            [$m, $pattern] = explode(' ', $endpoint, 2);

            if ($left > 0 && $m === $method && preg_match('#^'.$pattern.'$#', $path) === 1) {
                $this->lost[$endpoint] = $left - 1;

                throw ApiConnectionException::factory('Could not connect to Stripe: the connection dropped before the reply arrived (FakeStripe).');
            }
        }

        return [$json, $status, ['request-id' => 'req_fake_'.(++$this->sequence)]];
    }

    /** @return array{0: int, 1: array<string, mixed>} */
    private function answer(string $method, string $path, array $params): array
    {
        foreach ($this->refusals as $endpoint => $refusal) {
            [$m, $pattern] = explode(' ', $endpoint, 2);

            if ($m === $method && preg_match('#^'.$pattern.'$#', $path) === 1) {
                return $refusal;
            }
        }

        if ($method === 'GET' && $path === '/v1/account') {
            return [200, $this->account];
        }

        if ($method === 'GET' && $path === '/v1/webhook_endpoints') {
            return [200, ['object' => 'list', 'data' => $this->webhooks, 'has_more' => false, 'url' => '/v1/webhook_endpoints']];
        }

        if ($method === 'POST' && $path === '/v1/payment_intents') {
            $id = 'pi_fake'.str_pad((string) (++$this->sequence), 6, '0', STR_PAD_LEFT);
            $intent = array_replace(self::fixture('payment_intent'), [
                'id' => $id,
                'amount' => (int) $params['amount'],
                'currency' => (string) $params['currency'],
                'client_secret' => $id.'_secret_fake',
                'metadata' => $params['metadata'] ?? [],
                'description' => $params['description'] ?? null,
                'customer' => $params['customer'] ?? null,
                'status' => 'requires_payment_method',
            ]);

            return [200, $this->intents[$id] = $intent];
        }

        $invoicing = $this->invoicing($method, $path, $params);

        if ($invoicing !== null) {
            return $invoicing;
        }

        if (preg_match('#^/v1/payment_intents/([^/]+)(/(cancel|capture))?$#', $path, $m) === 1) {
            $intent = $this->intents[$m[1]] ?? null;

            if ($intent === null) {
                return [404, ['error' => ['message' => "No such payment_intent: '{$m[1]}'", 'type' => 'invalid_request_error', 'code' => 'resource_missing']]];
            }

            if (($m[3] ?? '') === 'cancel') {
                $intent = $this->intents[$m[1]] = ['status' => 'canceled', 'cancellation_reason' => $params['cancellation_reason'] ?? null] + $intent;
            } elseif (($m[3] ?? '') === 'capture') {
                $intent = $this->intents[$m[1]] = ['status' => 'succeeded', 'amount_received' => $intent['amount']] + $intent;
            }

            return [200, $intent];
        }

        if ($method === 'POST' && $path === '/v1/files') {
            $id = 'file_fake'.str_pad((string) (++$this->sequence), 6, '0', STR_PAD_LEFT);

            return [200, ['id' => $id, 'object' => 'file', 'purpose' => (string) ($params['purpose'] ?? ''), 'size' => 1234]];
        }

        if ($method === 'POST' && preg_match('#^/v1/disputes/([^/]+)$#', $path, $m) === 1) {
            return [200, array_replace(self::fixture('dispute'), ['id' => $m[1], 'evidence' => $params['evidence'] ?? [], 'status' => ($params['submit'] ?? '') === 'true' ? 'under_review' : 'needs_response'])];
        }

        if ($method === 'POST' && $path === '/v1/refunds') {
            return [200, array_replace(self::fixture('refund'), [
                'id' => 're_fake'.str_pad((string) (++$this->sequence), 6, '0', STR_PAD_LEFT),
                'amount' => (int) $params['amount'],
                'payment_intent' => (string) $params['payment_intent'],
                'metadata' => $params['metadata'] ?? [],
                'status' => 'succeeded',
            ])];
        }

        return [404, ['error' => ['message' => "Unrecognized request URL ({$method}: {$path}).", 'type' => 'invalid_request_error']]];
    }

    /** Lets a test put an intent in a state (as the browser's confirmation or Stripe would). */
    public function setIntent(string $id, array $changes): void
    {
        $this->intents[$id] = $changes + ($this->intents[$id] ?? self::fixture('payment_intent'));
    }

    /**
     * A webhook as Stripe sends it: the event body, and its `Stripe-Signature` header signed with $secret.
     *
     * @param  array<string, mixed>  $object
     * @return array{0: string, 1: string} [payload, signature header]
     */
    public static function event(string $type, array $object, string $secret, ?string $id = null, ?int $timestamp = null): array
    {
        $payload = json_encode([
            'id' => $id ?? 'evt_fake'.bin2hex(random_bytes(6)),
            'object' => 'event',
            'api_version' => '2025-09-30.clover',
            'created' => $timestamp ?? time(),
            'livemode' => false,
            'pending_webhooks' => 1,
            'type' => $type,
            'data' => ['object' => $object],
        ], JSON_THROW_ON_ERROR);

        return [$payload, self::sign($payload, $secret, $timestamp ?? time())];
    }

    public static function sign(string $payload, string $secret, int $timestamp): string
    {
        return 't='.$timestamp.',v1='.hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
    }

    /**
     * Customers, tax rates and invoices (D-361), as the API reference describes them: an invoice item joins a draft only;
     * an inclusive tax rate leaves the line's amount as it is and says the tax within it; finalizing gives the number, the
     * hosted page and the PDF; a payment attaches only for the invoice's own customer, and one that already succeeded
     * pays the invoice at once (docs.stripe.com/api/invoices/attach_payment, /invoicing/partial-payments). Null for any
     * other request.
     *
     * @param  array<string, mixed>  $params
     * @return array{0: int, 1: array<string, mixed>}|null
     */
    private function invoicing(string $method, string $path, array $params): ?array
    {
        $refuse = static fn (int $status, string $message): array => [$status, ['error' => ['message' => $message, 'type' => 'invalid_request_error']]];
        $next = fn (string $prefix): string => $prefix.str_pad((string) (++$this->sequence), 6, '0', STR_PAD_LEFT);

        if ($method === 'POST' && $path === '/v1/customers') {
            $id = $next('cus_fake');

            return [200, $this->customers[$id] = ['id' => $id, 'object' => 'customer', 'name' => $params['name'] ?? null, 'email' => $params['email'] ?? null, 'address' => $params['address'] ?? null, 'metadata' => $params['metadata'] ?? []]];
        }

        if ($method === 'GET' && $path === '/v1/tax_rates') {
            return [200, ['object' => 'list', 'data' => array_values($this->taxRates), 'has_more' => false, 'url' => '/v1/tax_rates']];
        }

        if ($method === 'POST' && $path === '/v1/tax_rates') {
            $id = $next('txr_fake');

            return [200, $this->taxRates[$id] = [
                'id' => $id, 'object' => 'tax_rate', 'active' => true, 'percentage' => (float) $params['percentage'],
                'inclusive' => filter_var($params['inclusive'], FILTER_VALIDATE_BOOL), 'display_name' => $params['display_name'] ?? null,
                'country' => $params['country'] ?? null, 'jurisdiction' => $params['jurisdiction'] ?? null, 'tax_type' => $params['tax_type'] ?? null,
                'metadata' => $params['metadata'] ?? [],
            ]];
        }

        if ($method === 'POST' && $path === '/v1/invoices') {
            if (! isset($this->customers[(string) ($params['customer'] ?? '')])) {
                return $refuse(400, "No such customer: '".($params['customer'] ?? '')."'");
            }

            $id = $next('in_fake');

            return [200, $this->invoices[$id] = [
                'id' => $id, 'object' => 'invoice', 'customer' => $params['customer'], 'currency' => $params['currency'] ?? 'eur',
                'status' => 'draft', 'number' => null, 'hosted_invoice_url' => null, 'invoice_pdf' => null,
                'collection_method' => $params['collection_method'] ?? 'charge_automatically', 'auto_advance' => filter_var($params['auto_advance'] ?? false, FILTER_VALIDATE_BOOL),
                'description' => $params['description'] ?? null, 'metadata' => $params['metadata'] ?? [], 'created' => time(),
                'lines' => ['object' => 'list', 'data' => [], 'has_more' => false, 'url' => "/v1/invoices/{$id}/lines"],
                'subtotal' => 0, 'total' => 0, 'total_excluding_tax' => 0, 'total_taxes' => [], 'amount_due' => 0, 'amount_paid' => 0, 'amount_remaining' => 0,
            ]];
        }

        if ($method === 'POST' && $path === '/v1/invoiceitems') {
            $invoice = (string) ($params['invoice'] ?? '');

            if (($this->invoices[$invoice]['status'] ?? null) !== 'draft') {
                return $refuse(400, "Invoice {$invoice} is not a draft: items can be added to a draft invoice only.");
            }

            $quantity = (int) ($params['quantity'] ?? 1);
            $amount = $quantity * (int) $params['unit_amount_decimal'];
            $taxes = [];

            foreach ((array) ($params['tax_rates'] ?? []) as $rateId) {
                $rate = $this->taxRates[$rateId] ?? null;

                if ($rate === null) {
                    return $refuse(400, "No such tax rate: '{$rateId}'");
                }

                // Inclusive: the tax is the part of the amount above its net, the net rounded to the cent.
                $net = (int) round($amount / (1 + $rate['percentage'] / 100));
                $taxes[] = ['amount' => $amount - $net, 'tax_behavior' => 'inclusive', 'taxable_amount' => $net, 'tax_rate_details' => ['tax_rate' => $rateId], 'type' => 'tax_rate_details'];
            }

            $this->invoices[$invoice]['lines']['data'][] = [
                'id' => $next('il_fake'), 'object' => 'line_item', 'amount' => $amount, 'currency' => $params['currency'] ?? 'eur',
                'description' => $params['description'] ?? null, 'quantity' => $quantity,
                'pricing' => ['type' => 'price_details', 'unit_amount_decimal' => (string) $params['unit_amount_decimal']], 'taxes' => $taxes,
            ];
            $lines = $this->invoices[$invoice]['lines']['data'];
            $total = array_sum(array_column($lines, 'amount'));
            $tax = array_sum(array_map(static fn (array $l): int => array_sum(array_column($l['taxes'], 'amount')), $lines));
            $this->invoices[$invoice] = ['subtotal' => $total, 'total' => $total, 'total_excluding_tax' => $total - $tax, 'amount_due' => $total, 'amount_remaining' => $total] + $this->invoices[$invoice];

            return [200, ['id' => $next('ii_fake'), 'object' => 'invoiceitem', 'invoice' => $invoice, 'amount' => $amount, 'quantity' => $quantity, 'description' => $params['description'] ?? null]];
        }

        if ($method === 'GET' && $path === '/v1/invoices') {
            $created = (array) ($params['created'] ?? []);
            $list = array_values(array_filter($this->invoices, static fn (array $i): bool => $i['status'] !== 'draft'
                && (! isset($created['gte']) || $i['created'] >= (int) $created['gte'])
                && (! isset($created['lt']) || $i['created'] < (int) $created['lt'])));
            usort($list, static fn (array $a, array $b): int => [$b['created'], $b['id']] <=> [$a['created'], $a['id']]);

            if (isset($params['starting_after'])) {
                $at = array_search($params['starting_after'], array_column($list, 'id'), true);
                $list = $at === false ? [] : array_slice($list, $at + 1);
            }

            $limit = (int) ($params['limit'] ?? 10);

            return [200, ['object' => 'list', 'data' => array_slice($list, 0, $limit), 'has_more' => count($list) > $limit, 'url' => '/v1/invoices']];
        }

        if (preg_match('#^/v1/invoices/([^/]+)(/(finalize|attach_payment))?$#', $path, $m) !== 1) {
            return null;
        }

        $invoice = $this->invoices[$m[1]] ?? null;

        if ($invoice === null) {
            return [404, ['error' => ['message' => "No such invoice: '{$m[1]}'", 'type' => 'invalid_request_error', 'code' => 'resource_missing']]];
        }

        if ($method === 'DELETE') {
            if ($invoice['status'] !== 'draft') {
                return $refuse(400, 'Only draft invoices can be deleted.');
            }

            unset($this->invoices[$m[1]]);

            return [200, ['id' => $m[1], 'object' => 'invoice', 'deleted' => true]];
        }

        if (($m[3] ?? '') === 'finalize') {
            if ($invoice['status'] !== 'draft') {
                return $refuse(400, "This invoice is already {$invoice['status']}.");
            }

            $invoice = $this->invoices[$m[1]] = [
                'status' => 'open',
                'number' => 'FAKE-'.str_pad((string) (count(array_filter($this->invoices, static fn (array $i): bool => $i['number'] !== null)) + 1), 4, '0', STR_PAD_LEFT),
                'hosted_invoice_url' => 'https://invoice.stripe.com/i/'.$m[1],
                'invoice_pdf' => 'https://pay.stripe.com/invoice/'.$m[1].'/pdf',
            ] + $invoice;
        }

        if (($m[3] ?? '') === 'attach_payment') {
            $intent = $this->intents[(string) ($params['payment_intent'] ?? '')] ?? null;

            if ($intent === null) {
                return [404, ['error' => ['message' => "No such payment_intent: '".($params['payment_intent'] ?? '')."'", 'type' => 'invalid_request_error', 'code' => 'resource_missing']]];
            }

            if (($intent['customer'] ?? null) !== $invoice['customer'] || $intent['currency'] !== $invoice['currency']) {
                return $refuse(400, 'The PaymentIntent must have the same customer and currency as the invoice.');
            }

            if ($intent['status'] === 'succeeded') {
                $paid = $invoice['amount_paid'] + (int) ($intent['amount_received'] ?? $intent['amount']);
                $invoice = $this->invoices[$m[1]] = ['amount_paid' => $paid, 'amount_remaining' => max(0, $invoice['total'] - $paid), 'status' => $paid >= $invoice['total'] ? 'paid' : $invoice['status']] + $invoice;
            }
        }

        return [200, $invoice];
    }
}
