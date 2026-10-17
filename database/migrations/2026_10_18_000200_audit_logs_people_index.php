<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Everybody in the Protokoll read from the index alone (D-278, the operator's brief of 17.10.2026 §4).
 *
 * The Protokoll's „Person“ filter lists everybody who appears in the log, once each: the distinct causer and address of
 * every entry. Without an index holding all three the database read the whole log into a temporary table, and the log only
 * grows (R-12): on a copy of the development log, 13 176 entries, 49 ms on MariaDB 11.8 and 23 ms on MySQL 8.4. With
 * them in one index it jumps from one person to the next (`Using index for group-by`): 0,7 and 1,1 ms, whatever the log's
 * length. The morph's own index (`causer`) is a prefix of the new one and goes; every query by causer keeps an index.
 * Indexes only: no row of the append-only log is written.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $t): void {
            $t->index(['causer_type', 'causer_id', 'actor_email'], 'idx_audit_people');
            $t->dropIndex('causer');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $t): void {
            $t->index(['causer_type', 'causer_id'], 'causer');
            $t->dropIndex('idx_audit_people');
        });
    }
};
