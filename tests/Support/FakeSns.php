<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\Mail\SnsMessage;
use Illuminate\Support\Facades\Http;
use OpenSSLAsymmetricKey;
use RuntimeException;

/**
 * SNS for the SES webhook's tests: a key pair and a certificate of its own, made once per process, the certificate
 * served at an SNS address (Http::fake), and messages signed with the key exactly as SNS signs them — so a test can
 * send a real signed message, a forged one, or one whose certificate lives somewhere SNS never serves from.
 */
final class FakeSns
{
    public const TOPIC = 'arn:aws:sns:eu-north-1:123456789012:rimify-ses-meldungen';

    public const CERT_URL = 'https://sns.eu-north-1.amazonaws.com/SimpleNotificationService-fake.pem';

    private static ?OpenSSLAsymmetricKey $key = null;

    private static ?string $certificate = null;

    /** Serve the certificate at its SNS address, and answer a subscription confirmation. */
    public static function install(): void
    {
        self::keys();

        Http::fake([
            self::CERT_URL => Http::response((string) self::$certificate),
            'https://sns.eu-north-1.amazonaws.com/?Action=ConfirmSubscription*' => Http::response('<ConfirmSubscriptionResponse/>'),
        ]);
    }

    /**
     * A message as SNS posts it, signed.
     *
     * @param  array<string, mixed>  $over
     * @return array<string, mixed>
     */
    public static function signed(string $type, string $message, array $over = [], string $version = '2'): array
    {
        $fields = [
            'Type' => $type,
            'MessageId' => (string) ($over['MessageId'] ?? 'msg-'.bin2hex(random_bytes(6))),
            'TopicArn' => self::TOPIC,
            'Message' => $message,
            'Timestamp' => '2026-10-06T10:00:00.000Z',
            'SignatureVersion' => $version,
            'SigningCertURL' => self::CERT_URL,
            ...($type === 'Notification' ? [] : [
                'Token' => 'token-'.bin2hex(random_bytes(4)),
                'SubscribeURL' => 'https://sns.eu-north-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn='.self::TOPIC.'&Token=x',
            ]),
            ...$over,
        ];

        return [...$fields, 'Signature' => self::sign($fields, $version)];
    }

    /**
     * SES's bounce notification, as the Message field carries it.
     *
     * @param  list<string>  $recipients
     */
    public static function bounce(array $recipients, string $type = 'Permanent', string $subtype = 'General'): string
    {
        return (string) json_encode([
            'notificationType' => 'Bounce',
            'bounce' => [
                'bounceType' => $type,
                'bounceSubType' => $subtype,
                'bouncedRecipients' => array_map(static fn (string $r): array => ['emailAddress' => $r], $recipients),
                'timestamp' => '2026-10-06T09:59:58.000Z',
            ],
            'mail' => ['source' => 'bestellung@rimify.de'],
        ]);
    }

    /** @param  list<string>  $recipients */
    public static function complaint(array $recipients, string $feedback = 'abuse'): string
    {
        return (string) json_encode([
            'notificationType' => 'Complaint',
            'complaint' => [
                'complainedRecipients' => array_map(static fn (string $r): array => ['emailAddress' => $r], $recipients),
                'complaintFeedbackType' => $feedback,
                'timestamp' => '2026-10-06T09:59:58.000Z',
            ],
            'mail' => ['source' => 'bestellung@rimify.de'],
        ]);
    }

    /** @param  array<string, mixed>  $fields */
    public static function sign(array $fields, string $version = '2'): string
    {
        $text = (new SnsMessage($fields))->stringToSign() ?? throw new RuntimeException('No string to sign for this type.');
        openssl_sign($text, $signature, self::keys(), $version === '1' ? OPENSSL_ALGO_SHA1 : OPENSSL_ALGO_SHA256);

        return base64_encode($signature);
    }

    private static function keys(): OpenSSLAsymmetricKey
    {
        if (self::$key !== null) {
            return self::$key;
        }

        // A minimal configuration: PHP on Windows finds no openssl.cnf of its own.
        $config = sys_get_temp_dir().'/rimify-fake-sns-openssl.cnf';
        file_put_contents($config, "[ req ]\ndistinguished_name = dn\n[ dn ]\n");
        $args = ['config' => $config, 'private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA, 'digest_alg' => 'sha256'];

        $key = openssl_pkey_new($args) ?: throw new RuntimeException('OpenSSL made no key.');
        $request = openssl_csr_new(['commonName' => 'sns.eu-north-1.amazonaws.com'], $key, $args) ?: throw new RuntimeException('OpenSSL made no request.');
        $certificate = openssl_csr_sign($request, null, $key, 1, $args) ?: throw new RuntimeException('OpenSSL made no certificate.');
        openssl_x509_export($certificate, $pem);

        self::$certificate = $pem;

        return self::$key = $key;
    }
}
