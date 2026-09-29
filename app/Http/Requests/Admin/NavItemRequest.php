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
 * Creating or changing one menu entry. The target is a key from NavigationSchema::targets(), never
 * a URL typed in; the label's limit is the menu's; the phone bar needs a glyph; a menu never shows
 * more entries than it has room for; Impressum and Datenschutz stay as they are.
 */
class NavItemRequest extends FormRequest
{
    public const LOCKED_REFUSAL = 'Impressum und Datenschutz müssen auf jeder Seite erreichbar sein. Diesen Eintrag kannst du nur verschieben.';

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $item = $this->item();

        return $user instanceof AdminUser && ($item === null ? $user->can('create', NavItem::class) : $user->can('update', $item));
    }

    protected function prepareForValidation(): void
    {
        $label = $this->input('label');

        $this->merge([
            // An entry stays in its menu: moving between menus is a new entry, not an edit.
            'menu' => $this->item() !== null ? $this->item()->menu : $this->input('menu'),
            'label' => is_scalar($label) ? trim((string) $label) : '',
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $menu = NavigationSchema::MENUS[(string) $this->input('menu')] ?? null;

        return [
            'menu' => ['required', 'string', Rule::in(array_keys(NavigationSchema::MENUS))],
            'label' => ['required', 'string', 'max:'.($menu['max'] ?? 32)],
            'target' => ['required', 'string', Rule::in(array_keys(NavigationSchema::targets()))],
            'icon' => [($menu['icon'] ?? false) ? 'required' : 'nullable', 'string', Rule::in(array_keys(NavigationSchema::ICONS))],
            'visible' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $max = NavigationSchema::MENUS[(string) $this->input('menu')]['max'] ?? 32;

        return [
            'menu.required' => 'Bitte wähl das Menü.',
            'menu.in' => 'Bitte wähl das Menü.',
            'label.required' => 'Bitte gib dem Eintrag einen Namen.',
            'label.max' => 'In diesem Menü passen höchstens '.$max.' Zeichen.',
            'target.required' => 'Bitte wähl, wohin der Eintrag führt.',
            'target.in' => 'Bitte wähl ein Ziel aus der Liste.',
            'icon.required' => 'In der Handy-Leiste braucht jeder Eintrag ein Symbol.',
            'icon.in' => 'Bitte wähl ein Symbol aus der Liste.',
            'visible.required' => 'Bitte sag uns, ob der Eintrag zu sehen sein soll.',
            'visible.boolean' => 'Bitte sag uns, ob der Eintrag zu sehen sein soll.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $item = $this->item();

            if ($item !== null && NavigationSchema::isLocked($item)) {
                $unchanged = $this->input('label') === $item->label
                    && $this->input('target') === $item->targetKey()
                    && $this->boolean('visible');

                if (! $unchanged) {
                    $validator->errors()->add('target', self::LOCKED_REFUSAL);
                }
            }

            $menu = (string) $this->input('menu');
            $cap = NavigationSchema::MENUS[$menu]['maxVisible'] ?? null;

            if ($cap !== null && $this->boolean('visible')) {
                $visible = NavItem::query()->where('menu', $menu)->where('visible', true)
                    ->when($item !== null, fn ($query) => $query->whereKeyNot($item->id))
                    ->count();

                if ($visible >= $cap) {
                    $validator->errors()->add('visible', 'In der '.NavigationSchema::MENUS[$menu]['label'].' ist Platz für höchstens '.$cap.' sichtbare Einträge. Blende zuerst einen anderen aus.');
                }
            }
        });
    }

    /** @return array{menu: string, label: string, route_name: string|null, href: string|null, icon: string|null, visible: bool} */
    public function itemAttributes(): array
    {
        $columns = NavigationSchema::columns((string) $this->validated('target')) ?? ['route_name' => null, 'href' => null];
        $icon = $this->validated('icon');

        return [
            'menu' => (string) $this->validated('menu'),
            'label' => (string) $this->validated('label'),
            'route_name' => $columns['route_name'],
            'href' => $columns['href'],
            'icon' => is_string($icon) && $icon !== '' ? $icon : null,
            'visible' => (bool) $this->validated('visible'),
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    private function item(): ?NavItem
    {
        $item = $this->route('item');

        return $item instanceof NavItem ? $item : null;
    }
}
