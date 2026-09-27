<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Models\AdminUser;
use App\Models\SavedView;
use App\Services\Admin\Lists\AdminLists;

/**
 * Gespeicherte Ansichten (R-11): anybody who may open a list may keep views of it; a view is its
 * owner's to change, share, delete and restore; a shared one is only for using. Whoever loses the
 * right to open the list loses its views with it.
 */
class SavedViewPolicy
{
    public function create(AdminUser $user, string $list): bool
    {
        return self::mayOpen($user, $list);
    }

    public function view(AdminUser $user, SavedView $view): bool
    {
        return self::mayOpen($user, $view->list)
            && ($view->admin_user_id === $user->id || ($view->role_id !== null && in_array($view->role_id, SavedView::roleIdsOf($user), true)));
    }

    public function update(AdminUser $user, SavedView $view): bool
    {
        return $view->admin_user_id === $user->id && self::mayOpen($user, $view->list);
    }

    public function delete(AdminUser $user, SavedView $view): bool
    {
        return $this->update($user, $view);
    }

    public function restore(AdminUser $user, SavedView $view): bool
    {
        return $this->update($user, $view);
    }

    public static function mayOpen(AdminUser $user, string $list): bool
    {
        $spec = AdminLists::get($list);

        return $spec !== null && $user->may($spec['module'], PermissionAction::View);
    }
}
