<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * Every controller can authorise through the Gate: `$this->authorize()` is what makes a Policy the
 * server-side enforcement R-11 demands, rather than a hint the UI may or may not honour.
 */
abstract class Controller
{
    use AuthorizesRequests;
}
