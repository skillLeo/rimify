<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Review;

/**
 * The buyers' reviews, by the orders row of the Rollen & Rechte grid (R-11, D-103): who reads orders reads their
 * reviews; who changes orders may hide, show and answer one. Nobody may create one — there is no ability for it, and
 * no route: a review comes only from a delivered order's own signed link.
 */
class ReviewPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View);
    }

    public function moderate(AdminUser $user, Review $review): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View)
            && $user->may(PermissionModule::Orders, PermissionAction::Edit);
    }

    /** Never: a review is the buyer's, written through their order's link. */
    public function create(AdminUser $user): bool
    {
        return false;
    }
}
