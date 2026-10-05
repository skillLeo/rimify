<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Reset\TestEnvironment;

/**
 * Einstellungen › System › Testumgebung zurücksetzen: the Super-Admin alone — and only where the reset is available
 * (TestEnvironment: a test environment, the server's RIMIFY_RESET_ERLAUBT, a database that is not the live shop's), so
 * in production the answer is no for everyone, whatever the matrix says. The routes ask for the password again first
 * (EnsureSudo), and answer 404 before either where the reset is not available (EnsureResetAvailable). R-11: refused
 * on the server, whatever the page shows.
 */
class TestResetPolicy
{
    public function view(AdminUser $user): bool
    {
        return TestEnvironment::available() && $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::View);
    }

    public function reset(AdminUser $user): bool
    {
        return TestEnvironment::available() && $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }
}
