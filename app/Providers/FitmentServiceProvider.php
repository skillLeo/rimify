<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Derivation\IndexTables;
use App\Domain\Fitment\Derivation\LoadIndex;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbol;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Domain\Fitment\Infrastructure\EloquentVehicleRepository;
use App\Domain\Fitment\Infrastructure\SystemClock;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Models\LoadIndexEntry;
use App\Models\SpeedSymbolEntry;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

/**
 * Binds the fitment engine's contracts to their Eloquent implementations.
 *
 * The engine itself knows nothing about this file — that is the point of R-13. Swapping in a
 * different persistence layer, or an in-memory one for a test, is a change here and nowhere else.
 */
final class FitmentServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(VehicleRepository::class, EloquentVehicleRepository::class);
        $this->app->singleton(FitmentRepository::class, EloquentFitmentRepository::class);

        $this->app->singleton(FitmentResolver::class, static fn ($app): FitmentResolver => new FitmentResolver(
            vehicles: $app->make(VehicleRepository::class),
            fitments: $app->make(FitmentRepository::class),
            loadIndex: $app->make(LoadIndexDeriver::class),
            speedSymbol: $app->make(SpeedSymbolDeriver::class),
            clock: $app->make(Clock::class),
        ));

        $this->app->singleton(Clock::class, SystemClock::class);

        /*
         * The index tables are read once per request and shared. They are seeded rows rather than
         * constants so the client's compliance owner can verify them against a printed reference
         * without a deployment; an empty table throws rather than silently meaning "no minimum".
         */
        $this->app->singleton(IndexTables::class, static function (): IndexTables {
            $loadIndices = LoadIndexEntry::query()
                ->orderBy('load_index')
                ->get()
                ->map(static fn (LoadIndexEntry $e): LoadIndex => new LoadIndex($e->load_index, $e->capacity_kg))
                ->all();

            $speedSymbols = SpeedSymbolEntry::query()
                ->orderBy('speed_rank')
                ->get()
                ->map(static fn (SpeedSymbolEntry $e): SpeedSymbol => new SpeedSymbol($e->symbol, $e->speed_rank, $e->max_kmh))
                ->all();

            return new IndexTables($loadIndices, $speedSymbols);
        });

        $this->app->singleton(LoadIndexDeriver::class, static fn ($app): LoadIndexDeriver => new LoadIndexDeriver(
            $app->make(IndexTables::class),
            (int) config('rimify.load_index_margin_steps', 0),
        ));

        $this->app->singleton(SpeedSymbolDeriver::class, static fn ($app): SpeedSymbolDeriver => new SpeedSymbolDeriver(
            $app->make(IndexTables::class),
            (int) config('rimify.speed_symbol_margin_steps', 0),
        ));
    }

    /** @return list<string> */
    public function provides(): array
    {
        return [
            VehicleRepository::class,
            FitmentRepository::class,
            FitmentResolver::class,
            Clock::class,
            IndexTables::class,
            LoadIndexDeriver::class,
            SpeedSymbolDeriver::class,
        ];
    }
}
