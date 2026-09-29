<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Contracts\Auth\Authenticatable;

/**
 * The printable RIMIFY-Check: anyone may take away, in writing, what the shop told them about their car — a
 * guest too, there are no customer accounts yet (R-11). A result is only ever written, never changed; there
 * is no update and no delete here.
 */
final class CheckResultPolicy
{
    public function create(?Authenticatable $user): bool
    {
        return true;
    }
}
