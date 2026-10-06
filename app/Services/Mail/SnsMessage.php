<?php

declare(strict_types=1);

namespace App\Services\Mail;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * One message Amazon SNS delivered to /webhooks/ses, and whether SNS signed it: the fields SNS signs, in its order,
 * verified against the certificate SNS names — fetched only from an `sns.<region>.amazonaws.com` address over https,
 * and kept a day. A message that fails any of it is not from SNS, whatever it says.
 */
final class SnsMessage
{
    /** The fields SNS signs, per type, in the order it signs them (docs.aws.amazon.com › sns › verify-message-signature). */
    private const SIGNED = [
        'Notification' => ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
        'SubscriptionConfirmation' => ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
        'UnsubscribeConfirmation' => ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
    ];

    /** @param  array<string, mixed>  $fields */
    public function __construct(public readonly array $fields) {}

    public static function fromBody(string $body): ?self
    {
        try {
            $fields = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return null;
        }

        return is_array($fields) ? new self($fields) : null;
    }

    public function type(): string
    {
        return (string) ($this->fields['Type'] ?? '');
    }

    public function field(string $name): string
    {
        $value = $this->fields[$name] ?? '';

        return is_scalar($value) ? (string) $value : '';
    }

    /** An address SNS itself serves: https, a host `sns.<region>.amazonaws.com`, nothing else. */
    public static function fromSns(string $url): bool
    {
        $parts = parse_url($url);

        return is_array($parts)
            && ($parts['scheme'] ?? '') === 'https'
            && preg_match('/^sns\.[a-z0-9-]+\.amazonaws\.com$/', (string) ($parts['host'] ?? '')) === 1
            && ! isset($parts['user'], $parts['pass'], $parts['port']);
    }

    /** The text SNS signed for this message. */
    public function stringToSign(): ?string
    {
        $keys = self::SIGNED[$this->type()] ?? null;

        if ($keys === null) {
            return null;
        }

        $text = '';

        foreach ($keys as $key) {
            if ($key === 'Subject' && ! isset($this->fields['Subject'])) {
                continue;
            }

            $text .= $key."\n".$this->field($key)."\n";
        }

        return $text;
    }

    /** Whether SNS signed this message, by the certificate it names. */
    public function verified(): bool
    {
        $text = $this->stringToSign();
        $url = $this->field('SigningCertURL');
        $signature = base64_decode($this->field('Signature'), true);
        $algorithm = match ($this->field('SignatureVersion')) {
            '1' => OPENSSL_ALGO_SHA1,
            '2' => OPENSSL_ALGO_SHA256,
            default => null,
        };

        if ($text === null || $signature === false || $algorithm === null || ! self::fromSns($url) || ! str_ends_with((string) parse_url($url, PHP_URL_PATH), '.pem')) {
            return false;
        }

        $certificate = self::certificate($url);
        $key = $certificate === null ? false : openssl_pkey_get_public($certificate);

        return $key !== false && openssl_verify($text, $signature, $key, $algorithm) === 1;
    }

    private static function certificate(string $url): ?string
    {
        try {
            /** @var string|null */
            return Cache::remember('sns-cert:'.sha1($url), now()->addDay(), static function () use ($url): ?string {
                $response = Http::timeout(5)->get($url);

                return $response->successful() && str_contains($response->body(), 'BEGIN CERTIFICATE') ? $response->body() : null;
            });
        } catch (Throwable) {
            return null;
        }
    }
}
