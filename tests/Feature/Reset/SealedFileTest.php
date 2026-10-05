<?php

declare(strict_types=1);

use App\Services\Reset\SealedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;

/*
 * A reset's safety copy is encrypted at rest (the operator's brief of 05.10.2026, §2.2): AES-256-GCM in chunks, under a
 * key of its own drawn from APP_KEY. What is sealed opens to the same bytes; a copy altered, cut short, extended or
 * opened under another APP_KEY does not open at all — it never comes back shorter or different.
 */

beforeEach(function (): void {
    $this->dir = storage_path('framework/testing/sealed-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)));
    File::ensureDirectoryExists($this->dir);
    $this->plain = $this->dir.'/plain.bin';
    $this->sealed = $this->dir.'/copy.enc';
});

afterEach(function (): void {
    File::deleteDirectory($this->dir);
});

it('opens to exactly what was sealed — several chunks, one, and none', function (string $size): void {
    $bytes = match ($size) {
        'three chunks' => random_bytes(2 * 1_048_576 + 12_345),
        'one chunk' => 'INSERT INTO `customers` VALUES (1, \'Kunde\', \'kunde@example.com\');',
        'empty' => '',
    };
    file_put_contents($this->plain, $bytes);

    SealedFile::seal($this->plain, $this->sealed);
    $opened = SealedFile::open($this->sealed);

    expect(SealedFile::isSealed($this->sealed))->toBeTrue()
        ->and(SealedFile::isSealed($this->plain))->toBeFalse()
        ->and(file_get_contents($opened))->toBe($bytes)
        ->and(str_contains((string) file_get_contents($this->sealed), 'kunde@example.com'))->toBeFalse()
        ->and(glob($this->dir.'/*.sealing'))->toBe([]);

    unlink($opened);
})->with(['three chunks', 'one chunk', 'empty']);

it('refuses to open a copy that was altered, cut short, extended or written under another key', function (): void {
    file_put_contents($this->plain, random_bytes(1_048_576 + 5000));
    SealedFile::seal($this->plain, $this->sealed);
    $whole = (string) file_get_contents($this->sealed);

    $damaged = [
        'a byte changed' => substr_replace($whole, chr(ord($whole[200]) ^ 1), 200, 1),
        'the last chunk cut off' => substr($whole, 0, strlen($whole) - 6000),
        'cut mid-chunk' => substr($whole, 0, strlen($whole) - 10),
        'bytes appended' => $whole.'x',
    ];

    foreach ($damaged as $what => $content) {
        file_put_contents($this->sealed, $content);

        expect(fn () => SealedFile::open($this->sealed))->toThrow(RuntimeException::class, null, $what);
    }

    expect(glob($this->dir.'/*.open'))->toBe([]);

    file_put_contents($this->sealed, $whole);
    config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);

    expect(fn () => SealedFile::open($this->sealed))->toThrow(RuntimeException::class, 'anderen APP_KEY');
});
