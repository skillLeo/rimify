<?php

declare(strict_types=1);

namespace Tests\Support;

use Stripe\ApiRequestor;
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

    /** @var array<string, mixed> */
    public array $account;

    /** @var list<array<string, mixed>> the webhook endpoints the account has (GET /v1/webhook_endpoints) */
    public array $webhooks = [];

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
                'status' => 'requires_payment_method',
            ]);

            return [200, $this->intents[$id] = $intent];
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
}
