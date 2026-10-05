<?php

declare(strict_types=1);

use App\Services\Admin\ListExport;
use Illuminate\Support\Facades\File;

/*
 * The XLSX writer copies the finished file to the output and only then removes its working folder. On Windows a
 * scanner can hold a file in that folder for a moment, and the rmdir fails — BestellungenTest failed so, once in
 * twenty runs under load (05.10.2026), on a download that was already complete. ListExport::closeWriter lets exactly
 * that go: an rmdir or unlink inside its own temp folder. Anything else is still an error.
 */

beforeEach(function (): void {
    $this->temp = storage_path('framework/testing/xlsx-close-'.getmypid());
    File::ensureDirectoryExists($this->temp.DIRECTORY_SEPARATOR.'busy');
    File::put($this->temp.DIRECTORY_SEPARATOR.'busy'.DIRECTORY_SEPARATOR.'drawing1.xml', '<xml/>');
});

afterEach(function (): void {
    File::deleteDirectory($this->temp);
});

it('lets a working folder that cannot be removed yet go, once the file is out', function (): void {
    // rmdir on a folder that still holds a file: the warning a held file gives, turned into an ErrorException.
    ListExport::closeWriter(fn () => rmdir($this->temp.DIRECTORY_SEPARATOR.'busy'), $this->temp);

    expect(is_dir($this->temp.DIRECTORY_SEPARATOR.'busy'))->toBeTrue();
});

it('still fails on anything else: a cleanup outside its own folder, or another fault', function (): void {
    $elsewhere = storage_path('framework/testing/xlsx-elsewhere-'.getmypid());
    File::ensureDirectoryExists($elsewhere.DIRECTORY_SEPARATOR.'busy');
    File::put($elsewhere.DIRECTORY_SEPARATOR.'busy'.DIRECTORY_SEPARATOR.'x.xml', '<xml/>');

    try {
        expect(fn () => ListExport::closeWriter(fn () => rmdir($elsewhere.DIRECTORY_SEPARATOR.'busy'), $this->temp))
            ->toThrow(ErrorException::class, 'rmdir(')
            ->and(fn () => ListExport::closeWriter(fn () => fopen($this->temp.DIRECTORY_SEPARATOR.'missing'.DIRECTORY_SEPARATOR.'x', 'rb'), $this->temp))
            ->toThrow(ErrorException::class, 'fopen(')
            ->and(fn () => ListExport::closeWriter(fn () => throw new RuntimeException('zip failed'), $this->temp))
            ->toThrow(RuntimeException::class, 'zip failed');
    } finally {
        File::deleteDirectory($elsewhere);
    }
});
