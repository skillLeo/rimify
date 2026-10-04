<?php

declare(strict_types=1);

namespace App\Services\Reset;

use RuntimeException;

/**
 * A reset or an undo that was not started, or was taken back: nothing changed, and the message says why in German.
 * ResetStuck is the one kind after which something still has to happen.
 */
class ResetRefused extends RuntimeException {}
