<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Page;

/**
 * Who may read, draft and publish the shop's pages — cells of the `content` row of the matrix,
 * never a role name (R-11). Drafting and publishing are separate rights on purpose: a team can let
 * somebody prepare the words without letting them put anything live.
 */
final class PagePolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::View);
    }

    public function view(AdminUser $user, Page $page): bool
    {
        return $page->isEditable() && $user->may(PermissionModule::Content, PermissionAction::View);
    }

    /** A new Ratgeber article; the other kinds of page are fixed by the shop's structure. */
    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Create);
    }

    /** Saving or discarding the draft, and loading an old version into it. */
    public function update(AdminUser $user, Page $page): bool
    {
        return $page->isEditable() && $user->may(PermissionModule::Content, PermissionAction::Edit);
    }

    /** Putting words live, or taking an article off the shop. */
    public function publish(AdminUser $user, Page $page): bool
    {
        return $page->isEditable() && $user->may(PermissionModule::Content, PermissionAction::Publish);
    }

    /**
     * Deleting a Ratgeber article (his admin item 12, D-351) — the only kind of page a team adds, so the only one it
     * removes. One that is live leaves the shop with it, which takes the right to publish as well.
     */
    public function delete(AdminUser $user, Page $page): bool
    {
        return $page->kind === Page::KIND_GUIDE
            && $user->may(PermissionModule::Content, PermissionAction::Delete)
            && (! $page->isPublished() || $user->may(PermissionModule::Content, PermissionAction::Publish));
    }
}
