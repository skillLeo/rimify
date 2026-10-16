<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Order;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Orders, by the Rollen & Rechte grid's `orders` row (R-11). Reading, changing and taking a copy
 * away are separate rights: the Buchhaltung reads and exports, Support reads, only the order team
 * changes an order.
 */
class OrderPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View);
    }

    public function view(AdminUser $user, Order $order): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View);
    }

    public function update(AdminUser $user, Order $order): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View)
            && $user->may(PermissionModule::Orders, PermissionAction::Edit);
    }

    public function export(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Orders, PermissionAction::View)
            && $user->may(PermissionModule::Orders, PermissionAction::Export);
    }

    /**
     * A fresh link to an order whose link expired (D-240), for anyone who names its number and the address it went to —
     * a visitor included. Only for an order that came through the checkout: a seeded one opens by number and has nobody
     * to write to.
     */
    public function resendLink(?Authenticatable $user, Order $order): bool
    {
        return ! $order->seeded() && is_string($order->customer?->email) && $order->customer->email !== '';
    }
}
