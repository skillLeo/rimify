<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Protokoll filters by person, so both ways a person is written on an entry get an index: the
 * account that acted (causer) and the address kept on the row itself (actor_email), which is what
 * still names them if the account is later renamed or suspended.
 *
 * The causer pair usually exists already — `nullableMorphs()` indexes it — so each index is added
 * only where it is missing, and `down()` removes only what this migration added. Adding an index is
 * a schema change, not a row change: the append-only triggers on the table are not involved.
 */
return new class extends Migration
{
    private const ACTOR = 'idx_audit_actor_email';

    private const CAUSER = 'idx_audit_causer';

    public function up(): void
    {
        $needsActor = ! Schema::hasIndex('audit_logs', ['actor_email']);
        $needsCauser = ! Schema::hasIndex('audit_logs', ['causer_type', 'causer_id']);

        if (! $needsActor && ! $needsCauser) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) use ($needsActor, $needsCauser): void {
            if ($needsActor) {
                $table->index('actor_email', self::ACTOR);
            }

            if ($needsCauser) {
                $table->index(['causer_type', 'causer_id'], self::CAUSER);
            }
        });
    }

    public function down(): void
    {
        foreach ([self::ACTOR, self::CAUSER] as $name) {
            if (Schema::hasIndex('audit_logs', $name)) {
                Schema::table('audit_logs', static function (Blueprint $table) use ($name): void {
                    $table->dropIndex($name);
                });
            }
        }
    }
};
