<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Storefront\PapersBook;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\VehiclePapersRequest;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Cookie as CookieValue;

/**
 * The figures from the customer's papers, kept per car in one cookie (Block C, item 10; the second review
 * of C9, §5): `SameSite=Lax`, `Secure` in production, one year, `HttpOnly` — the server renders every
 * answer from it, the browser never needs to read it. It moves into the account once accounts exist.
 */
class FahrzeugPapiereController extends Controller
{
    public function store(VehiclePapersRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $book = self::book($request)->with((int) $vehicle->id, $request->figures());

        return back()->withCookie(self::cookie($book))->with('toast', 'Werte übernommen.');
    }

    public function destroy(VehiclePapersRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $book = self::book($request)->without((int) $vehicle->id);

        return back()
            ->withCookie($book->isEmpty() ? Cookie::forget(PapersBook::COOKIE) : self::cookie($book))
            ->with('toast', 'Werte gelöscht.');
    }

    private static function book(VehiclePapersRequest $request): PapersBook
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
