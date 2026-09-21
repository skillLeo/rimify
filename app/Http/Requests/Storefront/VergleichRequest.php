<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The comparison's query: `f`, a comma list of `modelId:finishId` pairs, at most four.
 *
 * The shape is validated strictly so the service downstream never parses free text (R-14 in
 * spirit: only integers reach a query). A malformed link is not an error page for a browser —
 * it lands on the empty comparison — while a client that asks for JSON gets the 422 it expects.
 *
 * Public storefront read: there is nothing to authorise, and the storefront gate has no policy
 * for a page every visitor may open.
 */
final class VergleichRequest extends FormRequest
{
    public const CAP = 4;

    /** A malformed link lands on the empty comparison, never on an error page. */
    protected $redirect = '/vergleich';

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'f' => [
                'nullable',
                'string',
                'max:100',
                // One to four `id:id` pairs, comma separated, digits only.
                'regex:/^\d{1,10}:\d{1,10}(?:,\d{1,10}:\d{1,10}){0,3}$/',
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'f.regex' => 'Der Vergleich nimmt bis zu vier Felgen als Paare aus Modell- und Ausführungsnummer an.',
            'f.max' => 'Der Vergleich nimmt bis zu vier Felgen an.',
        ];
    }

    /**
     * The pairs, in the order given, without repeats.
     *
     * @return list<array{0: int, 1: int}>
     */
    public function pairs(): array
    {
        $raw = $this->validated('f');

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $pairs = [];
        $seen = [];

        foreach (explode(',', $raw) as $pair) {
            [$modelId, $finishId] = explode(':', $pair, 2);
            $key = ((int) $modelId).':'.((int) $finishId);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $pairs[] = [(int) $modelId, (int) $finishId];
        }

        return $pairs;
    }
}
