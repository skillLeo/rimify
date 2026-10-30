<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\ShelfPicks;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The homepage shelf's picks (the client's #5, D-353): up to eight rims on sale, each a model in one colour, each once,
 * in the order given. An empty slot is no pick.
 */
class ShelfPicksRequest extends FormRequest
{
    /** @var array<string, string>|null every card on sale, key → name */
    private ?array $available = null;

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('pickShelf', Page::class);
    }

    protected function prepareForValidation(): void
    {
        $picks = $this->input('picks');

        $this->merge(['picks' => array_values(array_filter(is_array($picks) ? $picks : [], static fn (mixed $pick): bool => $pick !== null && $pick !== ''))]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'picks' => ['present', 'array', 'max:'.ShelfPicks::SIZE],
            'picks.*' => ['required', 'string', 'distinct', Rule::in(array_keys($this->available()))],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'picks.max' => 'Höchstens '.ShelfPicks::SIZE.' Felgen – so viele zeigt der Bereich.',
            'picks.*.distinct' => 'Jede Felge nur einmal: Sie stünde sonst zweimal im Bereich.',
            'picks.*.in' => 'Diese Felge ist nicht mehr im Shop. Lade die Seite neu und wähl eine andere.',
            'picks.*.required' => 'Wähl eine Felge oder lass den Platz leer.',
            'picks.*.string' => 'Wähl eine Felge oder lass den Platz leer.',
        ];
    }

    /** @return list<string> */
    public function picks(): array
    {
        /** @var list<string> */
        return array_values($this->validated('picks'));
    }

    /** @return array<string, string> key → the rim's name */
    public function labels(): array
    {
        return $this->available();
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /** @return array<string, string> */
    private function available(): array
    {
        return $this->available ??= self::cards(app(ProductCards::class));
    }

    /**
     * Every card the shop sells, key → „Marke Modell · Farbe“ — what a pick may be.
     *
     * @return array<string, string>
     */
    public static function cards(ProductCards $cards): array
    {
        $out = [];

        foreach ($cards->catalogue(limit: null, options: ['order' => 'newest']) as $card) {
            $out[(string) $card['compareKey']] = trim($card['brandName'].' '.$card['modelName']).' · '.$card['finishName'];
        }

        return $out;
    }
}
