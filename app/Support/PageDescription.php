<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\WheelModel;
use Illuminate\Http\Request;

/**
 * The search description of the shop's public pages, decided on the server in one place (the pre-launch audit of 22.11.2026,
 * B2 line 6, D-511): fifteen of twenty-two pages carried none. A page that writes its own (Startseite, Felgenrechner, the Ratgeber
 * and the Blog) is not named here, so the head never holds two. Our own sentences about what the shop does — never a claim about what
 * a document contains (R-17).
 */
final class PageDescription
{
    /** @var array<string, string> route name → description */
    private const FIXED = [
        'felgen.index' => 'Alufelgen für dein Auto: Wähl dein Fahrzeug, und RIMIFY zeigt dir die Felgen, für die uns eine Freigabe für genau dieses Fahrzeug vorliegt.',
        'felgen.suchen' => 'Fahrzeug wählen – über HSN und TSN aus dem Fahrzeugschein oder über Hersteller und Modell. Danach siehst du nur passende Felgen mit Freigabe.',
        'check.index' => 'Der RIMIFY-Check: Prüf für dein Fahrzeug, ob eine Felge laut Gutachten darf, mit welchen Reifen und unter welchen Auflagen.',
        'komplettrad.show' => 'Komplettrad zusammenstellen: Felge, Reifen in einer freigegebenen Größe, Montage und Auswuchten – fertig zum Anschrauben.',
        'faq' => 'Antworten auf häufige Fragen zu Felgen, Gutachten, Eintragung, Komplettrad, Versand und Rückgabe bei RIMIFY.',
        'kontakt' => 'Frag uns zu Felgen, Gutachten oder deiner Bestellung – per Kontaktformular oder E-Mail.',
    ];

    /** @var array<string, string> a legal page's slug → its description */
    private const LEGAL = [
        'impressum' => 'Impressum von RIMIFY: Anbieter, Anschrift und Kontakt.',
        'datenschutz' => 'Datenschutzerklärung von RIMIFY: welche Daten der Shop verarbeitet, wozu und welche Rechte du hast.',
        'agb' => 'Allgemeine Geschäftsbedingungen von RIMIFY für den Kauf von Felgen, Reifen und Kompletträdern.',
        'widerrufsbelehrung' => 'Widerrufsbelehrung von RIMIFY: wie du einen Kauf widerrufst und was dann gilt.',
        'versand' => 'Versand bei RIMIFY: Kosten, Lieferzeit und wohin wir liefern.',
    ];

    public static function for(Request $request): ?string
    {
        $route = $request->route();
        $name = $route?->getName();

        if ($name === null) {
            return null;
        }

        if ($name === 'felgen.show') {
            return self::wheel((string) $route->parameter('model'));
        }

        if ($name === 'rechtliches') {
            return self::LEGAL[(string) ($route->parameter('slug') ?? 'impressum')] ?? null;
        }

        return self::FIXED[$name] ?? null;
    }

    /** The model's own, where the admin wrote one (`seo_description`); otherwise ours, from its name. */
    private static function wheel(string $slug): ?string
    {
        $model = WheelModel::query()->with('brand:id,name')->where('slug', $slug)->first(['id', 'brand_id', 'name', 'seo_description']);

        if ($model === null) {
            return null;
        }

        $own = trim((string) $model->seo_description);

        if ($own !== '') {
            return $own;
        }

        $name = trim(($model->brand->name ?? '').' '.$model->name);

        return "{$name}: als Felge oder Komplettrad. Wähl dein Fahrzeug, und RIMIFY zeigt dir, ob und mit welchen Reifen sie laut Gutachten passt.";
    }
}
