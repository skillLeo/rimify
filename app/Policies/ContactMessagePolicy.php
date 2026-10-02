<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * The contact form's messages (the client's #12, D-123). Anyone may send one — a guest too (R-11). The team reads them
 * by the orders row of the Rollen & Rechte grid, as it reads the customers' orders and reviews. Whoever reads them may
 * mark one as read: that changes the team's own queue, not a customer's data — and the Kundenbetreuung, who answers
 * these, reads orders without changing them. Nobody edits or writes a message in the admin.
 */
final class ContactMessagePolicy
{
    public function create(?Authenticatable $user): bool
    {
        return true;
    }

    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View);
    }

    public function markRead(AdminUser $user): bool
    {
        return $this->viewAny($user);
    }
}
