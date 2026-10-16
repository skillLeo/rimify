<?php

declare(strict_types=1);

namespace App\Policies;

use App\Services\Reset\TestEnvironment;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * The shop's error pages, opened on purpose (`/__fehlerseite/{status}`, D-243): in a test environment — local, the test suite,
 * the preview — for anyone who looks, so the 500 page can be seen where it would otherwise take a real failure. In the
 * live shop never: there the address does not exist.
 */
class ErrorPagePolicy
{
    public function preview(?Authenticatable $user): bool
    {
        return TestEnvironment::environmentAllows();
    }
}
