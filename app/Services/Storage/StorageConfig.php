<?php

declare(strict_types=1);

namespace App\Services\Storage;

use SensitiveParameter;

/**
 * One credential set for the bucket, and where it came from: the admin screen (`database`), the
 * `.env` fallback (`env`), or no bucket at all (`local` folders, for a machine without one).
 *
 * The secret is a constructor argument marked #[SensitiveParameter], so a stack trace shows it as
 * redacted; `__debugInfo` masks it in a dump; and nothing here ever returns it but `s3()`, which
 * builds the disk.
 */
final readonly class StorageConfig
{
    public const DATABASE = 'database';

    public const ENV = 'env';

    public const LOCAL = 'local';

    public function __construct(
        public string $source,
        public string $region,
        public ?string $bucket,
        public ?string $endpoint,
        public bool $pathStyle,
        public ?string $publicUrl,
        #[SensitiveParameter] private ?string $key,
        #[SensitiveParameter] private ?string $secret,
    ) {}

    public static function local(): self
    {
        return new self(self::LOCAL, 'eu-north-1', null, null, false, null, null, null);
    }

    public function isBucket(): bool
    {
        return $this->source !== self::LOCAL;
    }

    public function keyLast4(): ?string
    {
        return self::last4($this->key);
    }

    public function secretLast4(): ?string
    {
        return self::last4($this->secret);
    }

    /**
     * The `s3` driver's configuration for one prefix of the bucket.
     *
     * Never an ACL: what is public is the bucket policy's to say, per prefix, and Block Public Access
     * refuses public ACLs — an upload with one fails (`AccessControlListNotSupported`) or lands
     * unreadable, which looks like a credentials problem and is not. So every disk is `private` with
     * `ACL => null`, and MediaDisks strips any ACL from the client's commands besides (the adapter
     * falls back to the visibility's ACL when the option is null).
     *
     * A public prefix's URL is the public base plus the key — the CDN, or the bucket's own address.
     * The base carries no prefix: the adapter puts the disk's `root` in front of every path itself.
     * The private one has none: it is served only by `temporaryUrl()`.
     *
     * @return array<string, mixed>
     */
    public function s3(string $prefix, bool $public): array
    {
        return [
            'driver' => 's3',
            'key' => $this->key,
            'secret' => $this->secret,
            'region' => $this->region,
            'bucket' => $this->bucket,
            'url' => $public ? $this->publicBase() : null,
            'endpoint' => $this->endpoint === '' ? null : $this->endpoint,
            'use_path_style_endpoint' => $this->pathStyle,
            'root' => $prefix,
            'visibility' => 'private',
            'options' => ['ACL' => null],
            'throw' => true,
            'report' => false,
        ];
    }

    /**
     * The AWS SDK's client configuration, for what a disk cannot ask (rimify:s3-audit, the bucket
     * list on the settings screen).
     *
     * @return array<string, mixed>
     */
    public function client(): array
    {
        return array_filter([
            'version' => 'latest',
            'region' => $this->region,
            'credentials' => ['key' => (string) $this->key, 'secret' => (string) $this->secret],
            'endpoint' => $this->endpoint === '' ? null : $this->endpoint,
            'use_path_style_endpoint' => $this->pathStyle,
            'http' => ['connect_timeout' => 5, 'timeout' => 20],
        ], static fn (mixed $value): bool => $value !== null);
    }

    /** The address public files are read from: the configured base (a CDN), else the bucket's own. */
    public function publicBase(): string
    {
        if ($this->publicUrl !== null && $this->publicUrl !== '') {
            return rtrim($this->publicUrl, '/');
        }

        if ($this->endpoint !== null && $this->endpoint !== '') {
            return rtrim($this->endpoint, '/').'/'.$this->bucket;
        }

        return "https://{$this->bucket}.s3.{$this->region}.amazonaws.com";
    }

    /**
     * The origins a page loads from or posts to when the files are in the bucket — the public base
     * (a CDN, else the bucket) and the bucket's own address, where the PDF upload form posts. Named
     * hosts only, for the CSP (SecurityHeaders). None without a bucket.
     *
     * @return list<string>
     */
    public function origins(): array
    {
        if (! $this->isBucket()) {
            return [];
        }

        $bucketAddress = $this->endpoint !== null && $this->endpoint !== ''
            ? rtrim($this->endpoint, '/')
            : "https://{$this->bucket}.s3.{$this->region}.amazonaws.com";
        $origins = [];

        foreach ([$this->publicBase(), $bucketAddress] as $url) {
            $parts = parse_url($url);

            if (is_array($parts) && isset($parts['scheme'], $parts['host'])) {
                $origins[] = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
            }
        }

        return array_values(array_unique($origins));
    }

    /** Masked last four characters: `••••••••••••WXYZ`. */
    public static function mask(?string $last4): ?string
    {
        return $last4 === null || $last4 === '' ? null : str_repeat('•', 12).$last4;
    }

    public static function last4(#[SensitiveParameter] ?string $value): ?string
    {
        return $value === null || $value === '' ? null : mb_substr($value, -4);
    }

    /** @return array<string, mixed> */
    public function __debugInfo(): array
    {
        return [
            'source' => $this->source,
            'region' => $this->region,
            'bucket' => $this->bucket,
            'endpoint' => $this->endpoint,
            'pathStyle' => $this->pathStyle,
            'publicUrl' => $this->publicUrl,
            'key' => self::mask($this->keyLast4()),
            'secret' => self::mask($this->secretLast4()),
        ];
    }
}
