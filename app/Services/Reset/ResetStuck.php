<?php

declare(strict_types=1);

namespace App\Services\Reset;

/**
 * A reset or undo that failed and whose safety copy could not be put back at once: the marker stays, the site stays in
 * maintenance, and TestReset::recover() puts the copy back on its next look (the scheduler, every minute).
 */
final class ResetStuck extends ResetRefused {}
