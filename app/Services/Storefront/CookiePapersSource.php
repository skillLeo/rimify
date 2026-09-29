<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Contracts\PapersSource;
use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\VehicleBuild;
use App\Domain\Storefront\PapersBook;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;

/**
 * The customer's figures, read from the `rmf_papiere` cookie of the request being answered — read at the
 * moment of asking, never kept, so one visitor's figures can never answer for another.
 *
 * The admin panel never reads them: a preview in the Gutachten record answers for the vehicle data, not
 * for whatever car the person at the desk once typed into the shop in the same browser.
 */
final readonly class CookiePapersSource implements PapersSource
{
    public function __construct(private Container $app) {}

    public function for(int $vehicleId): ?PapersFigures
    {
        return $this->book()?->for($vehicleId);
    }

    public function buildFor(int $vehicleId): ?VehicleBuild
    {
        return $this->book()?->buildFor($vehicleId);
    }

    private function book(): ?PapersBook
    {
        if (! $this->app->bound('request')) {
            return null;
        }

        $request = $this->app->make(Request::class);

        if ($request->is('admin', 'admin/*')) {
            return null;
        }

        $raw = $request->cookie(PapersBook::COOKIE);

        return PapersBook::decode(is_string($raw) ? $raw : null);
    }
}
