<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ReviewFeedback;

/**
 * The review kit (the review release §3), only where the review is on (`rimify.review.enabled`: local
 * and staging). Every signed-in admin may give feedback and read the list — the review is shared work;
 * answering, assigning and closing points is the settings role's, which the team's lead holds (R-11).
 */
final class ReviewFeedbackPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return self::enabled();
    }

    public function create(AdminUser $user): bool
    {
        return self::enabled();
    }

    public function update(AdminUser $user, ?ReviewFeedback $feedback = null): bool
    {
        return self::enabled() && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }

    public static function enabled(): bool
    {
        return (bool) config('rimify.review.enabled', false);
    }
}
