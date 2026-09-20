<?php

declare(strict_types=1);

/*
 * The safety margins are commercial policy with a name and a default. The default must be zero:
 * anything else would silently make RIMIFY stricter than the law while looking like the law.
 */

it('ships both derivation margins at zero, so the derivation is the legal minimum', function (): void {
    expect(config('rimify.speed_symbol_margin_steps'))->toBe(0)
        ->and(config('rimify.load_index_margin_steps'))->toBe(0);
});

it('exposes the import and Gutachten settings the pipeline depends on', function (): void {
    expect(config('rimify.import.delete_threshold'))->toBe(0.15)
        ->and(config('rimify.gutachten.max_supersede_depth'))->toBe(20);
});
