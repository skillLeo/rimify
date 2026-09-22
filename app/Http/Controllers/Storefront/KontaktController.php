<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Storefront\Chrome;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kontakt.
 *
 * Every contact detail comes from `config('rimify.contact')` — the homepage, the FAQ card and this
 * page previously carried three different phone numbers because they were written at three
 * different times (D-023). A literal number in a component is a defect. A detail the client has
 * not given arrives as null, and the page leaves its row out.
 */
class KontaktController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Kontakt/Index', [
            'contact' => Chrome::contact(),
        ]);
    }
}
