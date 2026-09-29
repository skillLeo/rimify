<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Data\VehicleBuild;
use App\Domain\Storefront\PapersBook;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\VehicleBuildRequest;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Cookie as CookieValue;

/**
 * The body style and drive the owner gives for a car whose data has none (the operator's last prompt §1.1),
 * kept per car in the same cookie as 8.1, 8.2 and T (`rmf_papiere`, the same flags). An answer the owner gives
 * where only one of the two is asked keeps the other they gave before.
 */
class FahrzeugAufbauController extends Controller
{
    public function store(VehicleBuildRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $book = self::book($request);
        $before = $book->buildFor((int) $vehicle->id);
        $given = $request->build();
        $build = VehicleBuild::tryFrom($given->bodyForm ?? $before?->bodyForm, $given->driveAxle ?? $before?->driveAxle) ?? $given;

        return back()->withCookie(self::cookie($book->withBuild((int) $vehicle->id, $build)))->with('toast', 'Angabe übernommen – wir haben neu geprüft.');
    }

    public function destroy(VehicleBuildRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $book = self::book($request)->withoutBuild((int) $vehicle->id);

        return back()
            ->withCookie($book->isEmpty() ? Cookie::forget(PapersBook::COOKIE) : self::cookie($book))
            ->with('toast', 'Angaben zu Karosserieform und Antriebsart gelöscht.');
    }

    private static function book(VehicleBuildRequest $request): PapersBook
    {
        $raw = $request->cookie(PapersBook::COOKIE);

        return PapersBook::decode(is_string($raw) ? $raw : null);
    }

    private static function cookie(PapersBook $book): CookieValue
    {
        return Cookie::make(
            PapersBook::COOKIE,
            $book->encode(),
            PapersBook::LIFETIME_MINUTES,
            '/',
            null,
            app()->isProduction(),
            true,
            false,
            'lax',
        );
    }
}
