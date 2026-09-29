<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Support\Seller;
use App\Support\WithdrawalForm;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Muster-Widerrufsformular (Art. 246a § 1 Abs. 2 EGBGB), linked from the checkout, the Widerrufsbelehrung and the
 * order mail. The statute's text, verbatim (WithdrawalForm); a page to print or copy from.
 */
class WiderrufsformularController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Rechtliches/Widerrufsformular', [
            'title' => WithdrawalForm::TITLE,
            'intro' => WithdrawalForm::INTRO,
            'addressee' => WithdrawalForm::addressee(Seller::current()),
            'fields' => WithdrawalForm::FIELDS,
            'footnote' => WithdrawalForm::FOOTNOTE,
        ]);
    }
}
