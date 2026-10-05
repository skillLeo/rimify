<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Illuminate\Support\Facades\DB;

/**
 * Room for a reset's safety copy, asked before the copy is begun (the reset brief §3.3): a reset that cannot finish its
 * copy refuses before it writes a byte of it, rather than leaving half a copy behind and nothing to undo with.
 *
 * What a copy may take is estimated high: every table's data as the database stores it (the compressed copy is a
 * fraction of that), the files the level moves into the copy's folder, and a margin. The free space is the operating
 * system's answer for that folder. On a shared host that answer can be the whole disk's, not the account's quota
 * (Hostinger: 6,8 TiB free on a 21 TB volume, 05.10.2026) — so the copy is also written to a `.part` file, read back
 * and checked before it counts (SqlSnapshot::write, TestReset::checkCopy): a write the quota stops leaves nothing
 * behind and changes nothing. Its own class so a test can stand in for the disk.
 */
class ResetDisk
{
    /** Kept free beyond the estimate, for the database's own growth and the log while the reset runs. */
    public const MARGIN_BYTES = 64 * 1024 * 1024;

    /** Bytes free where `$dir` is (or would be made), or null when the host does not say. */
    public function free(string $dir): ?float
    {
        $path = $dir;

        while (! is_dir($path) && dirname($path) !== $path) {
            $path = dirname($path);
        }

        $free = function_exists('disk_free_space') ? @disk_free_space($path) : false;

        return $free === false ? null : (float) $free;
    }

    /** The database's tables as stored: data and indexes, in bytes. */
    public function databaseBytes(): int
    {
        return (int) DB::selectOne(
            "SELECT COALESCE(SUM(DATA_LENGTH + INDEX_LENGTH), 0) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
        )->n;
    }

    /** What a copy with `$fileBytes` of moved files may need: the tables, the files, the margin. */
    public function needed(int $fileBytes): int
    {
        return $this->databaseBytes() + $fileBytes + self::MARGIN_BYTES;
    }
}
