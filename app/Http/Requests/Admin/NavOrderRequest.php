<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\NavItem;
use App\Services\Content\NavigationSchema;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * One menu's whole order at once. Every entry of that menu, each once: a list that leaves one out
 * or names one twice is a page that was out of date, and it is refused rather than half applied.
 */
class NavOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('reorder', NavItem::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'menu' => ['required', 'string', Rule::in(array_keys(NavigationSchema::MENUS))],
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $posted = array_map('intval', (array) $this->input('ids', []));
            $known = NavItem::query()->where('menu', (string) $this->input('menu'))->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();

            sort($posted);
            sort($known);

            if ($posted !== $known) {
                $validator->errors()->add('ids', 'Das Menü war nicht mehr aktuell. Bitte lade die Seite neu und versuch es noch einmal.');
            }
        });
    }

    public function menu(): string
    {
        return (string) $this->validated('menu');
    }

    /** @return list<int> */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids')));
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
