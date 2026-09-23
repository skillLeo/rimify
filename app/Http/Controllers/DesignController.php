<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Storefront\ProductCards;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The design specimen (/__design): registered in local and test environments only.
 *
 * It renders real catalogue rows through the same components the shop uses, so what is approved
 * here is what the customer gets — not a mock with hand-written data.
 */
class DesignController extends Controller
{
    public function __construct(private readonly ProductCards $cards) {}

    public function __invoke(): Response
    {
        return Inertia::render('Design/Index', [
            'cards' => $this->cards->catalogue(limit: 4),
        ]);
    }
}
