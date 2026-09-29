<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\FaqEntry;
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
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'group_key', 'question_de', 'answer_de']);

        // The groups in their fixed order (FaqEntry::GROUPS) — not alphabetical, which put
        // „Bestellung & Versand" first — and any other group after them.
        $groups = [];

        foreach (FaqEntry::GROUPS as $key) {
            $groups[$key] = ['key' => $key, 'entries' => []];
        }

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
            // A group with nothing visible is not a heading over an empty list.
            'groups' => array_values(array_filter($groups, static fn (array $group): bool => $group['entries'] !== [])),
            // The shared shape, whole: a page prop named `contact` replaces the shared one for the
            // header and the footer too. The phone is null until the client gives one, and the help
            // card then offers the e-mail.
            'contact' => Chrome::contact(),
        ]);
    }
}
