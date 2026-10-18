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
 *
 * The form asks only for what the answer is missing (D-291), so what comes is laid over what the customer gave
 * before for the same car: asked for T alone, their 8.1 and 8.2 stay.
 */
class FahrzeugPapiereController extends Controller
{
    public function store(VehiclePapersRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $book = self::book($request);
        $book = $book->with((int) $vehicle->id, $request->figuresOver($book->for((int) $vehicle->id)));

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
