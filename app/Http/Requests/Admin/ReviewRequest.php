<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ReviewFeedback;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The review kit (ReviewFeedbackPolicy; the route names the step): the board and the list are read,
 * a point is sent from the feedback button, and a point is answered. A point carries its own
 * context — URL, viewport, browser — and, when the browser could take one, a screenshot as a PNG
 * data URL, checked by its bytes before it is stored.
 */
class ReviewRequest extends FormRequest
{
    /** A screenshot of one screen, as PNG: a few hundred KB; anything near this is not one. */
    public const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $feedback = $this->route('feedback');

        if (! $user instanceof AdminUser) {
            return false;
        }

        return match ($this->step()) {
            'store' => $user->can('create', ReviewFeedback::class),
            'update' => $feedback instanceof ReviewFeedback && $user->can('update', $feedback),
            default => $user->can('viewAny', ReviewFeedback::class),
        };
    }

    protected function prepareForValidation(): void
    {
        foreach (['sentence', 'answer'] as $key) {
            $value = $this->input($key);

            if (is_string($value)) {
                $this->merge([$key => trim($value)]);
            }
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return match ($this->step()) {
            'store' => [
                'type' => ['required', Rule::in(array_keys(ReviewFeedback::TYPES))],
                'sentence' => ['required', 'string', 'min:3', 'max:2000'],
                'url' => ['required', 'string', 'max:500', 'starts_with:/admin'],
                'viewport' => ['required', 'string', 'max:32', 'regex:/^\d{2,5}×\d{2,5}$/u'],
                'browser' => ['required', 'string', 'max:120'],
                'screenshot' => ['nullable', 'string', 'max:'.(int) (self::MAX_SCREENSHOT_BYTES * 1.4)],
            ],
            'update' => [
                'status' => ['required', Rule::in(array_keys(ReviewFeedback::STATUSES))],
                'answer' => ['nullable', 'string', 'max:2000', Rule::requiredIf(fn (): bool => $this->input('status') === 'abgelehnt')],
                'assignee_id' => ['nullable', 'integer', Rule::exists('admin_users', 'id')],
            ],
            default => [
                'typ' => ['nullable', Rule::in(array_keys(ReviewFeedback::TYPES))],
                'seite' => ['nullable', 'string', 'max:120'],
                'status' => ['nullable', 'in:offen,alle,neu,angenommen,erledigt,abgelehnt'],
            ],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'type.*' => 'Bitte wähl, worum es geht: Fehler, Design, Text oder Wunsch.',
            'sentence.required' => 'Bitte schreib in einem Satz, was dir aufgefallen ist.',
            'sentence.min' => 'Bitte schreib in einem Satz, was dir aufgefallen ist.',
            'sentence.max' => 'Das ist mehr als ein Satz – höchstens 2.000 Zeichen.',
            'url.*' => 'Die Seite ließ sich nicht bestimmen. Lad sie bitte neu und versuch es noch einmal.',
            'viewport.*' => 'Die Fenstergröße ließ sich nicht bestimmen.',
            'browser.*' => 'Der Browser ließ sich nicht bestimmen.',
            'screenshot.*' => 'Das Bildschirmfoto ist zu groß. Schick die Rückmeldung bitte ohne.',
            'status.*' => 'Diesen Stand gibt es nicht.',
            'answer.required' => 'Wer ablehnt, sagt warum: Bitte schreib die Begründung.',
            'answer.max' => 'Die Antwort darf höchstens 2.000 Zeichen lang sein.',
            'assignee_id.*' => 'Dieses Konto gibt es nicht.',
            'typ.*' => 'Diese Art gibt es nicht.',
            'seite.*' => 'Diese Seite gibt es nicht.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->step() !== 'store' || $validator->errors()->has('screenshot')) {
                    return;
                }

                $shot = $this->input('screenshot');

                if (is_string($shot) && $shot !== '' && $this->screenshotBytes() === null) {
                    $validator->errors()->add('screenshot', 'Das Bildschirmfoto ließ sich nicht lesen. Schick die Rückmeldung bitte ohne.');
                }
            },
        ];
    }

    /** The screenshot as PNG bytes, or null when none was sent or it is not a PNG. */
    public function screenshotBytes(): ?string
    {
        $shot = $this->input('screenshot');

        if (! is_string($shot) || ! str_starts_with($shot, 'data:image/png;base64,')) {
            return null;
        }

        $bytes = base64_decode(substr($shot, strlen('data:image/png;base64,')), true);

        // The PNG signature, read from the bytes — never the label the browser put on them.
        return is_string($bytes) && strlen($bytes) <= self::MAX_SCREENSHOT_BYTES && str_starts_with($bytes, "\x89PNG\r\n\x1a\n") ? $bytes : null;
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
