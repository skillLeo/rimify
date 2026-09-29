<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\AdminUser;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * The one way admin code writes an entry into the audit trail (docs/admin/team-build-plan.md).
 *
 * Every entry carries the same four things, so the Protokoll can read any of them without knowing
 * who wrote it: the account that acted, its address kept on the row itself (so the entry stays
 * readable after the account is suspended or renamed), the IP, and the event's own properties
 * under the keys the build plan names. The table is append-only at the model and by trigger;
 * this only ever inserts.
 */
final class AuditTrail
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public static function record(AdminUser $actor, string $event, array $properties = [], ?Model $subject = null): void
    {
        $logger = activity('admin')
            ->causedBy($actor)
            ->withProperties($properties)
            ->tap(static function (AuditLog $entry) use ($actor): void {
                $entry->forceFill([
                    'actor_email' => $actor->email,
                    'ip_address' => request()->ip(),
                ]);
            });

        if ($subject !== null) {
            $logger->performedOn($subject);
        }

        $logger->log($event);
    }
}
