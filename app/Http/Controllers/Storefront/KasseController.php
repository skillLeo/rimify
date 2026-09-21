<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Storefront\Basket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Checkout. Guest only — there are no customer accounts in this product.
 *
 * The header shows no vehicle presentation here at all: at the point of paying, the chrome must
 * not compete with the summary, and a blue bar offering to change the vehicle beside a payment
 * button is an invitation to abandon.
 */
class KasseController extends Controller
{
    public function __construct(private readonly Basket $basket) {}

    public function index(Request $request): Response
    {
        $basket = $this->basket->summary($request);

        return Inertia::render('Kasse/Index', [
            'lines' => $basket['lines'],
            'totals' => $basket['totals'],
            'contact' => [
                'email' => config('rimify.contact.email'),
                'phone' => config('rimify.contact.phone'),
            ],
        ]);
    }
}
