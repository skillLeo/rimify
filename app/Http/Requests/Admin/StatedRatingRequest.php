<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Stars typed for one rim (#19, D-344): the rating from 1,0 to 5,0 with one decimal at most, the number of reviews behind
 * it, and the sentence that says where they come from — all three, or nothing is saved. The shop has checked none of
 * them, so the sentence may not say it has (§ 5 and § 5b Abs. 3 UWG): a word claiming a check is refused, unless the
 * sentence denies it („von uns nicht geprüft“).
 *
 * Its policy check is WheelModelPolicy::rate — the stars go straight into the shop. Taking them off asks the same.
 */
class StatedRatingRequest extends FormRequest
{
    public const CLAIM_REFUSED = 'Der Satz darf keine Prüfung behaupten – diese Sterne hat der Shop nicht geprüft. Nenne nur, woher sie stammen.';

    /** A word that says the reviews were checked, confirmed or are genuine — matched on the lower-cased word's start. */
    private const CLAIM_WORD = '/^(?:verifiz|zertifiz|geprüft|geprueft|überprüft|ueberprueft|kontrolliert|bestätigt|bestaetigt|authentisch|echt)/u';

    /** A word that turns the claim after it into its denial, within three words. */
    private const DENIAL = ['nicht', 'nie', 'kein', 'keine', 'keinen', 'keiner', 'ohne'];

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        return $user instanceof AdminUser && $model instanceof WheelModel && $user->can('rate', $model);
    }

    protected function prepareForValidation(): void
    {
        if ($this->isMethod('delete')) {
            return;
        }

        $rating = $this->input('rating');
        $count = $this->input('count');
        $origin = $this->input('origin');

        $this->merge([
            // „4,9“ the German way, „4.9“ as well.
            'rating' => is_string($rating) ? str_replace(',', '.', trim($rating)) : $rating,
            // „1.234“ with a thousands point or a space.
            'count' => is_string($count) ? (string) preg_replace('/[\s\x{00A0}\x{202F}.]/u', '', $count) : $count,
            // One line: the sentence stands beside the stars.
            'origin' => is_string($origin) ? trim((string) preg_replace('/\s+/u', ' ', $origin)) : $origin,
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        if ($this->isMethod('delete')) {
            return [];
        }

        return [
            'rating' => ['required', 'regex:/^[1-5](\.\d)?$/', 'numeric', 'between:1,5'],
            'count' => ['required', 'regex:/^\d{1,7}$/', 'integer', 'min:1'],
            'origin' => [
                'required',
                'string',
                'min:12',
                'max:200',
                static function (string $attribute, mixed $value, Closure $fail): void {
                    if (is_string($value) && self::claimsCheck($value)) {
                        $fail(self::CLAIM_REFUSED);
                    }
                },
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'rating.required' => 'Trag die Sterne ein, etwa 4,8.',
            'rating.*' => 'Die Sterne gehen von 1,0 bis 5,0, mit höchstens einer Stelle nach dem Komma – etwa 4,8.',
            'count.required' => 'Trag ein, auf wie vielen Bewertungen die Sterne beruhen.',
            'count.*' => 'Die Zahl der Bewertungen ist eine ganze Zahl ab 1.',
            'origin.required' => 'Ohne den Satz, woher die Bewertungen stammen, zeigt der Shop keine Sterne.',
            'origin.min' => 'Sag in einem ganzen Satz, woher die Bewertungen stammen – etwa „Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.“',
            'origin.max' => 'Der Satz darf höchstens 200 Zeichen lang sein.',
            'origin.string' => 'Sag in einem ganzen Satz, woher die Bewertungen stammen.',
        ];
    }

    /** Whether the sentence says the reviews were checked: a claim word with no denial in the three words before it. */
    public static function claimsCheck(string $sentence): bool
    {
        $words = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($sentence), -1, PREG_SPLIT_NO_EMPTY);
        $words = $words === false ? [] : $words;

        foreach ($words as $i => $word) {
            if (preg_match(self::CLAIM_WORD, $word) !== 1) {
                continue;
            }

            if (array_intersect(array_slice($words, max(0, $i - 3), min(3, $i)), self::DENIAL) === []) {
                return true;
            }
        }

        return false;
    }

    public function rating(): float
    {
        return round((float) $this->validated('rating'), 1);
    }

    public function count(): int
    {
        return (int) $this->validated('count');
    }

    public function origin(): string
    {
        return (string) $this->validated('origin');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
