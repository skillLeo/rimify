<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Review;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Hiding, showing or answering a buyer's review (Verkauf › Bewertungen, D-103), through ReviewPolicy::moderate. Hiding
 * asks why — the reason stays with the review and goes to the Protokoll; an answer is at most 1.000 characters and
 * empty takes it away. Which of the three is meant is the route's.
 */
class ReviewModerationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $review = $this->route('review');

        return $user instanceof AdminUser && $review instanceof Review && $user->can('moderate', $review);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return match ($this->route()?->getName()) {
            'admin.bewertungen.ausblenden' => ['reason' => ['required', 'string', 'min:3', 'max:500']],
            'admin.bewertungen.antwort' => ['reply' => ['nullable', 'string', 'max:1000']],
            default => [],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reason.required' => 'Schreib dazu, warum die Bewertung ausgeblendet wird – der Grund bleibt bei ihr.',
            'reason.min' => 'Schreib dazu, warum die Bewertung ausgeblendet wird – der Grund bleibt bei ihr.',
            'reason.max' => 'Der Grund darf höchstens 500 Zeichen lang sein.',
            'reply.max' => 'Die Antwort darf höchstens 1.000 Zeichen lang sein.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    public function reason(): string
    {
        return trim((string) $this->validated('reason'));
    }

    public function reply(): ?string
    {
        $reply = $this->validated('reply');

        return is_string($reply) ? $reply : null;
    }
}
