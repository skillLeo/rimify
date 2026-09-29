<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One entry of a storefront menu (Chrome::menus). Its target is either a named shop route or the
 * path of a page Inhalte › Seiten edits — never free text (NavigationSchema).
 *
 * @property int $id
 * @property string $menu
 * @property string $label
 * @property string|null $href
 * @property string|null $route_name
 * @property string|null $behaviour
 * @property string|null $icon
 * @property int $sort_order
 * @property bool $visible
 * @property Carbon|null $team_edited_at
 */
class NavItem extends Model
{
    protected $fillable = ['menu', 'label', 'href', 'route_name', 'behaviour', 'icon', 'sort_order', 'visible', 'team_edited_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'visible' => 'boolean',
            'team_edited_at' => 'datetime',
        ];
    }

    /** The target as the editor names it: `route:felgen.index` or `page:/rechtliches/agb`. */
    public function targetKey(): string
    {
        if (is_string($this->route_name) && $this->route_name !== '') {
            return 'route:'.$this->route_name;
        }

        return 'page:'.($this->href ?? '');
    }
}
