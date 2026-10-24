<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Content\LegalTexts;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A legal text's placeholder flag, switched (D-319, the operator's brief of 23.10.2026). Who may publish the page may
 * switch it (R-11, PagePolicy::publish). `part` is the page's own text, or — on the Widerrufsbelehrung only — the
 * Muster-Widerrufsformular, whose words are the statute's and have no page of their own.
 *
 * Switching the text's flag off makes the live words what visitors read and lifts a lock on search and live payments,
 * so it is refused while those words are still the seeder's marker: the flag never says „real“ over a placeholder.
 */
class LegalPlaceholderRequest extends FormRequest
{
    public const TEXT = 'text';

    public const FORM = 'formular';

    public const FORM_ELSEWHERE = 'Den Platzhalter des Muster-Widerrufsformulars schaltest du auf der Seite „Widerrufsbelehrung“.';

    public const MARKER_LEFT = 'Im veröffentlichten Text steht noch „[Rechtstext folgt von der Kanzlei …]“. Ersetz das in jedem Abschnitt durch den Text der Kanzlei, veröffentliche die Seite und schalte den Platzhalter danach aus.';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('publish', $this->page());
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'part' => ['required', 'string', 'in:'.self::TEXT.','.self::FORM],
            'placeholder' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'part.*' => 'Diesen Teil der Seite gibt es nicht. Bitte lade die Seite neu und versuch es noch einmal.',
            'placeholder.*' => 'Ob der Platzhalter an oder aus sein soll, ist nicht angekommen. Bitte lade die Seite neu und versuch es noch einmal.',
        ];
    }

    /** @return list<Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $page = $this->page();

            if ($this->part() === self::FORM && $page->slug !== 'widerrufsbelehrung') {
                $validator->errors()->add('part', self::FORM_ELSEWHERE);

                return;
            }

            if ($this->part() === self::TEXT && ! $this->placeholder() && app(LegalTexts::class)->markerLeft($page->slug)) {
                $validator->errors()->add('placeholder', self::MARKER_LEFT);
            }
        }];
    }

    public function page(): Page
    {
        $page = $this->route('page');
        $page = $page instanceof Page ? $page : Page::query()->findOrFail($page);
        abort_unless($page->kind === Page::KIND_LEGAL, 404);

        return $page;
    }

    public function part(): string
    {
        return $this->input('part') === self::FORM ? self::FORM : self::TEXT;
    }

    public function placeholder(): bool
    {
        return filter_var($this->input('placeholder'), FILTER_VALIDATE_BOOL);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
