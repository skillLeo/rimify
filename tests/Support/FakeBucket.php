<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\Storage\AwsClients;
use Aws\CommandInterface;
use Aws\Result;
use Aws\S3\Exception\S3Exception;
use Closure;
use GuzzleHttp\Promise\Create;
use GuzzleHttp\Promise\PromiseInterface;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Psr7\Utils;
use Psr\Http\Message\RequestInterface;

/**
 * A bucket in memory for the storage tests: every AWS client the app makes (AwsClients) is handed
 * this transport, so a test sees each command and the HTTP request it became — and nothing reaches
 * the network. `failWith` makes every command answer the way AWS refuses one.
 */
final class FakeBucket
{
    /** @var array<string, string> key => body */
    public array $objects = [];

    /** @var list<array{name: string, params: array<string, mixed>, headers: array<string, list<string>>}> */
    public array $sent = [];

    /** @var list<string> */
    public array $buckets = ['rimify-media-test'];

    /** @var array<string, array<string, mixed>> what other commands answer (GetBucketLocation, GetBucketCors, …) */
    public array $answers = [];

    /** @var array<string, string> command => AWS error code it is refused with */
    public array $refuse = [];

    private ?string $failCode = null;

    public static function install(): self
    {
        $bucket = new self;
        app()->instance(AwsClients::class, new AwsClients($bucket->handler()));

        return $bucket;
    }

    public function failWith(string $code): self
    {
        $this->failCode = $code;

        return $this;
    }

    /** @return list<string> */
    public function names(): array
    {
        return array_column($this->sent, 'name');
    }

    public function handler(): Closure
    {
        return function (CommandInterface $command, RequestInterface $request): PromiseInterface {
            $this->sent[] = ['name' => $command->getName(), 'params' => $command->toArray(), 'headers' => $request->getHeaders()];

            if ($this->failCode !== null) {
                return Create::rejectionFor(new S3Exception("{$this->failCode} (fake)", $command, ['code' => $this->failCode, 'message' => 'Access Denied']));
            }

            if (isset($this->refuse[$command->getName()])) {
                return Create::rejectionFor(new S3Exception('refused (fake)', $command, ['code' => $this->refuse[$command->getName()]]));
            }

            $key = (string) ($command['Key'] ?? '');

            if ($command->getName() === 'HeadObject' && ! isset($this->objects[$key])) {
                return Create::rejectionFor(new S3Exception('NotFound (fake)', $command, ['code' => 'NotFound', 'response' => new Response(404)]));
            }

            return Create::promiseFor(match ($command->getName()) {
                'PutObject' => $this->put($key, $command['Body']),
                'GetObject' => new Result(['Body' => Utils::streamFor($this->range($this->objects[$key] ?? '', $command['Range'] ?? null))]),
                'CopyObject' => $this->put($key, $this->objects[explode('/', (string) $command['CopySource'], 2)[1]] ?? ''),
                'DeleteObject' => $this->delete($key),
                'HeadObject' => new Result(['ContentLength' => strlen($this->objects[$key] ?? ''), 'ETag' => '"'.md5($this->objects[$key] ?? '').'"']),
                'ListBuckets' => new Result(['Buckets' => array_map(static fn (string $name): array => ['Name' => $name], $this->buckets)]),
                default => new Result($this->answers[$command->getName()] ?? []),
            });
        };
    }

    private function put(string $key, mixed $body): Result
    {
        $this->objects[$key] = (string) Utils::streamFor($body);

        return new Result(['ETag' => '"fake"']);
    }

    /** `bytes=0-4` → the first five bytes, as S3 answers a ranged GET. */
    private function range(string $body, mixed $range): string
    {
        if (! is_string($range) || preg_match('/^bytes=(\d+)-(\d+)$/', $range, $m) !== 1) {
            return $body;
        }

        return substr($body, (int) $m[1], (int) $m[2] - (int) $m[1] + 1);
    }

    private function delete(string $key): Result
    {
        unset($this->objects[$key]);

        return new Result([]);
    }
}
