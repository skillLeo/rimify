<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Storefront\Chrome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The FAQ, read from `faq_entries` so marketing can add an answer without a deployment.
 *
 * Grouped in the order the copy pack gives, because the first group answers the question this
 * audience actually arrives with: whether the wheel is legal on their car.
 */
class FaqController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $rows = DB::table('faq_entries')
            ->where('published', true)
            ->orderBy('group_key')
            ->orderBy('sort_order')
            ->get(['id', 'group_key', 'question_de', 'answer_de']);

        $groups = [];

        foreach ($rows as $row) {
            $key = (string) $row->group_key;

            if (! isset($groups[$key])) {
                $groups[$key] = ['key' => $key, 'entries' => []];
            }

            $groups[$key]['entries'][] = [
                'id' => (int) $row->id,
                'question' => (string) $row->question_de,
                'answer' => (string) $row->answer_de,
            ];
        }

        return Inertia::render('Faq/Index', [
            'groups' => array_values($groups),
            // The shared shape, whole: a page prop named `contact` replaces the shared one for the
            // header and the footer too. The phone is null until the client gives one, and the help
            // card then offers the e-mail.
            'contact' => Chrome::contact(),
        ]);
    }
}
