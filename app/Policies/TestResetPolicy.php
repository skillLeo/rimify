<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Reset\TestReset;

/**
 * Einstellungen › System › Testumgebung zurücksetzen: the Super-Admin alone — and only in a test environment, so in
 * production the answer is no for everyone, whatever the matrix says. The routes ask for the password again first
 * (EnsureSudo). R-11: refused on the server, whatever the page shows.
 */
class TestResetPolicy
{
    public function view(AdminUser $user): bool
    {
        return TestReset::available() && $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::View);
    }

    public function reset(AdminUser $user): bool
    {
        return TestReset::available() && $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }
}
