<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kontakt.
 *
 * Every contact detail comes from `config('rimify.contact')` — the homepage, the FAQ card and this
 * page previously carried three different phone numbers because they were written at three
 * different times (D-023). A literal number in a component is a defect.
 */
class KontaktController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Kontakt/Index', [
            'contact' => [
                'email' => config('rimify.contact.email'),
                'phone' => config('rimify.contact.phone'),
                'phoneIntl' => config('rimify.contact.phone_intl'),
                'whatsapp' => config('rimify.contact.whatsapp'),
                'hours' => config('rimify.contact.hours'),
            ],
        ]);
    }
}
