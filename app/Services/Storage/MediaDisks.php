<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Aws\CommandInterface;
use Aws\Middleware;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use LogicException;

/**
 * The four media disks (config/media.php), built from the credential set in force: one bucket,
 * one prefix each — or, with no bucket, one local folder each, public ones under the `public`
 * disk's web root. Code names a disk (`Storage::disk('media_products')`), never a bucket or prefix.
 *
 * No request to the bucket ever carries an ACL (StorageConfig::s3 says why): the client of every
 * disk drops it from each command before it is sent — PutObject, a multipart upload, anything.
 */
final class MediaDisks
{
    public const NO_ACL = 'rimify.no-acl';

    public function __construct(private readonly StorageSettings $settings, private readonly AwsClients $aws) {}

    /** The disk `$name` as the settings in force build it. */
    public function build(string $name): Filesystem
    {
        return $this->make($this->config($name, $this->settings->current()));
    }

    /**
     * A disk from its configuration, with the ACL stripped on a bucket.
     *
     * @param  array<string, mixed>  $config
     */
    public function make(array $config): Filesystem
    {
        $disk = Storage::build($config);

        if ($disk instanceof AwsS3V3Adapter) {
            $handlers = $disk->getClient()->getHandlerList();

            if ($this->aws->handler() !== null) {
                $handlers->setHandler($this->aws->handler());
            }

            $handlers->remove(self::NO_ACL);
            $handlers->appendInit(Middleware::mapCommand(static function (CommandInterface $command): CommandInterface {
                // setVisibility() would be nothing but an ACL: refused here, never sent.
                if ($command->getName() === 'PutObjectAcl') {
                    throw new LogicException('No ACL is ever set on this bucket: what is public is the bucket policy\'s to say, per prefix.');
                }

                unset($command['ACL']);

                return $command;
            }), self::NO_ACL);
        }

        return $disk;
    }

    /**
     * A disk's configuration for a given set — the connection test builds one from a set that is not
     * in force yet.
     *
     * @return array<string, mixed>
     */
    public function config(string $name, StorageConfig $set): array
    {
        /** @var array{prefix: string, visibility: 'public'|'private'}|null $spec */
        $spec = config("media.disks.{$name}");

        if ($spec === null) {
            throw new InvalidArgumentException("Unknown media disk {$name}.");
        }

        $public = $spec['visibility'] === 'public';

        if ($set->isBucket()) {
            return $set->s3($spec['prefix'], $public);
        }

        return [
            'driver' => 'local',
            'root' => storage_path(($public ? 'app/public/' : 'app/private/').$spec['prefix']),
            'url' => $public ? rtrim((string) config('app.url'), '/').'/storage/'.$spec['prefix'] : null,
            'visibility' => $spec['visibility'],
            // A private file is served only through a signed, expiring link (temporaryUrl).
            'serve' => ! $public,
            'throw' => true,
            'report' => false,
        ];
    }

    /** @return list<string> */
    public static function names(): array
    {
        return array_keys((array) config('media.disks'));
    }
}
