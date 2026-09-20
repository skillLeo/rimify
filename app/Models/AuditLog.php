<?php

declare(strict_types=1);

namespace App\Models;

use LogicException;
use Spatie\Activitylog\Models\Activity;

/**
 * The audit trail. Extends Spatie's Activity so `activity()` and `LogsActivity` write here, but
 * points at `audit_logs` and is append-only at both layers.
 *
 * An audit trail that can be edited is not an audit trail.
 */
class AuditLog extends Activity
{
    protected $table = 'audit_logs';

    protected static function booted(): void
    {
        static::updating(function (): never {
            throw self::appendOnly();
        });

        static::deleting(function (): never {
            throw self::appendOnly();
        });
    }

    private static function appendOnly(): LogicException
    {
        return new LogicException('audit_logs is append-only.');
    }
}
