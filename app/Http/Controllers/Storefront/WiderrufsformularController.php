<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Content\LegalTexts;
use App\Support\Seller;
use App\Support\WithdrawalForm;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Muster-Widerrufsformular (Art. 246a § 1 Abs. 2 EGBGB), linked from the checkout, the Widerrufsbelehrung and the
 * order mail. The statute's text, verbatim (WithdrawalForm); a page to print or copy from — once its placeholder flag is
 * off (D-319). Until then the page holds the one notice and nothing that reads like the form.
 */
class WiderrufsformularController extends Controller
{
    public function __invoke(LegalTexts $legal): Response
    {
        if ($legal->placeholder(LegalTexts::FORM)) {
            return Inertia::render('Rechtliches/Widerrufsformular', [
                'title' => WithdrawalForm::TITLE,
                'placeholder' => true,
                'notice' => LegalTexts::NOTICE,
                'intro' => null,
                'addressee' => null,
                'fields' => [],
                'footnote' => null,
            ]);
        }

        return Inertia::render('Rechtliches/Widerrufsformular', [
            'title' => WithdrawalForm::TITLE,
            'placeholder' => false,
            'notice' => null,
            'intro' => WithdrawalForm::INTRO,
            'addressee' => WithdrawalForm::addressee(Seller::current()),
            'fields' => WithdrawalForm::FIELDS,
            'footnote' => WithdrawalForm::FOOTNOTE,
        ]);
    }
}
