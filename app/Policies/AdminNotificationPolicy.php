<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\AdminUser;
use Illuminate\Notifications\DatabaseNotification;

/**
 * An alert belongs to the one person it was sent to. Nobody else — not an Inhaber, not a
 * colleague with every right — may mark it read: whether someone has seen their alerts is theirs.
 */
class AdminNotificationPolicy
{
    public function update(AdminUser $user, DatabaseNotification $notification): bool
    {
        return $notification->notifiable_type === $user->getMorphClass()
            && (int) $notification->notifiable_id === (int) $user->getKey();
    }
}
