<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\FaqEntry;

/**
 * Who may change the FAQ — cells of the `content` row, never a role name (R-11).
 *
 * The FAQ has no draft, so the line between editing and publishing runs through what a visitor
 * sees: changing a hidden entry is editing; changing a visible one, or showing or hiding one, is
 * publishing. A team that may only prepare words can prepare a hidden answer and nothing more.
 */
final class FaqEntryPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Create);
    }

    public function update(AdminUser $user, FaqEntry $entry): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Edit);
    }

    public function delete(AdminUser $user, FaqEntry $entry): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Delete);
    }

    /** Anything a visitor would see change: a visible entry's words, its place, or its visibility. */
    public function publish(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Publish);
    }
}
