<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Enums\FitmentStatus;
use App\Models\Fitment;
use App\Models\Order;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Payments\Payments;
use App\Services\Reset\BaselineState;
use App\Services\Reset\TestEnvironment;
use App\Services\Smoke\PrivateFilesProbe;
use App\Services\Smoke\ResetScreenProbe;
use App\Services\Storage\MediaDisks;
use App\Services\Storage\S3Audit;
use App\Services\Storage\StorageSettings;
use App\Support\DatabaseEngine;
use App\Support\GermanFormat;
use App\Support\HeroPhotos;
use App\Support\KeyNumberSearch;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Console\Command;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * `rimify:smoke`: the shop, used from outside, right after a release — the checks GO-LIVE.md runs
 * before anyone else sees the site. Every check goes over HTTP to the running site, as a visitor
 * without JavaScript would: what is asserted is in the server-rendered HTML, never only in the page's
 * data. Non-zero exit on any failure.
 *
 *   1  Startseite: 200, server-rendered
 *   2  A product page: 200, its name and a price in the rendered HTML (no JavaScript)
 *   3  HSN/TSN lookup → the product page answers „freigegeben für …“ for that car
 *   4  The Gutachten PDF linked there opens (200, `%PDF-`)
 *   5  The admin's sign-in page renders
 *   6  A test order completes — only where the sandbox payment is on (never in production)
 *   7  The four storage prefixes: public ones readable, `invoices/` not
 *   8  The database engine and its version, named on every run, so a wrong engine never passes unnoticed
 *   9  System › Zurücksetzen per role: 200 to a Super-Admin and 404 to every other role where the reset is available,
 *      404 to everyone elsewhere — production first of all (GO-LIVE.md §4.4)
 *  10  The reset's safety copies, the log and two canaries in storage/app/private: 403 or 404 over HTTP, never 200
 *  11  The reset's baseline fits this code and this database: its migrations and its schema's fingerprint
 *  12  The shop's security policy reaches the browser, in the header or in the document (the host replaces the header)
 *
 * The product and the car are the first released pair the shop sells (a published document row, a
 * published wheel in stock, a car with complete data) — the golden record on staging — unless
 * `--product=` and `--hsn=`/`--tsn=` name them.
 */
final class Smoke extends Command
{
    protected $signature = 'rimify:smoke
        {--url= : The site to check (default: APP_URL)}
        {--product= : A product slug}
        {--hsn= : HSN of a car the product is approved for}
        {--tsn= : TSN of that car}
        {--testbestellung : Also place and pay one sandbox order. Never by default: an order stays in the shop for good (R-12)}';

    protected $description = 'Smoke test of the running shop over HTTP: pages, SSR, lookup, PDF, admin, test order, storage';

    /** @var list<array{0: string, 1: string, 2: string}> */
    private array $rows = [];

    private CookieJar $jar;

    private string $base;

    public function handle(FitmentResolver $resolver, StorageSettings $settings, S3Audit $audit, MediaDisks $disks, ResetScreenProbe $resetScreen, PrivateFilesProbe $privateFiles): int
    {
        $this->base = rtrim((string) ($this->option('url') ?: config('app.url')), '/');
        $this->jar = new CookieJar;
        $this->line("Smoke-Test gegen {$this->base}");

        // The engine is part of what is tested (D-052): named on every run, so a wrong one never passes unnoticed.
        $this->check('Datenbank-Engine', static function (): string {
            $version = (string) DB::selectOne('SELECT VERSION() AS v')->v;
            [$engine, $series] = DatabaseEngine::parse($version);
            $refusal = DatabaseEngine::refusal($version);

            if ($refusal !== null) {
                throw new \RuntimeException($refusal);
            }

            return "{$engine} {$version} (die Suite läuft auf ".implode(' und ', DatabaseEngine::tested()).", hier {$engine} {$series})";
        });

        $pair = $this->pair($resolver);

        // A test environment reset to an empty shop (TestReset) sells nothing yet, and says so on its homepage: there
        // is no wheel for the hero, the product page or a test order — until the team publishes its first.
        // The acceptance set counts as a wheel on sale here (AcceptanceSet): with it, the smoke runs in full.
        $empty = TestEnvironment::shopEmptied() && ! WheelModel::query()->onSale()->exists();

        $this->check('Startseite', function (): string {
            $response = $this->get('/');
            $this->expect($response->status() === 200, "HTTP {$response->status()}");
            $this->expect(str_contains($response->body(), 'data-server-rendered'), 'ohne Server-Rendering ausgeliefert');

            return '200, auf dem Server gerendert';
        });

        // The shop's policy reaches the browser. The host replaces the header with its own (ContentSecurityPolicy), so
        // the document carries it too — asserted where the header was lost: on the host, over HTTP.
        $this->check('Sicherheitsrichtlinie (CSP)', function (): string {
            $response = $this->get('/');
            $header = (string) $response->header('Content-Security-Policy');
            $meta = preg_match('/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/', $response->body(), $found) === 1
                ? html_entity_decode($found[1], ENT_QUOTES)
                : '';
            $ours = static fn (string $policy): bool => preg_match("/script-src 'self' 'nonce-[^']+'/", $policy) === 1;
            $this->expect($ours($meta) || $ours($header), 'weder der Header noch das Dokument enthält die Richtlinie des Shops – der Browser schränkt Skripte und Styles nicht ein');

            // Each half said for what it is: the row never claims the document carries what only the header does.
            return match (true) {
                $ours($header) && $ours($meta) => 'im Header und im Dokument',
                $ours($header) => 'nur im Header – im Dokument fehlt sie',
                $header === '' => 'im Dokument; einen Header sendet der Host nicht',
                default => 'im Dokument; den Header ersetzt der Host durch „'.$header.'“',
            };
        });

        // The homepage's signature pieces (docs/design/PROTECTED.md P1, P3, P4), asserted where they were lost: on the host.
        // The preview showed the outline and no numbers section for days while every test on a fresh database passed
        // (D-089). The hero's photograph is the brand's and stands in every state, an empty shop included (the
        // operator's brief of 05.10.2026, §2), with the photograph's own values (the client's #4); only the numbers
        // section waits for the wheel in the photograph to be on sale.
        $heroLive = WheelModel::query()->onSale()
            ->whereIn('slug', array_column(HeroPhotos::all(), 'model'))->exists();

        $this->check('Startseite: Felgenfoto und Zahlen', function () use ($heroLive): string {
            $html = self::rendered($this->get('/')->body());
            $hero = preg_match('#<section[^>]*data-section="H2".*?</section>#s', $html, $section) === 1 ? $section[0] : '';
            $this->expect($hero !== '', 'kein Hero im gerenderten HTML');
            $this->expect(
                preg_match('#<img\b[^>]*\bsrc="([^"]+)"#', $hero, $img) === 1,
                'kein Felgenfoto im Hero – das Markenfoto (Inhalte › Seiten › Startseite › Einstieg) fehlt auf dem Server; die Startseite zeigt die Umrisszeichnung',
            );
            $photo = $this->get(html_entity_decode($img[1]));
            $this->expect($photo->status() === 200, "das Felgenfoto antwortet mit HTTP {$photo->status()}");
            $name = basename((string) parse_url($img[1], PHP_URL_PATH));
            // Its values with it, whatever the catalogue holds — and the photograph never linked, never priced (the client's #4).
            $stage = (string) strstr($hero, 'hero__stage');
            $this->expect(str_contains($hero, 'data-hero="values"'), 'der Hero zeigt die Werte des Fotos nicht (Maße am Foto und Größenzeile)');
            $this->expect(preg_match('#<a\b[^>]*>(?:(?!</a>).)*?<img#s', $stage) !== 1 && ! str_contains($stage, '€'), 'das Felgenfoto im Hero ist verlinkt oder trägt einen Preis');

            if (! $heroLive) {
                return "Felgenfoto im Hero ({$name}); der Zahlen-Abschnitt wartet, bis die Felge im Foto veröffentlicht ist";
            }

            $this->expect(str_contains($html, 'data-section="H8"'), 'der Abschnitt „Was die Zahlen auf einer Felge bedeuten“ fehlt');

            return "Felgenfoto im Hero ({$name}), Zahlen-Abschnitt da";
        });

        if ($pair === null && $empty) {
            $this->rows[] = ['Produktseite / Prüfung / PDF / Testbestellung', 'übersprungen', 'Testumgebung zurückgesetzt: noch keine freigegebene Felge im Shop.'];
        } elseif ($pair === null) {
            $this->rows[] = ['Produktseite / Prüfung / PDF / Testbestellung', 'FEHLER', 'Keine freigegebene Felge im Shop (veröffentlichtes Gutachten, veröffentlichte Felge auf Lager, Fahrzeug vollständig).'];
        } else {
            ['config' => $config, 'vehicle' => $vehicle] = $pair;
            $slug = (string) $config->wheelModel->slug;
            $name = (string) $config->wheelModel->name;
            $prices = $config->wheelModel->configs()->pluck('price_cents')->map(static fn (mixed $c): string => GermanFormat::money((int) $c))->all();

            $this->check('Produktseite ohne JavaScript', function () use ($slug, $name, $prices): string {
                $response = $this->get('/felgen/'.$slug);
                $this->expect($response->status() === 200, "HTTP {$response->status()}");
                $html = self::rendered($response->body());
                $this->expect(str_contains($html, e($name)), "„{$name}“ steht nicht im gerenderten HTML");
                $price = collect($prices)->first(static fn (string $p): bool => str_contains($html, $p));
                $this->expect($price !== null, 'kein Preis im gerenderten HTML');

                return "„{$name}“ und {$price} im HTML";
            });

            $pdf = null;
            $this->check('HSN/TSN-Abfrage und Freigabe', function () use ($vehicle, $slug, &$pdf): string {
                // A car typed from a Gutachten has no key numbers yet: it is chosen from the list, as a customer would — and so
                // is any car while no vehicle dataset has opened the search by key numbers (KeyNumberSearch).
                if ($vehicle->hsn !== null && $vehicle->tsn !== null && KeyNumberSearch::available()) {
                    $this->post('/fahrzeug/schluesselnummern', ['hsn' => $vehicle->hsn, 'tsn' => $vehicle->tsn]);
                }
                // Several cars behind one pair of numbers: the chooser, and this one is chosen (R-01).
                $this->post('/fahrzeug', ['fahrzeug' => (string) $vehicle->id]);
                $html = self::rendered($this->get('/felgen/'.$slug)->body());
                $this->expect((bool) preg_match('/(Mit Auflagen freigegeben|Freigegeben) für ([^<]+)/u', $html, $m), 'keine Freigabe auf der Produktseite');
                $pdf = self::pdfLink($html);

                return trim($m[0]).' ('.GermanFormat::keyNumbers($vehicle->hsn, $vehicle->tsn).')';
            });

            $this->check('Gutachten-PDF', function () use (&$pdf): string {
                $this->expect(is_string($pdf), 'kein PDF-Link auf der Produktseite');
                $via = '';

                // An example document opens through the page that marks it (D-239): its file is behind that page's link.
                if (self::isExamplePage((string) $pdf)) {
                    $example = self::http(20)->get(Str::startsWith((string) $pdf, 'http') ? (string) $pdf : $this->base.$pdf);
                    $this->expect($example->status() === 200, "Beispielseite: HTTP {$example->status()}");
                    $html = self::rendered($example->body());
                    $this->expect(str_contains($html, 'nur als Beispiel hinterlegt'), 'die Beispielseite sagt nicht, dass das Gutachten nur ein Beispiel ist');
                    $pdf = self::pdfLink($html, 'Das Dokument öffnen');
                    $this->expect(is_string($pdf), 'kein PDF-Link auf der Beispielseite');
                    $via = ' über die Beispielseite';
                }

                $url = (string) preg_replace('/#.*$/', '', (string) $pdf);
                $response = self::http(20)->get(Str::startsWith($url, 'http') ? $url : $this->base.$url);
                $this->expect($response->status() === 200, "HTTP {$response->status()}");
                $this->expect(str_starts_with($response->body(), '%PDF-'), 'die Antwort ist kein PDF');

                return 'öffnet'.$via.', Seite '.(preg_match('/#page=(\d+)/', (string) $pdf, $page) ? $page[1] : '–');
            });

            $step = self::orderStep((bool) $config->wheelModel->is_demo, Payments::sandbox(), (bool) $this->option('testbestellung'));

            if ($step === 'order') {
                $this->check('Testbestellung (Sandbox)', fn (): string => $this->order($config));
            } else {
                if (self::walksToCheckout($step)) {
                    $this->check('Warenkorb und Kasse (ohne Bestellung)', fn (): string => $this->toThePointBeforeOrdering($config));
                }

                $this->rows[] = ['Testbestellung', 'übersprungen', match ($step) {
                    'demo' => 'Die Felge der Abnahme wird nie bestellt, auch nicht auf Wunsch. Geprüft ist der Weg bis vor „Zahlungspflichtig bestellen“.',
                    'before' => 'Nur auf Wunsch (--testbestellung): Eine bezahlte Bestellung bleibt für immer im Shop. Geprüft ist der Weg bis vor „Zahlungspflichtig bestellen“.',
                    default => 'Keine Testzahlung in dieser Umgebung (im Live-Shop immer aus).',
                }];
            }
        }

        $this->check('Admin-Anmeldung', function (): string {
            $response = $this->get('/admin/anmelden');

            if ($response->status() === 404 && ! app()->environment('production') && config('rimify.admin.enabled') !== true) {
                return 'Admin in dieser Umgebung ausgeschaltet';
            }

            $this->expect($response->status() === 200, "HTTP {$response->status()}");
            $this->expect(str_contains(self::rendered($response->body()), 'Anmelden'), 'Anmeldeseite nicht gerendert');

            return '200, Anmeldeformular gerendert';
        });

        $this->check('Speicher-Präfixe', fn (): string => $this->storage($settings, $audit, $disks));

        $this->check('System › Zurücksetzen', fn (): string => $this->resetScreen($resetScreen));

        // The baseline a reset restores from fits this code and this database (BaselineState; the brief of 05.10.2026,
        // §2.1): its migrations and its schema's fingerprint. In the live shop there is no reset, and no baseline.
        $this->check('Vorlage zum Zurücksetzen', function (): string {
            if (! TestEnvironment::environmentAllows()) {
                return 'im Live-Shop gibt es kein Zurücksetzen und keine Vorlage';
            }

            $path = TestEnvironment::baseline();
            $mismatch = BaselineState::mismatch($path, DB::connection());
            $this->expect($mismatch === null, (string) $mismatch);
            $state = BaselineState::recorded($path);

            return 'passt: '.count($state['migrations']).' Migrationen bis „'.$state['last'].'“, Aufbau '.substr((string) $state['schema'], 0, 12);
        });

        $this->check('Private Dateien über HTTP', function () use ($privateFiles): string {
            $results = $privateFiles->run($this->base);
            $faults = PrivateFilesProbe::faults($results);
            $this->expect($faults === [], implode(' · ', $faults));
            $this->expect($results !== [], 'nichts zu prüfen – storage/app/private fehlt');

            return implode(', ', array_map(static fn (array $r): string => basename($r['path']).' '.$r['status'], $results));
        });

        $this->table(['Prüfung', 'Ergebnis', 'Befund'], $this->rows);
        $failed = array_filter($this->rows, static fn (array $r): bool => $r[1] === 'FEHLER');

        if ($failed !== []) {
            $this->error('Smoke-Test fehlgeschlagen: '.count($failed).' Prüfung(en). GO-LIVE.md › Rückweg.');

            return self::FAILURE;
        }

        $this->info('Smoke-Test bestanden.');

        return self::SUCCESS;
    }

    /**
     * The product and the car: named by the options, or the first released pair the shop sells.
     *
     * @return array{config: WheelConfig, vehicle: Vehicle}|null
     */
    private function pair(FitmentResolver $resolver): ?array
    {
        $slug = $this->option('product');
        $hsn = $this->option('hsn');
        $tsn = $this->option('tsn');

        $rows = Fitment::query()
            ->with(['wheelConfig.wheelModel', 'vehicle'])
            ->where('status', FitmentStatus::Published->value)
            ->whereHas('wheelConfig', static fn ($q) => $q->where('available', true))
            ->whereHas('wheelConfig.wheelModel', static fn ($q) => $q->onSale()
                ->when(is_string($slug) && $slug !== '', static fn ($q) => $q->where('slug', $slug)))
            ->whereHas('vehicle', static fn ($q) => $q->when(is_string($hsn) && $hsn !== '', static fn ($q) => $q->where('hsn', $hsn))
                ->when(is_string($tsn) && $tsn !== '', static fn ($q) => $q->where('tsn', strtoupper((string) $tsn))))
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        // A real wheel first, where the shop has one: the acceptance set's is checked only while it is all there is.
        foreach ($rows->sortBy(static fn (Fitment $row): int => (int) (bool) $row->wheelConfig?->wheelModel?->is_demo) as $row) {
            if ($row->wheelConfig === null || $row->vehicle === null) {
                continue;
            }

            if ($resolver->resolve((int) $row->vehicle_id, (int) $row->wheel_config_id)->isSellable()) {
                return ['config' => $row->wheelConfig, 'vehicle' => $row->vehicle];
            }
        }

        return null;
    }

    /**
     * What the smoke does about an order: `order` — place and pay one — only where it was asked for by name, payments are
     * in test mode and the wheel is the shop's own; otherwise `before` (the way to the purchase, read and not pressed),
     * `demo` (the acceptance set's wheel: the same way, and never an order, asked or not — nobody buys it on the preview)
     * or `none` (no test payment here).
     *
     * An order's frozen approval is never deleted (R-12). Until 13.10.2026 the smoke ordered whenever it could, and a
     * release left a paid test order in the shop the client works in (RMF-2026-0003). It never orders by itself now.
     *
     * @return 'order'|'before'|'demo'|'none'
     */
    public static function orderStep(bool $demoWheel, bool $sandbox, bool $asked): string
    {
        return match (true) {
            ! $sandbox => 'none',
            $demoWheel => 'demo',
            $asked => 'order',
            default => 'before',
        };
    }

    /**
     * Whether the step walks to the point before ordering (the checkout row, D-224): every step with a test payment that
     * places no order — the acceptance set's wheel too, which once the client's own entries were taken back (16.10.2026)
     * is the only released wheel on the preview. The walk writes no row of the shop's.
     */
    public static function walksToCheckout(string $step): bool
    {
        return in_array($step, ['before', 'demo'], true);
    }

    /**
     * One wheel into this run's own basket (a session, no row of the shop's), then the basket and the checkout as the
     * customer would see them: the wheel's price as the line, and the button the law names (§ 312j BGB) — read, not pressed.
     */
    private function toThePointBeforeOrdering(WheelConfig $config): string
    {
        $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => (string) $config->id, 'quantity' => '1']);
        $price = GermanFormat::money((int) $config->price_cents);

        $basket = $this->get('/warenkorb');
        $this->expect($basket->status() === 200, "Warenkorb: HTTP {$basket->status()}");
        $this->expect(str_contains(self::rendered($basket->body()), $price), "der Warenkorb zeigt {$price} nicht");

        $checkout = $this->get('/kasse');
        $this->expect($checkout->status() === 200, "Kasse: HTTP {$checkout->status()}");
        $page = self::rendered($checkout->body());
        $this->expect(str_contains($page, $price), "die Kasse zeigt {$price} nicht");
        // The button stands on the checkout's third step, which only an order the server creates reaches — a smoke that
        // may not order never sees it on the page. What it can see is that the release's own checkout carries it
        // (§ 312j Abs. 3 BGB), word for word (D-224).
        $this->expect(self::orderButtonShips(public_path('build')), 'der Code der Kasse enthält den Knopf „Zahlungspflichtig bestellen“ nicht');

        return "1 × {$price} im Warenkorb und in der Kasse; ihr Knopf „Zahlungspflichtig bestellen“ ist im ausgelieferten Code – nicht gedrückt";
    }

    /** Whether the built checkout (the manifest's entry for the page) carries the order button's words. */
    public static function orderButtonShips(string $buildDir): bool
    {
        $manifest = json_decode((string) @file_get_contents($buildDir.'/manifest.json'), true);
        $file = is_array($manifest) ? ($manifest['resources/js/Pages/Kasse/Index.vue']['file'] ?? null) : null;

        return is_string($file) && str_contains((string) @file_get_contents($buildDir.'/'.$file), 'Zahlungspflichtig bestellen');
    }

    /** One wheel into the basket, the checkout, „Zahlung erfolgreich“ — and the confirmation says Bezahlt. */
    private function order(WheelConfig $config): string
    {
        $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => (string) $config->id, 'quantity' => '1']);
        $checkout = $this->post('/kasse', [
            'email' => 'smoke@example.com', 'phone' => '', 'name' => 'Smoke Test', 'street' => 'Teststraße',
            'houseNumber' => '1', 'zip' => '10115', 'city' => 'Berlin', 'billingSame' => '1', 'shipping' => 'standard',
        ]);
        $payment = (string) $checkout->header('Location');
        $this->expect(str_contains($payment, '/kasse/testzahlung/'), 'die Kasse hat keine Testzahlung begonnen (HTTP '.$checkout->status().')');

        $paid = $this->post($payment, ['outcome' => 'bezahlt']);
        $confirmation = (string) $paid->header('Location');
        // The address carries the order's public id, its number stands on the page (D-354).
        $this->expect(preg_match('#/bestellung/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}#', $confirmation) === 1, 'keine Bestellbestätigung nach der Zahlung');
        $page = self::rendered($this->get($confirmation)->body());
        $this->expect(preg_match('#\b(\d{4}-\d{5,})\b#', $page, $number) === 1 && str_contains($page, 'Bezahlt'), 'die Bestätigung zeigt die bezahlte Bestellung nicht');

        // Nothing to put back on a shelf: since his admin items 7 and 10 nothing is counted (D-299, D-301), so a paid test
        // order takes no stock the client reviews — what D-146 once returned by hand.
        return "{$number[1]} bezahlt (Testzahlung, kein Geld)";
    }

    /** Public prefixes readable over HTTP, `invoices/` not — on the bucket by the S3 audit's own probes. */
    private function storage(StorageSettings $settings, S3Audit $audit, MediaDisks $disks): string
    {
        $current = $settings->current();

        if ($current->isBucket()) {
            $failed = array_filter($audit->run($current)['rows'], static fn (array $r): bool => $r['status'] === 'fail');
            $this->expect($failed === [], implode(' · ', array_map(static fn (array $r): string => "{$r['n']} {$r['check']}", $failed)));

            return 'Bucket: 10 Prüfungen, invoices/ antwortet 403';
        }

        $probe = 'smoke/'.Str::lower((string) Str::ulid()).'.txt';
        $seen = [];

        foreach (['media_products', 'media_site', 'docs_public'] as $name) {
            $disk = $disks->build($name);
            $disk->put($probe, 'rimify smoke');

            try {
                // The address as the site answers it: APP_URL's host may differ from the site checked.
                $status = self::http(10)->get($this->base.(string) parse_url($disk->url($probe), PHP_URL_PATH))->status();
                $this->expect($status === 200, "{$name}: öffentliche Datei antwortet HTTP {$status}");
                $seen[] = $name;
            } finally {
                $disk->delete($probe);
            }
        }

        $private = $disks->build('docs_private');
        $private->put($probe, 'rimify smoke');

        try {
            $status = self::http(10)->get($this->base.'/storage/'.config('media.disks.docs_private.prefix').'/'.$probe)->status();
            $this->expect($status !== 200, 'invoices/ ist öffentlich lesbar');
        } finally {
            $private->delete($probe);
        }

        return 'lokal: '.count($seen).' öffentliche lesbar, invoices/ nicht';
    }

    /**
     * System › Zurücksetzen as every role meets it (ResetScreenProbe) — and as a guest meets it from outside: the sign-in
     * where the reset is available, the 404 everywhere else.
     */
    private function resetScreen(ResetScreenProbe $probe): string
    {
        $available = ResetScreenProbe::available();
        $statuses = $probe->statuses();
        $faults = ResetScreenProbe::faults($statuses, $available);

        $guest = self::http(15)->withoutRedirecting()->get($this->base.ResetScreenProbe::URL);
        $signIn = $guest->redirect() && str_contains((string) $guest->header('Location'), '/admin/anmelden');

        if ($available && ! $signIn) {
            $faults[] = "ohne Anmeldung HTTP {$guest->status()} statt der Weiterleitung zur Anmeldung";
        } elseif (! $available && $guest->status() !== 404) {
            $faults[] = "ohne Anmeldung HTTP {$guest->status()} statt 404";
        }

        $this->expect($faults === [], implode(' · ', $faults));
        $others = count($statuses) - ($available ? 1 : 0);

        return $available
            ? "Super-Admin 200, {$others} weitere Rollen 404, ohne Anmeldung zur Anmeldung"
            : 'alle '.count($statuses).' Rollen und ohne Anmeldung 404 – hier nicht verfügbar: '.(TestEnvironment::refusal() ?? 'nicht verfügbar');
    }

    private function check(string $name, callable $run): void
    {
        try {
            $this->rows[] = [$name, 'ok', (string) $run()];
        } catch (Throwable $e) {
            $this->rows[] = [$name, 'FEHLER', $e->getMessage()];
        }
    }

    private function expect(bool $condition, string $failure): void
    {
        if (! $condition) {
            throw new \RuntimeException($failure);
        }
    }

    /**
     * The product page's „Gutachten öffnen“ link, wherever `href` stands among its attributes: since the page's rework it
     * follows `class` (`<a class="link" href="…">`), and the smoke on the preview read that as no link (03.10.2026).
     */
    public static function pdfLink(string $html, string $label = 'Gutachten öffnen'): ?string
    {
        return preg_match('#<a\b[^>]*?\bhref="([^"]+)"[^>]*>\s*'.preg_quote($label, '#').'#u', $html, $link) === 1 ? html_entity_decode($link[1]) : null;
    }

    /** Whether a „Gutachten öffnen“ link leads to the page that marks an example document first (D-239). */
    public static function isExamplePage(string $link): bool
    {
        return preg_match('#^(?:https?://[^/]+)?/gutachten/\d+/beispiel(?:[?\#]|$)#', $link) === 1;
    }

    /** The page as a browser without JavaScript shows it: the page data (JSON) is taken out first. */
    private static function rendered(string $html): string
    {
        return (string) preg_replace('#<script\b[^>]*data-page[^>]*>.*?</script>#s', '', $html);
    }

    /** Every request of the smoke test, as a visitor sends it: no credentials of any kind (D-088). */
    private static function http(int $seconds): PendingRequest
    {
        return Http::timeout($seconds);
    }

    private function client(): PendingRequest
    {
        $xsrf = $this->jar->getCookieByName('XSRF-TOKEN')?->getValue();

        return self::http(30)
            ->withOptions(['cookies' => $this->jar, 'allow_redirects' => false])
            ->withHeaders(array_filter(['Accept' => 'text/html', 'X-XSRF-TOKEN' => $xsrf === null ? null : urldecode($xsrf)]));
    }

    private function get(string $path): Response
    {
        $response = $this->client()->get(Str::startsWith($path, 'http') ? $path : $this->base.$path);

        // One redirect is followed, as a browser would (a slash, a chosen car).
        $location = $response->header('Location');

        if ($response->redirect() && $location !== '') {
            return $this->client()->get(Str::startsWith($location, 'http') ? $location : $this->base.$location);
        }

        return $response;
    }

    /** @param  array<string, string>  $fields */
    private function post(string $path, array $fields): Response
    {
        if ($this->jar->getCookieByName('XSRF-TOKEN') === null) {
            $this->get('/');
        }

        return $this->client()->asForm()->post(Str::startsWith($path, 'http') ? $path : $this->base.$path, $fields);
    }
}
