<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Aws\CommandInterface;
use Aws\S3\S3Client;
use Aws\SesV2\SesV2Client;
use Aws\Sts\StsClient;
use Closure;
use GuzzleHttp\Promise\PromiseInterface;
use Psr\Http\Message\RequestInterface;

/**
 * Every AWS client the app makes — the disks' (MediaDisks), the audit's, the bucket list's — from one
 * place, so all of them go over the same transport. In production that is the SDK's own; a test
 * hands in a handler that answers every command itself, so no test ever reaches the network.
 */
class AwsClients
{
    /** @param  (Closure(CommandInterface, RequestInterface): PromiseInterface)|null  $handler */
    public function __construct(private readonly ?Closure $handler = null) {}

    /** @param  array<string, mixed>  $overrides  e.g. a shorter `http` timeout for a probe */
    public function s3(StorageConfig $set, array $overrides = []): S3Client
    {
        return new S3Client($this->with([...$set->client(), ...$overrides]));
    }

    public function sts(StorageConfig $set): StsClient
    {
        return new StsClient($this->with($set->client()));
    }

    /** Amazon SES for Einstellungen › E-Mail's test (SesProbe) — the shop's own mail goes through Laravel's transport. */
    public function ses(string $region, #[\SensitiveParameter] string $key, #[\SensitiveParameter] string $secret): SesV2Client
    {
        return new SesV2Client($this->with([
            'version' => 'latest',
            'region' => $region,
            'credentials' => ['key' => $key, 'secret' => $secret],
            'http' => ['connect_timeout' => 5, 'timeout' => 10],
        ]));
    }

    /** The transport a disk's client is switched to after it is built; null keeps the SDK's. */
    public function handler(): ?Closure
    {
        return $this->handler;
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function with(array $config): array
    {
        return $this->handler === null ? $config : [...$config, 'handler' => $this->handler];
    }
}
