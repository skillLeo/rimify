<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\NavItem;
use App\Models\Page;
use Illuminate\Support\Facades\Route;

/**
 * The storefront's five menus as the Inhalte › Navigation editor knows them: what each is called,
 * how long a label may be, how many entries it can show, where an entry may point, and the two
 * entries that must never disappear (docs/admin/inhalte-build-plan.md, "Navigation").
 *
 * A target is never free text. It is a named shop route from the list below or the path of a page
 * the team edits in Inhalte › Seiten, so no menu can link off the shop, to a `javascript:` URL or
 * to a page that does not exist.
 *
 * @phpstan-type Menu array{key: string, label: string, max: int, maxVisible: int|null, icon: bool}
 */
final class NavigationSchema
{
    /** @var array<string, array{label: string, max: int, maxVisible: int|null, icon: bool}> */
    public const MENUS = [
        'header' => ['label' => 'Kopfzeile', 'max' => 20, 'maxVisible' => 6, 'icon' => false],
        'footer_shop' => ['label' => 'Fußzeile · Shop', 'max' => 32, 'maxVisible' => null, 'icon' => false],
        'footer_service' => ['label' => 'Fußzeile · Service', 'max' => 32, 'maxVisible' => null, 'icon' => false],
        'footer_legal' => ['label' => 'Fußzeile · Rechtliches', 'max' => 32, 'maxVisible' => null, 'icon' => false],
        // Five tabs share 390 px: a label is a word, and every tab needs its glyph.
        'mobile_bottom' => ['label' => 'Handy-Leiste unten', 'max' => 12, 'maxVisible' => 5, 'icon' => true],
    ];

    /** The shop's own pages an entry may lead to, by route name, with the name a person uses. */
    public const ROUTES = [
        'startseite' => 'Startseite',
        'felgen.index' => 'Alle Felgen',
        'felgen.suchen' => 'Fahrzeug wählen',
        'check.index' => 'RIMIFY-Check',
        'felgenrechner.index' => 'Felgenrechner',
        'vergleich.index' => 'Vergleich',
        'faq' => 'Fragen und Antworten',
        'kontakt' => 'Kontakt',
        'warenkorb.index' => 'Warenkorb',
    ];

    /** The glyphs the phone's bottom bar can carry, from the storefront's own set. */
    public const ICONS = [
        'home' => 'Haus',
        'wheel' => 'Felge',
        'check-circle' => 'Haken im Kreis',
        'search' => 'Lupe',
        'car' => 'Auto',
        'cart' => 'Warenkorb',
        'mail' => 'Brief',
        'info' => 'Info',
        'document' => 'Dokument',
    ];

    /**
     * Impressum and Datenschutz are reachable from every page (DDG §5, DSGVO Art. 13): their footer
     * entries cannot be hidden, renamed, pointed elsewhere or deleted. Keyed by the path they lead to.
     */
    public const LOCKED = ['/rechtliches/impressum', '/rechtliches/datenschutz'];

    public static function isLocked(NavItem $item): bool
    {
        return $item->menu === 'footer_legal' && in_array($item->href, self::LOCKED, true);
    }

    /**
     * Every target the editor offers: the shop's pages, then the pages the team edits.
     *
     * @return array<string, string> target key => label
     */
    public static function targets(): array
    {
        $targets = [];

        foreach (self::ROUTES as $route => $label) {
            if (Route::has($route)) {
                $targets['route:'.$route] = $label;
            }
        }

        foreach (Page::query()->editable()->orderBy('kind')->orderBy('id')->get() as $page) {
            // An article that is not on the shop is no target: the entry would lead to a missing
            // page on every page. (Withdrawing one a menu still links to is refused for the same reason.)
            if ($page->slug === Page::HOME_SLUG || ! $page->isPublished()) {
                continue;
            }

            $targets['page:'.$page->href()] = ($page->kind === Page::KIND_GUIDE ? 'Ratgeber: ' : 'Rechtliches: ').$page->title;
        }

        return $targets;
    }

    /**
     * The target's label for an entry, or the raw value when it is outside the list — shown, so a
     * seeded link the list does not know is visible rather than silently replaced.
     */
    public static function targetLabel(NavItem $item): string
    {
        return self::targets()[$item->targetKey()] ?? ($item->href ?? $item->route_name ?? '–');
    }

    /**
     * The columns a target key stands for, or null when it is not one the editor offers.
     *
     * @return array{route_name: string|null, href: string|null}|null
     */
    public static function columns(string $key): ?array
    {
        if (! array_key_exists($key, self::targets())) {
            return null;
        }

        return str_starts_with($key, 'route:')
            ? ['route_name' => substr($key, 6), 'href' => null]
            : ['route_name' => null, 'href' => substr($key, 5)];
    }
}
