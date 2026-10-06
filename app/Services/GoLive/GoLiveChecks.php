<?php

declare(strict_types=1);

namespace App\Services\GoLive;

use App\Enums\CatalogueStatus;
use App\Enums\VehicleSource;
use App\Models\ApprovalDocument;
use App\Models\Brand;
use App\Models\Page;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelModel;
use App\Payments\PaymentConfig;
use App\Payments\Payments;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\InvoiceSeries;
use App\Services\Content\LegalTexts;
use App\Services\Demo\DemoTables;
use App\Services\Reset\TestEnvironment;
use App\Services\Smoke\PrivateFilesProbe;
use App\Support\ScheduleBeat;
use App\Support\Seller;
use App\Support\Shipping;
use App\Support\Ssr\BoundedSsrGateway;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * What the live shop still needs, check by check (the operator's brief of 05.10.2026, §7) — read from the state it is
 * in now, never written down by hand: the seller's data, the pages' texts, the catalogue and its Gutachten, the payment
 * keys, the server. Four groups, each check owned by us, the client or the host. rimify:go-live-check prints it and
 * writes docs/review/WAS-FEHLT.md; System › Was fehlt shows it in the admin; while a check of „Recht und
 * Pflichtangaben" fails, the shop takes no real payment (liveRefusal).
 */
final class GoLiveChecks
{
    public const LEGAL = 'Recht und Pflichtangaben';

    public const WHEEL = 'Recht am Rad';

    public const PAYMENT = 'Zahlung';

    public const OPERATIONS = 'Betrieb und Sicherheit';

    public const GROUPS = [self::LEGAL, self::WHEEL, self::PAYMENT, self::OPERATIONS];

    /** What a customer is told when live payment is refused: it names no check — those are for the admin. */
    public const LIVE_REFUSAL = 'Bestellen ist gerade nicht möglich. Es wird nichts abgebucht. Schreib uns – wir melden uns bei dir.';

    /** The legal forms that are entered in a register and, but for the e. K., act through a named representative. */
    private const REGISTERED = '/\b(GmbH|gGmbH|UG|AG|SE|KGaA|KG|OHG|eG|e\.\s?K\.?|e\.\s?Kfm\.?|e\.\s?Kfr\.?)(\s|$|\b)/u';

    private const SOLE_REGISTERED = '/\be\.\s?(K|Kfm|Kfr)\.?(\s|$|\b)/u';

    /**
     * The 27 member states of the EU, nothing else — a server in the UK or an EEA state is not in it. Only Germany passes
     * the server's place (D-181); the list lets the sentence say whether another place is at least in the EU.
     */
    private const EU = ['at', 'be', 'bg', 'cy', 'cz', 'de', 'dk', 'ee', 'es', 'fi', 'fr', 'gr', 'hr', 'hu', 'ie', 'it', 'lt', 'lu', 'lv', 'mt', 'nl', 'pl', 'pt', 'ro', 'se', 'si', 'sk'];

    public function __construct(private readonly LegalTexts $legal, private readonly PrivateFilesProbe $privateFiles) {}

    /**
     * Every check, in the order the report gives them. `$network` false leaves out what asks the shop's own address
     * over HTTP — a page request must not wait on a request to its own server; the command and rimify:smoke ask it.
     *
     * @return list<GoLiveCheck>
     */
    public function all(bool $network = true): array
    {
        return [...$this->legalChecks(), ...$this->wheelChecks(), ...$this->paymentChecks(), ...$this->operationsChecks($network)];
    }

    /** @return list<GoLiveCheck> */
    public function legalChecks(): array
    {
        return [
            $this->impressum(),
            $this->legalPage('agb', 'AGB', 'Die AGB sind noch ein Platzhalter: Der Text der Kanzlei fehlt.', 'Die AGB stehen im Shop, im Wortlaut der Kanzlei.'),
            $this->withdrawal(),
            $this->legalPage('datenschutz', 'Datenschutzerklärung', 'Die Datenschutzerklärung ist noch ein Platzhalter: Der Text der Kanzlei fehlt.', 'Die Datenschutzerklärung steht im Shop, im Wortlaut der Kanzlei.'),
            $this->shipping(),
            $this->vat(),
            $this->invoiceFields(),
            $this->orderButton(),
            $this->confirmation(),
            $this->cookies(),
            $this->gpsr(),
            $this->accessibility(),
            $this->reviews(),
        ];
    }

    /**
     * The checks of „Recht und Pflichtangaben" that are not met: while there is one, no real payment is taken. Null
     * where the shop takes none anyway, or only test payments.
     *
     * @return list<GoLiveCheck>|null
     */
    public function liveRefusal(): ?array
    {
        if (config('rimify.payments.driver') !== 'stripe' || PaymentConfig::current()->testMode()) {
            return null;
        }

        $failing = array_values(array_filter($this->legalChecks(), static fn (GoLiveCheck $c): bool => ! $c->ok()));

        return $failing === [] ? null : $failing;
    }

    /**
     * `21 von 30 erfüllt · 3 bei uns · 5 beim Kunden · 1 beim Host` — then what cannot be checked from here.
     *
     * @param  list<GoLiveCheck>  $checks
     */
    public static function countLine(array $checks): string
    {
        $missing = static fn (string $owner): int => count(array_filter($checks, static fn (GoLiveCheck $c): bool => $c->missing() && $c->owner === $owner));
        $ok = count(array_filter($checks, static fn (GoLiveCheck $c): bool => $c->ok()));
        $unchecked = count(array_filter($checks, static fn (GoLiveCheck $c): bool => $c->state === GoLiveCheck::UNCHECKABLE));

        return implode(' · ', array_filter([
            sprintf('%d von %d erfüllt', $ok, count($checks)),
            sprintf('%d bei uns', $missing(GoLiveCheck::US)),
            sprintf('%d beim Kunden', $missing(GoLiveCheck::CLIENT)),
            $missing(GoLiveCheck::HOST) > 0 ? sprintf('%d beim Host', $missing(GoLiveCheck::HOST)) : null,
            $unchecked > 0 ? sprintf('%d nicht prüfbar', $unchecked) : null,
        ]));
    }

    // ── Recht und Pflichtangaben ─────────────────────────────────────────────────────────────────────────────────

    /** § 5 DDG: who sells, where, who represents them, the register, the USt-IdNr., a fast way to write. */
    private function impressum(): GoLiveCheck
    {
        $seller = Seller::stored();
        $place = '/admin/einstellungen/verkaeufer-versand';

        if ($seller->placeholder) {
            return $this->check('impressum', self::LEGAL, 'Impressum (§ 5 DDG)', GoLiveCheck::CLIENT, GoLiveCheck::MISSING, 'Die Verkäuferangaben sind noch Platzhalter: Name, Anschrift, Vertretung, Register und Umsatzsteuer-Identifikationsnummer fehlen.', $place);
        }

        $registered = $seller->name !== null && preg_match(self::REGISTERED, $seller->name) === 1;
        $missing = array_keys(array_filter([
            'Name des Unternehmens' => $seller->name === null,
            'Anschrift' => $seller->street === null || $seller->zip === null || $seller->city === null,
            'Vertretungsberechtigte' => $registered && preg_match(self::SOLE_REGISTERED, (string) $seller->name) !== 1 && $seller->managingDirector === null,
            'Registergericht und -nummer' => $registered && $seller->register === null,
            'Umsatzsteuer-Identifikationsnummer' => $seller->vatId === null,
            'E-Mail-Adresse' => $seller->email === null,
            'Text der Kanzlei' => $this->legal->placeholder('impressum'),
        ]));

        if ($missing !== []) {
            return $this->check('impressum', self::LEGAL, 'Impressum (§ 5 DDG)', GoLiveCheck::CLIENT, GoLiveCheck::MISSING, 'Im Impressum fehlen: '.implode(', ', $missing).'.', $place);
        }

        return $this->check('impressum', self::LEGAL, 'Impressum (§ 5 DDG)', GoLiveCheck::CLIENT, GoLiveCheck::OK, 'Name, Anschrift, Umsatzsteuer-Identifikationsnummer und E-Mail stehen im Impressum; Vertretung und Register ebenso, wo die Rechtsform sie verlangt.'
            .($seller->phone === null ? ' Eine Telefonnummer ist nicht angegeben; der zweite schnelle Kontaktweg ist das Kontaktformular.' : ''), $place);
    }

    /** A legal page: there, published, and the Kanzlei's text rather than the seeded placeholder. */
    private function legalPage(string $slug, string $title, string $whileMissing, string $whenThere): GoLiveCheck
    {
        $placeholder = $this->legal->placeholder($slug);

        return $this->check($slug, self::LEGAL, $title, GoLiveCheck::CLIENT, $placeholder ? GoLiveCheck::MISSING : GoLiveCheck::OK, $placeholder ? $whileMissing : $whenThere, $this->pagePlace($slug));
    }

    /** The Widerrufsbelehrung, and the Muster-Widerrufsformular addressed to the seller (Anlage 2 zu Art. 246a EGBGB). */
    private function withdrawal(): GoLiveCheck
    {
        $seller = Seller::current();
        $missing = array_keys(array_filter([
            'der Text der Kanzlei' => $this->legal->placeholder('widerrufsbelehrung'),
            'Name und Anschrift des Verkäufers für das Formular' => $seller->name === null || $seller->street === null || $seller->zip === null || $seller->city === null,
        ]));

        return $this->check('widerruf', self::LEGAL, 'Widerrufsbelehrung und Muster-Widerrufsformular', GoLiveCheck::CLIENT, $missing === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, $missing === []
            ? 'Die Widerrufsbelehrung steht im Shop; das Formular nennt den Verkäufer mit Anschrift.'
            : 'Noch offen: '.implode(' und ', $missing).'.', $this->pagePlace('widerrufsbelehrung'));
    }

    private function shipping(): GoLiveCheck
    {
        $shipping = Shipping::current();
        $missing = $shipping->missing();

        return $this->check('versand', self::LEGAL, 'Versandkosten und Lieferzeit', GoLiveCheck::CLIENT, $missing === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, $missing === []
            ? 'Vor dem Bestellknopf stehen '.(string) $shipping->summary().'.'
            : 'Es fehlen: '.implode(', ', $missing).'. Ohne sie nimmt der Shop keine echte Bestellung an.', '/admin/einstellungen/verkaeufer-versand');
    }

    /** The client is not a Kleinunternehmer: every price includes 19 % USt. */
    private function vat(): GoLiveCheck
    {
        $small = Seller::current()->smallBusiness;

        return $this->check('mwst', self::LEGAL, 'Umsatzsteuer und Bruttopreise', GoLiveCheck::US, $small ? GoLiveCheck::MISSING : GoLiveCheck::OK, $small
            ? 'Der Shop rechnet als Kleinunternehmer ohne Umsatzsteuer – der Betreiber ist aber keiner.'
            : 'Jeder Preis ist ein Bruttopreis mit 19 % Umsatzsteuer, auf der Seite, in der Bestellung und auf der Rechnung.', 'RIMIFY_SELLER_SMALL_BUSINESS');
    }

    /** § 14 Abs. 4 UStG: the seller's part of every invoice, and the real numbers opened. */
    private function invoiceFields(): GoLiveCheck
    {
        $missing = Seller::current()->missing();

        try {
            $series = InvoiceSeries::state();
            $opened = $series['invoice'] !== null && $series['credit_note'] !== null;
        } catch (Throwable) {
            $opened = false;
        }

        if (! $opened) {
            $missing[] = 'die eröffneten Rechnungsnummern (Einstellungen › Zahlung)';
        }

        return $this->check('rechnung', self::LEGAL, 'Rechnungsangaben (§ 14 UStG)', GoLiveCheck::CLIENT, $missing === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, $missing === []
            ? 'Jede Rechnung trägt Verkäufer, Steuernummer oder USt-IdNr., Datum, Nummer, Menge, Leistungszeitraum, Netto, Satz und Steuer.'
            : 'Solange etwas fehlt, ist jede Rechnung eine Testrechnung. Es fehlen: '.implode(', ', $missing).'.', '/admin/einstellungen/verkaeufer-versand');
    }

    /** § 312j Abs. 3 BGB: the button says „Zahlungspflichtig bestellen" — read from the page the checkout is built from. */
    private function orderButton(): GoLiveCheck
    {
        $page = 'resources/js/Pages/Kasse/Index.vue';
        $source = is_file(base_path($page)) ? (string) file_get_contents(base_path($page)) : '';
        $found = preg_match('/<button[^>]*class="[^"]*ko__pay[^"]*"[^>]*>\s*Zahlungspflichtig bestellen\s*<\/button>/', $source) === 1;

        if ($source === '') {
            return $this->check('bestellknopf', self::LEGAL, 'Bestellknopf (§ 312j BGB)', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Die Seite der Kasse liegt dieser Installation nicht bei; die Tests der Kasse prüfen den Wortlaut.', $page);
        }

        return $this->check('bestellknopf', self::LEGAL, 'Bestellknopf (§ 312j BGB)', GoLiveCheck::US, $found ? GoLiveCheck::OK : GoLiveCheck::MISSING, $found
            ? 'Der Knopf der Kasse sagt „Zahlungspflichtig bestellen“.'
            : 'Der Knopf der Kasse sagt nicht wörtlich „Zahlungspflichtig bestellen“.', $page);
    }

    /** § 312f Abs. 2 BGB: the confirmation leaves the server, with the AGB and the Widerrufsbelehrung as PDFs. */
    private function confirmation(): GoLiveCheck
    {
        $mailer = (string) config('mail.default');

        if (in_array($mailer, ['log', 'array'], true)) {
            return $this->check('bestaetigung', self::LEGAL, 'Bestellbestätigung (§ 312f BGB)', GoLiveCheck::US, GoLiveCheck::MISSING, "MAIL_MAILER={$mailer}: Die Bestätigung wird nicht verschickt.", 'MAIL_MAILER');
        }

        $texts = ! $this->legal->placeholder('agb') && ! $this->legal->placeholder('widerrufsbelehrung');

        return $this->check('bestaetigung', self::LEGAL, 'Bestellbestätigung (§ 312f BGB)', GoLiveCheck::US, GoLiveCheck::OK, $texts
            ? "Die Bestätigung wird über {$mailer} verschickt, mit Rechnung, AGB und Widerrufsbelehrung als PDF."
            : "Die Bestätigung wird über {$mailer} verschickt, mit der Rechnung; AGB und Widerrufsbelehrung hängen als PDF an, sobald die Texte der Kanzlei vorliegen.", 'MAIL_MAILER');
    }

    /** § 25 TDDDG: only what the shop needs, so nothing to ask — read from the cookie list the notice and the page share. */
    private function cookies(): GoLiveCheck
    {
        $file = 'resources/js/legal/cookies.ts';
        $source = is_file(base_path($file)) ? (string) file_get_contents(base_path($file)) : '';
        preg_match_all("/category:\s*'([^']+)'/", $source, $m);
        $categories = array_values(array_unique($m[1]));
        $asking = array_values(array_diff($categories, ['Notwendig', 'Funktional']));

        if ($categories === []) {
            return $this->check('cookies', self::LEGAL, 'Cookies (§ 25 TDDDG)', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Die Liste der Cookies liegt dieser Installation nicht bei.', $file);
        }

        return $this->check('cookies', self::LEGAL, 'Cookies (§ 25 TDDDG)', GoLiveCheck::US, $asking === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, $asking === []
            ? 'Der Shop setzt nur Cookies der Kategorien „Notwendig“ und „Funktional“ und fragt keine Einwilligung ab – es gibt also nichts gleichwertig abzulehnen.'
            : 'Cookies der Kategorie '.implode(', ', $asking).' brauchen eine Einwilligung mit gleichwertigem Ablehnen – der Cookie-Hinweis bietet keine.', $file);
    }

    /** GPSR: every brand on sale names its manufacturer. */
    private function gpsr(): GoLiveCheck
    {
        $onSale = Brand::query()
            ->whereHas('wheelModels', static fn (Builder $q) => $q->where('status', CatalogueStatus::Published->value)->where('is_demo', false))
            ->orderBy('name')
            ->get();
        $without = $onSale->filter(static fn (Brand $brand): bool => $brand->manufacturer() === null)->pluck('name')->all();

        return $this->check('gpsr', self::LEGAL, 'Herstellerangaben je Marke (GPSR)', GoLiveCheck::CLIENT, $without === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, match (true) {
            $without !== [] => 'Herstellerangaben liegen noch nicht vor für: '.implode(', ', $without).'.',
            $onSale->isEmpty() => 'Noch ist keine Felge im Verkauf; jede Marke braucht ihre Angaben, bevor ihre erste Felge erscheint.',
            default => 'Jede Marke im Verkauf nennt ihren Hersteller mit Anschrift und Kontakt.',
        }, '/admin/marken');
    }

    /** BFSG: an online shop states how accessible it is (since 28.06.2025; not for a micro-enterprise). */
    private function accessibility(): GoLiveCheck
    {
        $page = Page::query()->whereIn('slug', ['barrierefreiheit', 'erklaerung-zur-barrierefreiheit', 'barrierefreiheitserklaerung'])->first();
        $there = $page !== null && $page->isPublished() && ! $this->legal->placeholder($page->slug);

        return $this->check('barrierefreiheit', self::LEGAL, 'Erklärung zur Barrierefreiheit (BFSG)', GoLiveCheck::CLIENT, $there ? GoLiveCheck::OK : GoLiveCheck::MISSING, $there
            ? 'Die Erklärung zur Barrierefreiheit steht im Shop.'
            : 'Die Erklärung zur Barrierefreiheit fehlt; ein Online-Shop braucht sie seit 28.06.2025, außer bei einem Kleinstunternehmen.', $page === null ? '/admin/seiten' : '/admin/seiten/'.$page->id);
    }

    /** § 5b Abs. 3 UWG: where reviews are shown, how they are checked — read from the product page that shows them. */
    private function reviews(): GoLiveCheck
    {
        $file = 'resources/js/Pages/Produkt/Index.vue';
        $source = is_file(base_path($file)) ? (string) file_get_contents(base_path($file)) : '';
        $said = str_contains($source, 'Wir prüfen das über die') && str_contains($source, 'Bestellnummer.');
        $visible = Review::query()->visible()->count();

        if ($source === '') {
            return $this->check('bewertungen', self::LEGAL, 'Prüfung der Bewertungen (§ 5b UWG)', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Die Produktseite liegt dieser Installation nicht bei.', $file);
        }

        return $this->check('bewertungen', self::LEGAL, 'Prüfung der Bewertungen (§ 5b UWG)', GoLiveCheck::US, $said ? GoLiveCheck::OK : GoLiveCheck::MISSING, $said
            ? 'Über den Bewertungen steht, dass nur Käufer bewerten und wie wir das prüfen: über die Bestellnummer ('.($visible === 1 ? 'eine Bewertung' : "{$visible} Bewertungen").' sichtbar).'
            : 'Die Produktseite sagt nicht mehr, wie Bewertungen geprüft werden.', $file);
    }

    // ── Recht am Rad ─────────────────────────────────────────────────────────────────────────────────────────────

    /** @return list<GoLiveCheck> */
    private function wheelChecks(): array
    {
        $released = ApprovalDocument::query()->currentlyValid()->get();

        return [
            $this->check('gutachten', self::WHEEL, 'Mindestens ein freigegebenes Gutachten', GoLiveCheck::CLIENT, $released->isEmpty() ? GoLiveCheck::MISSING : GoLiveCheck::OK, $released->isEmpty()
                ? 'Noch ist kein Gutachten freigegeben; bis dahin zeigt der Shop zu keinem Fahrzeug eine Felge.'
                : ($released->count() === 1 ? 'Ein Gutachten ist freigegeben' : "{$released->count()} Gutachten sind freigegeben").' und gültig.', '/admin/gutachten'),
            $this->reachable(),
            $this->annexes($released->all()),
            $this->developmentVehicles(),
            $this->axleLoads(),
        ];
    }

    /** Every published wheel has a configuration a released Gutachten names — else no car can ever be shown it. */
    private function reachable(): GoLiveCheck
    {
        $published = WheelModel::query()->where('status', CatalogueStatus::Published->value)->where('is_demo', false);
        $total = (clone $published)->count();
        $lost = (clone $published)
            ->whereDoesntHave('configs.fitments', static fn (Builder $f) => $f->whereHas('approvalDocument', static fn (Builder $d) => $d->currentlyValid()))
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return $this->check('freigabeweg', self::WHEEL, 'Jede veröffentlichte Felge steht in einem freigegebenen Gutachten', GoLiveCheck::US, $lost === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, match (true) {
            $lost !== [] => 'Kein freigegebenes Gutachten nennt '.count($lost).' von '.$total.' veröffentlichten Felgen: '.implode(', ', array_slice($lost, 0, 5)).(count($lost) > 5 ? ' …' : '').'.',
            $total === 0 => 'Noch ist keine Felge veröffentlicht.',
            default => "Jede der {$total} veröffentlichten Felgen steht für mindestens ein Fahrzeug in einem freigegebenen Gutachten.",
        }, '/admin/felgen');
    }

    /**
     * The Anlagen of each released document we do not hold: a car named only there gets „not yet read", never a no.
     *
     * @param  list<ApprovalDocument>  $released
     */
    private function annexes(array $released): GoLiveCheck
    {
        $gaps = [];

        foreach ($released as $document) {
            $missing = trim((string) $document->missing_annexes);

            if ($missing !== '') {
                $count = self::annexCount($missing);
                $gaps[] = trim($document->kind->labelDe().' '.($document->number() ?? '')).': '.($count === 1 ? 'eine Anlage fehlt' : "{$count} Anlagen fehlen")." ({$missing})";
            }
        }

        return $this->check('anlagen', self::WHEEL, 'Anlagen der Gutachten vollständig', GoLiveCheck::CLIENT, $gaps === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, $gaps === []
            ? ($released === [] ? 'Noch ist kein Gutachten freigegeben.' : 'Jedes freigegebene Gutachten liegt mit allen Anlagen vor.')
            : implode('; ', $gaps).'. Ein Fahrzeug, das nur in einer fehlenden Anlage steht, bekommt „noch nicht gelesen“, nie ein Nein.', '/admin/gutachten');
    }

    /** `1–15` → 15, `3, 5–7` → 4: how many Anlagen a document's gap names. */
    public static function annexCount(string $missing): int
    {
        $count = 0;

        foreach (preg_split('/\s*[,;]\s*/u', trim($missing)) ?: [] as $part) {
            if (preg_match('/^(\d+)\s*[–-]\s*(\d+)$/u', $part, $m) === 1) {
                $count += max(0, (int) $m[2] - (int) $m[1] + 1);
            } elseif ($part !== '') {
                $count++;
            }
        }

        return $count;
    }

    /** A development vehicle (VehicleSource::Entwicklung) in a released Gutachten would be a car no dataset vouches for. */
    private function developmentVehicles(): GoLiveCheck
    {
        $count = Vehicle::query()
            ->where('source', VehicleSource::Entwicklung->value)
            ->whereHas('fitments', static fn (Builder $f) => $f->whereHas('approvalDocument', static fn (Builder $d) => $d->currentlyValid()))
            ->count();

        return $this->check('entwicklung', self::WHEEL, 'Kein Entwicklungsfahrzeug in einem freigegebenen Gutachten', GoLiveCheck::US, $count === 0 ? GoLiveCheck::OK : GoLiveCheck::MISSING, $count === 0
            ? 'Kein Fahrzeug in einem freigegebenen Gutachten ist ein Entwicklungsfahrzeug.'
            : ($count === 1 ? 'Ein Entwicklungsfahrzeug steht' : "{$count} Entwicklungsfahrzeuge stehen").' in einem freigegebenen Gutachten – vor dem Start durch Fahrzeuge aus dem Datensatz ersetzen.', '/admin/fahrzeuge');
    }

    /** R-03: without axle loads and top speed, a tyre verdict stays „mit Auflagen" — the cars a released document names. */
    private function axleLoads(): GoLiveCheck
    {
        $named = Vehicle::query()->whereHas('fitments', static fn (Builder $f) => $f->whereHas('approvalDocument', static fn (Builder $d) => $d->currentlyValid()));
        $total = (clone $named)->count();
        $without = (clone $named)
            ->where(static fn (Builder $q) => $q->where('needs_review', true)
                ->orWhereNull('axle_load_front_kg')->orWhere('axle_load_front_kg', '<=', 0)
                ->orWhereNull('axle_load_rear_kg')->orWhere('axle_load_rear_kg', '<=', 0)
                ->orWhereNull('max_speed_kmh')->orWhere('max_speed_kmh', '<=', 0))
            ->count();

        return $this->check('achslasten', self::WHEEL, 'Achslasten und Höchstgeschwindigkeit der Fahrzeuge', GoLiveCheck::US, $without === 0 ? GoLiveCheck::OK : GoLiveCheck::MISSING, $without === 0
            ? ($total === 0 ? 'Noch nennt kein freigegebenes Gutachten ein Fahrzeug.' : "Für alle {$total} Fahrzeuge der freigegebenen Gutachten sind Achslasten und Höchstgeschwindigkeit hinterlegt.")
            : "{$without} von {$total} Fahrzeugen der freigegebenen Gutachten fehlen Achslasten oder Höchstgeschwindigkeit: Ihre Reifenfreigabe bleibt „mit Auflagen“.", '/admin/fahrzeuge');
    }

    // ── Zahlung ──────────────────────────────────────────────────────────────────────────────────────────────────

    /** @return list<GoLiveCheck> */
    private function paymentChecks(): array
    {
        $config = PaymentConfig::current();
        $production = app()->environment('production');
        $place = '/admin/einstellungen/zahlung';

        $keys = match (true) {
            ! $config->complete() => [GoLiveCheck::MISSING, 'Noch keine vollständigen Stripe-Schlüssel – der Shop nimmt keine Zahlung an.'],
            $production && $config->testMode() => [GoLiveCheck::MISSING, 'Im Live-Shop stehen Testschlüssel: Es wird kein Geld abgebucht.'],
            ! $production && ! $config->testMode() => [GoLiveCheck::MISSING, 'Außerhalb des Live-Shops stehen Live-Schlüssel – sie gehören nur dorthin.'],
            default => [GoLiveCheck::OK, ($config->testMode() ? 'Testschlüssel' : 'Live-Schlüssel').' im '.($production ? 'Live-Shop' : 'Testsystem').', passend zur Umgebung.'],
        };

        return [
            $this->check('schluessel', self::PAYMENT, 'Zahlungsschlüssel passend zur Umgebung', GoLiveCheck::CLIENT, $keys[0], $keys[1], $place),
            $this->webhook($config, $place),
            $this->check('apple-pay', self::PAYMENT, 'Domain für Apple Pay', GoLiveCheck::CLIENT, GoLiveCheck::UNCHECKABLE, $config->complete()
                ? 'Von hier nicht prüfbar: Im Stripe-Dashboard unter Zahlungsmethoden-Domains muss diese Domain stehen.'
                : 'Sobald die Schlüssel eingetragen sind, muss diese Domain im Stripe-Dashboard für Apple Pay registriert werden.', 'Stripe-Dashboard › Zahlungsmethoden-Domains'),
            $this->testMatrix(),
        ];
    }

    /** Paid is only ever the webhook's word: its secret, Stripe's registration of it, and one row per event. */
    private function webhook(PaymentConfig $config, string $place): GoLiveCheck
    {
        $unique = false;

        try {
            foreach (Schema::getIndexes('payment_events') as $index) {
                $unique = $unique || ($index['unique'] && in_array('event_id', $index['columns'], true));
            }
        } catch (Throwable) {
            $unique = false;
        }

        if (! $unique) {
            return $this->check('webhook', self::PAYMENT, 'Stripe-Webhook', GoLiveCheck::US, GoLiveCheck::MISSING, 'Die Datenbank erzwingt keine eindeutige Ereignis-ID: Ein zweimal zugestelltes Ereignis könnte zweimal wirken.', $place);
        }

        if ($config->webhookSecret === null) {
            return $this->check('webhook', self::PAYMENT, 'Stripe-Webhook', GoLiveCheck::US, GoLiveCheck::MISSING, 'Der Webhook-Signaturschlüssel fehlt. Ohne ihn gilt keine Bestellung als bezahlt.', $place);
        }

        $gateway = Payments::gateway();

        if ($gateway === null || $gateway->method() !== 'stripe') {
            return $this->check('webhook', self::PAYMENT, 'Stripe-Webhook', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Signaturschlüssel und eindeutige Ereignis-ID sind vorhanden; ob Stripe den Endpunkt kennt, lässt sich erst prüfen, wenn Stripe als Zahlungsart in Kraft ist.', $place);
        }

        try {
            $problem = $gateway->webhookProblem(route('webhooks.payment', ['provider' => 'stripe']));
        } catch (Throwable $e) {
            $problem = $e->getMessage();
        }

        return $this->check('webhook', self::PAYMENT, 'Stripe-Webhook', GoLiveCheck::US, $problem === null ? GoLiveCheck::OK : GoLiveCheck::MISSING, $problem === null
            ? 'Der Endpunkt ist bei Stripe für jedes Ereignis registriert, das der Shop braucht; jedes Ereignis wirkt nur einmal.'
            : 'Stripe-Webhook: '.$problem, $place);
    }

    /** The last full card matrix (docs/dev/STRIPE.md): run once the test keys are in, its date and result recorded. */
    private function testMatrix(): GoLiveCheck
    {
        $run = Setting::get('payments.test_matrix');

        if (! is_array($run) || ! isset($run['date'], $run['result'])) {
            return $this->check('testmatrix', self::PAYMENT, 'Letzte vollständige Testmatrix', GoLiveCheck::US, GoLiveCheck::MISSING, 'Noch nie gelaufen – die Testmatrix braucht die Testschlüssel.', 'docs/dev/STRIPE.md');
        }

        $passed = $run['result'] === 'bestanden';

        return $this->check('testmatrix', self::PAYMENT, 'Letzte vollständige Testmatrix', GoLiveCheck::US, $passed ? GoLiveCheck::OK : GoLiveCheck::MISSING, 'Zuletzt am '.$run['date'].': '.$run['result'].'.', 'docs/dev/STRIPE.md');
    }

    // ── Betrieb und Sicherheit ───────────────────────────────────────────────────────────────────────────────────

    /** @return list<GoLiveCheck> */
    private function operationsChecks(bool $network): array
    {
        return [
            $this->rulebook(),
            $network ? $this->backups() : $this->check('sicherungen', self::OPERATIONS, 'Sicherungen nicht über HTTP erreichbar', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Auf dieser Seite nicht geprüft, weil der Server sonst bei sich selbst anfragen müsste; rimify:go-live-check und rimify:smoke prüfen es.', 'storage/app/private/.htaccess'),
            $this->invoiceBucket(),
            $this->check('ci', self::OPERATIONS, 'Beide Datenbank-Engines grün in CI', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Von hier nicht prüfbar: Der Lauf steht auf GitHub (MySQL 8.4 und MariaDB 11.8.9).', '.github/workflows/suite.yml'),
            $this->rendering(),
            $this->cron(),
            $this->serverLocation((string) gethostname()),
            $this->resetFlag(),
            $this->demoRows(),
        ];
    }

    /**
     * Where the server stands, read from its own name — Hostinger names its machines `<country>-<city>-web<n>`
     * (`us-bos-web1780.main-hosting.eu` is the preview's, 06.10.2026). Null for a name without that scheme.
     *
     * @return array{country: string, eu: bool}|null
     */
    public static function locationOf(string $hostname): ?array
    {
        if (preg_match('/^([a-z]{2})-[a-z]{2,5}-web\d+\b/i', $hostname, $m) !== 1) {
            return null;
        }

        $country = strtolower($m[1]);

        return ['country' => $country, 'eu' => in_array($country, self::EU, true)];
    }

    /**
     * Customers' names, addresses and orders live on this server, and every page is answered there. Decided (D-181):
     * Hostinger's data centre in Germany for the web server and the database — any other place, another EU state
     * included, is open until the plan stands there (docs/ops/UMZUG-DE.md).
     */
    private function serverLocation(string $hostname): GoLiveCheck
    {
        $title = 'Serverstandort in Deutschland';
        $place = 'hPanel › Hosting › Rechenzentrum';
        $where = self::locationOf($hostname);

        if (! app()->environment(['production', 'staging'])) {
            return $this->check('serverstandort', self::OPERATIONS, $title, GoLiveCheck::HOST, GoLiveCheck::OK, 'Lokal: Diese Prüfung gilt nur für den Testserver und den Live-Shop.', $place);
        }

        if ($where === null) {
            return $this->check('serverstandort', self::OPERATIONS, $title, GoLiveCheck::HOST, GoLiveCheck::UNCHECKABLE, "Der Server heißt {$hostname}; aus dem Namen geht der Standort nicht hervor – beim Host nachsehen, ob das Rechenzentrum in der EU steht.", $place);
        }

        $code = strtoupper($where['country']);
        $germany = $where['country'] === 'de';

        return $this->check('serverstandort', self::OPERATIONS, $title, GoLiveCheck::HOST, $germany ? GoLiveCheck::OK : GoLiveCheck::MISSING, match (true) {
            $germany => "Nach dem Namensschema des Hosts steht der Server {$hostname} in Deutschland.",
            $where['eu'] => "Nach dem Namensschema des Hosts steht der Server {$hostname} in der EU ({$code}), aber nicht in Deutschland. Entschieden ist Hostingers Rechenzentrum in Deutschland für Webserver und Datenbank.",
            default => "Nach dem Namensschema des Hosts steht der Server {$hostname} außerhalb der EU ({$code}). Die Kundendaten würden dort gespeichert, und jeder Seitenaufruf ginge dorthin und zurück. Entschieden ist Hostingers Rechenzentrum in Deutschland für Webserver und Datenbank.",
        }, $place.' · docs/ops/UMZUG-DE.md');
    }

    /** CLAUDE.md and the decision log are in the repository — where this copy is one; CI asserts it on every run. */
    private function rulebook(): GoLiveCheck
    {
        if (! is_dir(base_path('.git')) || ! is_file(base_path('CLAUDE.md'))) {
            return $this->check('regelwerk', self::OPERATIONS, 'CLAUDE.md und Entscheidungsprotokoll im Repository', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'Diese Installation ist kein Arbeitsverzeichnis des Repositorys; CI prüft es bei jedem Lauf.', 'CLAUDE.md');
        }

        try {
            $git = new Process(['git', 'ls-files', '--error-unmatch', 'CLAUDE.md', 'docs/decisions.md'], base_path());
            $git->run();
            $tracked = $git->isSuccessful();
        } catch (Throwable) {
            return $this->check('regelwerk', self::OPERATIONS, 'CLAUDE.md und Entscheidungsprotokoll im Repository', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, 'git ist hier nicht aufrufbar; CI prüft es bei jedem Lauf.', 'CLAUDE.md');
        }

        return $this->check('regelwerk', self::OPERATIONS, 'CLAUDE.md und Entscheidungsprotokoll im Repository', GoLiveCheck::US, $tracked ? GoLiveCheck::OK : GoLiveCheck::MISSING, $tracked
            ? 'CLAUDE.md und docs/decisions.md sind im Repository.'
            : 'CLAUDE.md oder docs/decisions.md ist nicht im Repository.', 'CLAUDE.md');
    }

    /** The reset's copies, the log and two canaries, asked for over HTTP: only 403 or 404 will do. */
    private function backups(): GoLiveCheck
    {
        $base = rtrim((string) config('app.url'), '/');
        $results = $this->privateFiles->run($base);
        $unanswered = array_filter($results, static fn (array $r): bool => $r['status'] === null);

        if ($results === [] || count($unanswered) === count($results)) {
            return $this->check('sicherungen', self::OPERATIONS, 'Sicherungen nicht über HTTP erreichbar', GoLiveCheck::US, GoLiveCheck::UNCHECKABLE, "Von hier aus antwortet {$base} nicht; rimify:smoke prüft es auf dem Server.", 'storage/app/private/.htaccess');
        }

        $faults = PrivateFilesProbe::faults($results);

        return $this->check('sicherungen', self::OPERATIONS, 'Sicherungen nicht über HTTP erreichbar', GoLiveCheck::US, $faults === [] ? GoLiveCheck::OK : GoLiveCheck::MISSING, $faults === []
            ? 'Sicherungen, Protokoll und Testdateien antworten über HTTP mit '.implode(', ', array_unique(array_map(static fn (array $r): string => (string) $r['status'], $results))).'.'
            : implode(' · ', $faults), 'storage/app/private/.htaccess');
    }

    /** Invoices on the private disk, or — where it is a bucket — refused to anyone without a signed link. */
    private function invoiceBucket(): GoLiveCheck
    {
        $driver = (string) config('filesystems.disks.'.Invoices::DISK.'.driver');

        if ($driver !== 's3') {
            $dir = realpath(Storage::disk(Invoices::DISK)->path('')) ?: Storage::disk(Invoices::DISK)->path('');
            $exposed = str_starts_with(str_replace('\\', '/', $dir), str_replace('\\', '/', realpath(public_path()) ?: public_path()));

            return $this->check('rechnungen', self::OPERATIONS, 'Rechnungen nicht öffentlich', GoLiveCheck::US, $exposed ? GoLiveCheck::MISSING : GoLiveCheck::OK, $exposed
                ? 'Der Ordner invoices/ liegt im öffentlichen Verzeichnis.'
                : 'Rechnungen liegen im privaten Speicher des Servers, nicht im Bucket, und sind nur über signierte Links abrufbar.', 'FILESYSTEM_DISK');
        }

        return $this->check('rechnungen', self::OPERATIONS, 'Rechnungen nicht öffentlich', GoLiveCheck::HOST, GoLiveCheck::UNCHECKABLE, 'Die Rechnungen liegen im Bucket: Dass invoices/ dort 403 antwortet, prüft rimify:preflight mit dem S3-Audit.', 'Einstellungen › Medien und Speicher');
    }

    /** The renderer answers: without it pages are drawn by the browser and empty for search engines. */
    private function rendering(): GoLiveCheck
    {
        if (config('inertia.ssr.enabled', true) !== true) {
            return $this->check('ssr', self::OPERATIONS, 'Server-Rendering', GoLiveCheck::US, GoLiveCheck::MISSING, 'Das Server-Rendering ist ausgeschaltet.', 'INERTIA_SSR_ENABLED');
        }

        $socket = BoundedSsrGateway::socket();

        try {
            $ready = BoundedSsrGateway::client($socket)->timeout(2)
                ->get(($socket === null ? rtrim((string) config('inertia.ssr.url', 'http://127.0.0.1:13714'), '/') : 'http://localhost').'/health')->successful();
        } catch (Throwable) {
            $ready = false;
        }

        return $this->check('ssr', self::OPERATIONS, 'Server-Rendering', GoLiveCheck::US, $ready ? GoLiveCheck::OK : GoLiveCheck::MISSING, $ready
            ? 'Der Renderer antwortet; jede Seite kommt fertig aufgebaut an.'
            : 'Der Renderer antwortet nicht – deploy/ssr-watch.sh startet ihn neu, wenn die Cron-Zeile läuft.', 'deploy/ssr-watch.sh');
    }

    /** The cron line runs the scheduler (orders expire, copies are pruned, the renderer is watched); it beats every minute. */
    private function cron(): GoLiveCheck
    {
        $ago = ScheduleBeat::secondsAgo();

        return $this->check('cron', self::OPERATIONS, 'Cron-Zeilen für Zeitplan und Wächter', GoLiveCheck::HOST, $ago !== null && $ago <= 180 ? GoLiveCheck::OK : GoLiveCheck::MISSING, match (true) {
            $ago === null => 'Der Zeitplan ist noch nie gelaufen – fehlt die Cron-Zeile für schedule:run?',
            $ago > 180 => 'Der Zeitplan lief zuletzt vor '.intdiv($ago, 60).' Minuten – läuft die Cron-Zeile noch?',
            default => "Der Zeitplan lief vor {$ago} Sekunden.",
        }, 'hPanel › Cron-Jobs');
    }

    /** RIMIFY_RESET_ERLAUBT: in the .env of a test server, never in the live shop's (GO-LIVE.md §4.4). */
    private function resetFlag(): GoLiveCheck
    {
        $lines = TestEnvironment::flagLines();

        [$state, $sentence] = match (true) {
            app()->environment('production') && $lines !== [] => [GoLiveCheck::MISSING, 'RIMIFY_RESET_ERLAUBT steht in der .env des Live-Shops – herausnehmen, auch false gehört dort nicht hin.'],
            app()->environment('production') => [GoLiveCheck::OK, 'Im Live-Shop steht kein Schalter zum Zurücksetzen.'],
            app()->environment('staging') && $lines !== ['true'] => [GoLiveCheck::MISSING, 'Der Testserver braucht genau eine Zeile RIMIFY_RESET_ERLAUBT=true.'],
            app()->environment('staging') => [GoLiveCheck::OK, 'Der Testserver darf zurückgesetzt werden, der Live-Shop nie.'],
            default => [GoLiveCheck::OK, 'Lokal: Diese Prüfung gilt nur für den Testserver und den Live-Shop.'],
        };

        return $this->check('zuruecksetzen', self::OPERATIONS, 'Schalter zum Zurücksetzen passend zur Umgebung', GoLiveCheck::US, $state, $sentence, 'RIMIFY_RESET_ERLAUBT');
    }

    /** R-12: no demonstration data on show — a demo wheel published would be sold. */
    private function demoRows(): GoLiveCheck
    {
        $published = WheelModel::query()->where('is_demo', true)->where('status', CatalogueStatus::Published->value)->count();
        $total = DemoTables::total();

        return $this->check('demodaten', self::OPERATIONS, 'Keine Demodaten veröffentlicht', GoLiveCheck::US, $published === 0 ? GoLiveCheck::OK : GoLiveCheck::MISSING, $published === 0
            ? ($total === 0 ? 'Es gibt keine Demodaten.' : "Keine Demofelge ist veröffentlicht; {$total} Demodatensätze liegen noch zum Löschen bereit.")
            : "{$published} Demofelgen sind veröffentlicht – vor dem Start mit demo:purge löschen.", '/admin/system');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────

    /** The admin page that edits a legal page's text, or the list where it is not there. */
    private function pagePlace(string $slug): string
    {
        $id = Page::query()->where('slug', $slug)->value('id');

        return $id === null ? '/admin/seiten' : '/admin/seiten/'.$id;
    }

    /**
     * @param  GoLiveCheck::OK|GoLiveCheck::MISSING|GoLiveCheck::UNCHECKABLE  $state
     * @param  GoLiveCheck::US|GoLiveCheck::CLIENT|GoLiveCheck::HOST  $owner
     */
    private function check(string $id, string $group, string $title, string $owner, string $state, string $sentence, string $place): GoLiveCheck
    {
        return new GoLiveCheck($id, $group, $title, $owner, $state, $sentence, $place);
    }
}
