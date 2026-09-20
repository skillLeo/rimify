<?php

declare(strict_types=1);

namespace App\Support\Design;

/**
 * Which prototype screen a route corresponds to.
 *
 * The prototype puts its screen name on `<body data-page="...">`, and `shared/app.js` reads it to
 * decide the header state, the active navigation item and which page builder to run. The name is
 * therefore not decoration — it is the switch the entire runtime turns on, and a page that ships
 * without it renders the Startseite chrome whatever it actually is.
 *
 * Route names are the stable identifier (see routes/web.php), so the mapping is keyed on them
 * rather than on paths.
 */
final class PrototypePage
{
    /**
     * Route name → the prototype's own file name under `design-reference/{desktop,mobile}/`.
     *
     * @var array<string, string>
     */
    private const MAP = [
        'startseite' => 'startseite',
        'felgen.suchen' => 'felgen-suchen',
        'felgen.index' => 'felgen',
        'felgen.show' => 'produkt',
        'check.index' => 'rimify-check',
        'check.ergebnis' => 'check-ergebnis',
        'warenkorb.index' => 'warenkorb',
        'kasse.index' => 'kasse',
        'bestellung.show' => 'bestellung',
        'faq' => 'faq',
        'kontakt' => 'kontakt',
        'rechtliches' => 'rechtliches',
        'admin.anmelden' => 'admin-anmelden',
        'admin.dashboard' => 'admin-dashboard',
        'admin.gutachten.index' => 'admin-gutachten',
        'admin.rollen.index' => 'admin-rollen',
    ];

    /**
     * The screen name for a route, or '404' when there is none.
     *
     * '404' is the honest default rather than 'startseite': an unmapped route is a page we have
     * no design for, and the prototype has a real 404 screen for exactly that. Falling back to the
     * Startseite would dress an unknown page in the home page's chrome and hide the gap.
     */
    public static function forRoute(?string $routeName): string
    {
        return self::MAP[$routeName] ?? '404';
    }

    /**
     * Inertia page component → the prototype's screen name.
     *
     * The route table above cannot answer for an error page: a 404 is thrown during routing, so
     * there is no matched route and none of the web middleware — including the one that shares
     * `designPage` — has run. The response still renders through app.blade.php, which without
     * this would fall back to 'startseite' and dress the error page in the home page's chrome.
     *
     * @var array<string, string>
     */
    private const COMPONENTS = [
        'Startseite/Index' => 'startseite',
        'FelgenSuchen/Index' => 'felgen-suchen',
        'Felgen/Index' => 'felgen',
        'Produkt/Index' => 'produkt',
        'Check/Index' => 'rimify-check',
        'CheckErgebnis/Index' => 'check-ergebnis',
        'Warenkorb/Index' => 'warenkorb',
        'Kasse/Index' => 'kasse',
        'Bestellung/Index' => 'bestellung',
        'Faq/Index' => 'faq',
        'Kontakt/Index' => 'kontakt',
        'Rechtliches/Index' => 'rechtliches',
        'Fehler/Index' => '404',
        'Admin/Anmelden/Index' => 'admin-anmelden',
        'Admin/Dashboard/Index' => 'admin-dashboard',
        'Admin/Gutachten/Index' => 'admin-gutachten',
        'Admin/Rollen/Index' => 'admin-rollen',
    ];

    /**
     * The screen name for an Inertia component, or '404' when it is not one we know.
     *
     * Same reasoning as `forRoute()`: an unrecognised component is a page we have no design for,
     * and the prototype has a screen for exactly that.
     */
    public static function forComponent(?string $component): string
    {
        return self::COMPONENTS[$component] ?? '404';
    }

    /** @return array<string, string> */
    public static function all(): array
    {
        return self::MAP;
    }
}
