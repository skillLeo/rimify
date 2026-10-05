<?php

declare(strict_types=1);

namespace App\Services\Reset;

use App\Console\Commands\ResetCommand;
use Illuminate\Http\Request;

/**
 * Where a reset was asked for (CLAUDE.md R-04.1, condition 4): `rimify:reset` while it runs, or the screen System ›
 * Zurücksetzen in one of its two POSTs. Nothing else can make one — the constructor is private, and each way in checks
 * that it is what it says — so the engine (TestReset), which takes one for every reset, undo and recovery, cannot be
 * reached from other code, a seeder, a factory, a job or a test. ResetReachTest holds that only the command and the
 * screen's controller use this class and the engine.
 */
final class ResetOrigin
{
    /** The screen's two requests that may reset: „Zurücksetzen“ and „rückgängig machen“. */
    private const ROUTES = ['admin.zuruecksetzen.store', 'admin.zuruecksetzen.undo'];

    public const REFUSAL = 'Das Zurücksetzen startet nur über rimify:reset oder über System › Zurücksetzen. Es wurde nichts verändert.';

    private function __construct(
        /** As the Protokoll names it: „rimify:reset“ or „System › Zurücksetzen“. */
        public readonly string $via,
        private readonly bool $confirmed,
    ) {}

    /** The command, from inside its own run. */
    public static function console(ResetCommand $command): self
    {
        return new self('rimify:reset', app()->runningInConsole() && $command->getName() === 'rimify:reset' && $command->running());
    }

    /** The screen, from one of its two POSTs — routed, authorised and validated by then. */
    public static function screen(Request $request): self
    {
        return new self('System › Zurücksetzen', $request->isMethod('POST') && in_array($request->route()?->getName(), self::ROUTES, true));
    }

    /** Null when the origin is what it says; the refusal otherwise. */
    public function refusal(): ?string
    {
        return $this->confirmed ? null : self::REFUSAL;
    }
}
