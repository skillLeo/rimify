<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Payments\PaymentConfig;
use App\Payments\Payments;
use App\Payments\StripeKeys;
use App\Providers\AppServiceProvider;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\InvoiceSeries;
use App\Services\Content\LegalTexts;
use App\Services\Demo\DemoTables;
use App\Services\Reset\TestEnvironment;
use App\Services\Storage\S3Audit;
use App\Services\Storage\StorageSettings;
use App\Support\DatabaseEngine;
use App\Support\ScheduleBeat;
use App\Support\Security\KnownPasswords;
use App\Support\Seller;
use App\Support\Shipping;
use App\Support\Ssr\BoundedSsrGateway;
use App\Support\Ssr\SsrFallbacks;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * `rimify:preflight`: launch day is this command and a green board. One row per thing that must be
 * right before the shop takes orders; go when none fails. Grows with the launch ledger (M8): the
 * application, rendering, mail, the payment driver, its mode and its webhook, the queue and the
 * scheduler, the database and its engine, the demo data (R-12), the media storage — the full S3 audit
 * as one row, with `--skip-s3` for a quick look — the invoices' private storage, the seller's data,
 * shipping and delivery time, the legal texts, GPSR per brand, no credential in the code (Block G §8), and no admin
 * account that opens with a password from the repository (D-141).
 * A row the live shop cannot go without is NO-GO in production and a warning everywhere else.
 */
final class Preflight extends Command
{
    protected $signature = 'rimify:preflight {--skip-s3 : Leave out the bucket audit (it writes and reads probe files)}';

    protected $description = 'Go / no-go: environment, rendering, mail, payment, database, demo data and media storage';

    public function handle(StorageSettings $settings, S3Audit $audit): int
    {
        $rows = [];

        $rows[] = ['Anwendungsschlüssel', filled(config('app.key')) ? 'ok' : 'fail', filled(config('app.key')) ? 'gesetzt' : 'APP_KEY fehlt'];

        $debug = (bool) config('app.debug') || app()->bound(AppServiceProvider::DEBUG_WAS_ON);
        $production = app()->environment('production');
        $rows[] = ['Umgebung', $production && $debug ? 'fail' : 'ok', app()->environment().($debug ? ', APP_DEBUG=true in .env – auf false setzen' : ', Debug aus')];

        $url = (string) config('app.url');
        $rows[] = ['Adresse', str_starts_with($url, 'https://') ? 'ok' : ($production ? 'fail' : 'warn'), $url];
        $rows[] = $this->searchEngines($production);

        $rows[] = $this->rendering($production);
        $rows[] = $this->mail($production, $url);
        $rows[] = $this->payment($production);
        $rows[] = $this->paymentKeys($production);
        $rows[] = $this->webhook($production);
        $rows[] = $this->queue($production);
        $rows[] = $this->schedule($production);

        try {
            DB::connection()->getPdo();
            $rows[] = ['Datenbank', 'ok', DB::connection()->getDatabaseName()];
            $version = (string) DB::selectOne('SELECT VERSION() AS v')->v;
            $refusal = DatabaseEngine::refusal($version);
            [$engine] = DatabaseEngine::parse($version);
            $rows[] = ['Datenbank-Engine', $refusal === null ? 'ok' : 'fail', $refusal ?? "{$engine} {$version} – die Suite läuft auf ".implode(' und ', DatabaseEngine::tested())];
        } catch (Throwable $e) {
            $rows[] = ['Datenbank', 'fail', $e->getMessage()];
        }

        try {
            Artisan::call('migrate:status', ['--pending' => true]);
            $pending = substr_count(Artisan::output(), 'Pending');
            $rows[] = ['Migrationen', $pending === 0 ? 'ok' : 'fail', $pending === 0 ? 'alle ausgeführt' : "{$pending} ausstehend"];
        } catch (Throwable $e) {
            $rows[] = ['Migrationen', 'fail', $e->getMessage()];
        }

        $demo = DemoTables::total();
        $rows[] = ['Demodaten', $demo === 0 ? 'ok' : ($production ? 'fail' : 'warn'), $demo === 0 ? 'keine' : "{$demo} Datensätze – vor dem Start demo:purge"];
        $rows[] = $this->releases($production);
        $rows[] = $this->testReset($production);

        $current = $settings->current();
        $rows[] = ['Speicher: Quelle', $current->isBucket() ? 'ok' : ($production ? 'fail' : 'warn'), match ($current->source) {
            'database' => 'Einstellungen im Admin',
            'env' => 'Werte aus der .env-Datei',
            default => 'lokaler Speicher, kein Bucket',
        }];

        if ($this->option('skip-s3') || ! $current->isBucket()) {
            $rows[] = ['Speicher: S3-Audit', 'skip', $current->isBucket() ? 'mit --skip-s3 ausgelassen' : 'kein Bucket'];
        } else {
            $result = $audit->run($current);
            $failed = array_filter($result['rows'], static fn (array $r): bool => $r['status'] === 'fail');
            $warned = array_filter($result['rows'], static fn (array $r): bool => $r['status'] === 'warn');
            $rows[] = ['Speicher: S3-Audit', $failed === [] ? ($warned === [] ? 'ok' : 'warn') : 'fail', $failed === []
                ? '10 Prüfungen, '.count($warned).' Warnungen (rimify:s3-audit für die Einzelheiten)'
                : implode(' · ', array_map(static fn (array $r): string => "{$r['n']} {$r['check']}", $failed))];
        }

        $rows[] = ['Speicher-Tabelle', Schema::hasTable('storage_settings') ? 'ok' : 'fail', Schema::hasTable('storage_settings') ? 'vorhanden' : 'Migration fehlt'];
        $rows[] = $this->invoiceStorage();
        $rows[] = $this->invoiceSeries($production);
        $rows[] = $this->seller($production);
        $rows[] = $this->shippingTerms($production);
        $rows[] = $this->legalTexts($production);
        $rows[] = $this->gpsr($production);
        $rows[] = $this->secrets();
        $rows[] = $this->knownPasswords($production);

        $marks = ['ok' => 'GO', 'warn' => 'Warnung', 'fail' => 'NO-GO', 'skip' => '–'];
        $this->table(['Prüfung', 'Ergebnis', 'Befund'], array_map(static fn (array $r): array => [$r[0], $marks[$r[1]], $r[2]], $rows));

        $noGo = array_filter($rows, static fn (array $r): bool => $r[1] === 'fail');

        if ($noGo !== []) {
            $this->error('NO-GO: '.count($noGo).' Prüfung(en) fehlgeschlagen.');

            return self::FAILURE;
        }

        $this->info('GO.');

        return self::SUCCESS;
    }

    /**
     * Stripe sends its events here — registered, enabled, every event the shop acts on. Paid is only ever the
     * webhook's word, so without it no order is ever paid.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function webhook(bool $production): array
    {
        $gateway = Payments::gateway();

        if ($gateway === null || $gateway->method() !== 'stripe') {
            return ['Stripe-Webhook', 'skip', 'Stripe ist nicht der Zahlungsanbieter in Kraft'];
        }

        $url = route('webhooks.payment', ['provider' => 'stripe']);

        try {
            $problem = $gateway->webhookProblem($url);
        } catch (Throwable $e) {
            $problem = $e->getMessage();
        }

        return $problem === null ? ['Stripe-Webhook', 'ok', $url] : ['Stripe-Webhook', $production ? 'fail' : 'warn', $problem];
    }

    /**
     * Work after the response: on the shared host the queue is `sync` and a job runs straight after the answer
     * (D-054); with a real queue a worker must be taking jobs — one waiting five minutes means none is.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function queue(bool $production): array
    {
        $connection = (string) config('queue.default');

        if ($connection === 'sync') {
            return ['Warteschlange', 'ok', 'sync: Arbeit läuft direkt nach der Antwort, kein Worker nötig'];
        }

        try {
            $oldest = $connection === 'database' ? DB::table((string) config('queue.connections.database.table', 'jobs'))->min('available_at') : null;
        } catch (Throwable $e) {
            return ['Warteschlange', 'fail', $e->getMessage()];
        }

        if (is_numeric($oldest) && now()->getTimestamp() - (int) $oldest > 300) {
            return ['Warteschlange', $production ? 'fail' : 'warn', "{$connection}: ein Auftrag wartet seit über fünf Minuten – läuft ein Worker?"];
        }

        return ['Warteschlange', 'ok', "{$connection}: nichts wartet"];
    }

    /**
     * Search engines: the live shop is found, every other copy is not (D-088) — `X-Robots-Tag` on each page, robots.txt
     * saying „no", and the same header on the files the web server hands out itself (`rimify:storage-headers`). Nothing
     * asks for a password anywhere; the admin has its own sign-in.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function searchEngines(bool $production): array
    {
        $files = StorageHeaders::written();

        if ($production) {
            return $files
                ? ['Suchmaschinen', 'warn', 'Die Dateien unter /storage tragen noindex – php artisan rimify:storage-headers']
                : ['Suchmaschinen', 'ok', 'Der Live-Shop ist auffindbar'];
        }

        if (! app()->environment('staging')) {
            return ['Suchmaschinen', 'skip', 'lokal'];
        }

        return $files
            ? ['Suchmaschinen', 'ok', 'noindex auf jeder Seite und unter /storage, robots.txt sperrt alles']
            : ['Suchmaschinen', 'warn', 'Seiten noindex, /storage nicht – php artisan rimify:storage-headers'];
    }

    /**
     * In the live shop every Gutachten is released by a person in the browser. A release carried out on the operator's
     * written instruction (rimify:gutachten-freigeben) belongs to a test environment; one in this database means it
     * came from there — a copied database, a misnamed environment — and the shop does not go live on it.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function releases(bool $production): array
    {
        try {
            $count = DB::table('audit_logs')
                ->where('description', 'approval.released')
                ->whereNotNull('properties->'.DocumentRelease::ON_INSTRUCTION)
                ->count();
        } catch (Throwable $e) {
            return ['Freigaben', 'fail', $e->getMessage()];
        }

        if ($count === 0) {
            return ['Freigaben', 'ok', 'jede Freigabe im Browser gegeben'];
        }

        $found = ($count === 1 ? 'eine Freigabe' : "{$count} Freigaben").' auf Anweisung über die Kommandozeile';

        return $production
            ? ['Freigaben', 'fail', "{$found} – im Live-Shop gibt jede Freigabe eine Person im Browser"]
            : ['Freigaben', 'ok', "{$found}, in der Testumgebung zulässig"];
    }

    /**
     * Testumgebung zurücksetzen exists in a test environment only (CLAUDE.md R-04.1): in production its address is not
     * registered and the service refuses on its own (TestEnvironment). A live shop on which the address answers is
     * NO-GO — whatever let it in (a misnamed environment, a cached route list from staging) would let one click empty
     * the shop. So is a live shop whose server says RIMIFY_RESET_ERLAUBT=true, or whose database does not name itself
     * the live shop's: that row is what refuses a reset should a test server ever be pointed at it.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function testReset(bool $production): array
    {
        $routed = Route::has('admin.zuruecksetzen.show') || Route::has('admin.zuruecksetzen.store');
        $database = TestEnvironment::databaseEnvironment();

        if ($production) {
            $lines = TestEnvironment::flagLines();

            // Every fault at once: whoever reads the NO-GO fixes them in one go.
            $faults = array_values(array_filter([
                $routed || TestEnvironment::available() ? 'im Live-Shop erreichbar – die Routen dürfen hier nicht registriert sein (Routen-Cache neu bauen: php artisan optimize)' : null,
                match (true) {
                    config('rimify.reset.allowed') === true => TestEnvironment::FLAG.'=true steht in der Umgebung des Live-Shops – herausnehmen',
                    // GO-LIVE.md §6.3: in the live shop the line is a defect whatever it says.
                    $lines !== [] => TestEnvironment::FLAG.' steht in der .env des Live-Shops („'.implode('“, „', $lines).'“) – herausnehmen, auch false gehört dort nicht hin',
                    default => null,
                },
                $database !== 'production' ? 'die Datenbank nennt sich nicht die des Live-Shops ('.TestEnvironment::MARKER.': '.($database ?? 'fehlt').') – so schützt sie nichts vor einem Zurücksetzen' : null,
            ]));

            return $faults === []
                ? ['Testumgebung zurücksetzen', 'ok', 'im Live-Shop nicht erreichbar, die Datenbank als Live-Datenbank gekennzeichnet']
                : ['Testumgebung zurücksetzen', 'fail', implode('; ', $faults)];
        }

        $refusal = TestEnvironment::refusal();

        return ['Testumgebung zurücksetzen', 'ok', match (true) {
            ! $routed => 'nicht registriert',
            $refusal !== null => 'hier gesperrt: '.$refusal,
            default => 'erreichbar, nur in dieser Testumgebung',
        }];
    }

    /**
     * The cron line runs the scheduler: unpaid orders expire, the demo check runs, the renderer is watched. Its
     * pulse is written every minute.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function schedule(bool $production): array
    {
        $ago = ScheduleBeat::secondsAgo();

        if ($ago === null) {
            return ['Zeitplan (Cron)', $production ? 'fail' : 'warn', 'noch nie gelaufen – die Cron-Zeile für schedule:run fehlt (GO-LIVE.md)'];
        }

        return $ago <= 180
            ? ['Zeitplan (Cron)', 'ok', "zuletzt vor {$ago} s"]
            : ['Zeitplan (Cron)', $production ? 'fail' : 'warn', 'zuletzt vor '.intdiv($ago, 60).' min – läuft die Cron-Zeile noch?'];
    }

    /**
     * Invoices sit on the private disk, outside anything the web server hands out: the link to one is signed.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function invoiceStorage(): array
    {
        $dir = realpath(Storage::disk(Invoices::DISK)->path('')) ?: Storage::disk(Invoices::DISK)->path('');
        $public = realpath(public_path()) ?: public_path();
        $exposed = str_starts_with(str_replace('\\', '/', $dir), str_replace('\\', '/', $public)) || is_dir(public_path('storage/'.Invoices::DIR));

        return $exposed
            ? ['Rechnungen', 'fail', 'Der Ordner invoices/ liegt im öffentlichen Verzeichnis – er gehört auf die private Platte']
            : ['Rechnungen', 'ok', 'privat ('.Invoices::DIR.'/), nur über signierte Links'];
    }

    /**
     * The real invoice numbers, opened once at the client's own (InvoiceSeries): until then every invoice is a test
     * invoice — on the live shop, a paying customer would get one.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function invoiceSeries(bool $production): array
    {
        try {
            $state = InvoiceSeries::state();
        } catch (Throwable $e) {
            return ['Rechnungsnummern', 'fail', $e->getMessage()];
        }

        if ($state['invoice'] === null || $state['credit_note'] === null) {
            return ['Rechnungsnummern', $production ? 'fail' : 'warn', 'nicht eröffnet – jede Rechnung ist eine Testrechnung (Einstellungen › Zahlung)'];
        }

        return ['Rechnungsnummern', 'ok', "nächste {$state['invoice']['next']} und {$state['credit_note']['next']}, eröffnet am {$state['invoice']['openedAt']} von {$state['invoice']['openedBy']}"];
    }

    /** @return array{0: string, 1: string, 2: string} */
    private function seller(bool $production): array
    {
        $missing = Seller::current()->missing();

        return $missing === []
            ? ['Verkäuferangaben', 'ok', 'vollständig für Rechnung und Widerrufsformular']
            : ['Verkäuferangaben', $production ? 'fail' : 'warn', 'fehlt: '.implode(', ', $missing).' (Einstellungen › Verkäufer & Versand) – bis dahin nur Testrechnungen'];
    }

    /** @return array{0: string, 1: string, 2: string} */
    private function shippingTerms(bool $production): array
    {
        $shipping = Shipping::current();
        $missing = $shipping->missing();

        return $missing === []
            ? ['Versand und Lieferzeit', 'ok', (string) $shipping->summary()]
            : ['Versand und Lieferzeit', $production ? 'fail' : 'warn', 'fehlt: '.implode(', ', $missing).' (Einstellungen › Verkäufer & Versand) – ohne sie nimmt der Shop keine echte Bestellung an'];
    }

    /** @return array{0: string, 1: string, 2: string} */
    private function legalTexts(bool $production): array
    {
        $legal = app(LegalTexts::class);
        $open = array_values(array_filter(['impressum', 'datenschutz', 'agb', 'widerrufsbelehrung'], static fn (string $slug): bool => $legal->placeholder($slug)));

        return $open === []
            ? ['Rechtstexte', 'ok', 'Impressum, Datenschutz, AGB, Widerrufsbelehrung hinterlegt']
            : ['Rechtstexte', $production ? 'fail' : 'warn', 'noch Platzhalter: '.implode(', ', $open).' (BLOCKED #4)'];
    }

    /**
     * GPSR: every wheel on sale names its manufacturer (Katalog › Marken › Herstellerangaben).
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function gpsr(bool $production): array
    {
        $brands = Brand::query()
            ->whereHas('wheelModels', static fn ($q) => $q->where('status', CatalogueStatus::Published->value))
            ->orderBy('name')
            ->get()
            ->filter(static fn (Brand $brand): bool => $brand->manufacturer() === null)
            ->pluck('name')
            ->all();

        return $brands === []
            ? ['Herstellerangaben (GPSR)', 'ok', 'für jede Marke im Verkauf']
            : ['Herstellerangaben (GPSR)', $production ? 'fail' : 'warn', 'fehlen für: '.implode(', ', $brands)];
    }

    /**
     * No credential in the code the shop runs (R-16). The folders the release carries, file by file — `.env` is not
     * among them, and is where keys belong.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function secrets(): array
    {
        $paths = array_values(array_filter(['app', 'bootstrap', 'config', 'database', 'resources', 'routes', 'public'], static fn (string $dir): bool => is_dir(base_path($dir))));
        $code = Artisan::call('secrets:scan', ['paths' => array_map('base_path', $paths)]);
        $output = trim(Artisan::output());

        return $code === 0
            ? ['Geheimnisse im Code', 'ok', 'keines gefunden']
            : ['Geheimnisse im Code', 'fail', Str::limit(str_replace("\n", ' ', $output), 200)];
    }

    /**
     * No admin account opens with a password that has stood in the repository (D-141): on the preview ten did until
     * 02.10.2026, two of them Super-Admin, and the live shop's first seed would have made seven more.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function knownPasswords(bool $production): array
    {
        try {
            $open = KnownPasswords::openAccounts();
        } catch (Throwable $e) {
            return ['Bekannte Passwörter', 'fail', $e->getMessage()];
        }

        return $open === []
            ? ['Bekannte Passwörter', 'ok', 'kein Konto öffnet mit einem Passwort, das im Repository stand']
            : ['Bekannte Passwörter', $production ? 'fail' : 'warn', 'öffnen mit einem Passwort aus dem Repository: '.implode(', ', $open).' – neu setzen mit rimify:admin-passwort'];
    }

    /**
     * The renderer answers: without it pages are drawn by the browser and empty for search engines.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function rendering(bool $production): array
    {
        if (config('inertia.ssr.enabled', true) !== true) {
            return ['Server-Rendering', $production ? 'fail' : 'warn', 'ausgeschaltet (INERTIA_SSR_ENABLED)'];
        }

        // Asked the way the pages ask it: through its socket where it listens on one (D-047).
        $socket = BoundedSsrGateway::socket();
        $url = $socket ?? rtrim((string) config('inertia.ssr.url', 'http://127.0.0.1:13714'), '/');

        try {
            $ready = BoundedSsrGateway::client($socket)->timeout(2)
                ->get(($socket === null ? $url : 'http://localhost').'/health')->successful();
        } catch (Throwable) {
            $ready = false;
        }

        return $ready
            ? ['Server-Rendering', 'ok', "Renderer antwortet ({$url}); heute ".SsrFallbacks::today().' Seiten ohne']
            : ['Server-Rendering', $production ? 'fail' : 'warn', "Renderer antwortet nicht ({$url}) – deploy/ssr-watch.sh"];
    }

    /**
     * Mail really leaves the server, and from the shop's own domain.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function mail(bool $production, string $url): array
    {
        $mailer = (string) config('mail.default');
        $from = (string) config('mail.from.address');

        if (in_array($mailer, ['log', 'array'], true)) {
            return ['E-Mail', $production ? 'fail' : 'warn', "MAIL_MAILER={$mailer}: nichts wird verschickt"];
        }

        $host = (string) parse_url($url, PHP_URL_HOST);
        $domain = Str::after($from, '@');
        $own = $domain !== '' && ($domain === $host || str_ends_with($host, '.'.$domain) || str_ends_with($domain, '.'.$host));

        return ['E-Mail', $own ? 'ok' : 'warn', "{$mailer}, Absender {$from}".($own ? '' : " – nicht die Domain von {$host}")];
    }

    /**
     * Which payment the shop takes: none until a provider is configured; the sandbox never in production.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function payment(bool $production): array
    {
        $driver = (string) config('rimify.payments.driver', 'none');

        if ($production && $driver === 'sandbox') {
            return ['Zahlung', 'fail', 'RIMIFY_PAYMENTS=sandbox im Live-Shop – auf none oder den Anbieter setzen'];
        }

        $stripe = Payments::checkout();

        return match (true) {
            Payments::sandbox() => ['Zahlung', 'warn', 'Testzahlung (Sandbox): Bestellungen sind Tests, es fließt kein Geld'],
            Payments::gateway() === null => ['Zahlung', 'warn', 'kein Zahlungsanbieter eingerichtet: der Shop nimmt keine Bestellungen an (BLOCKED #3)'],
            $stripe !== null && $stripe['testMode'] => ['Zahlung', $production ? 'warn' : 'ok', 'Stripe im Testmodus ('.PaymentConfig::current()->summary()['source'].'): es wird kein Geld abgebucht'],
            $stripe !== null => ['Zahlung', 'ok', 'Stripe im Livemodus ('.PaymentConfig::current()->summary()['source'].')'],
            default => ['Zahlung', 'ok', $driver],
        };
    }

    /**
     * The Stripe keys from .env belong to their mode and to this installation (StripeKeys): a refused
     * key is not used, and the launch waits until .env is corrected.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function paymentKeys(bool $production): array
    {
        $refused = app()->bound(StripeKeys::REFUSED) ? app(StripeKeys::REFUSED) : [];

        if (is_array($refused) && $refused !== []) {
            return ['Zahlungsschlüssel', 'fail', implode(' ', array_map(static fn (string $field, string $why): string => "STRIPE_{$field}: {$why}", array_map('strtoupper', array_keys($refused)), $refused))];
        }

        $mode = config('services.stripe.mode') === StripeKeys::LIVE ? 'Livemodus' : 'Testmodus';
        // An old .env.example's `sk_test_replace_me` is a placeholder, not a key.
        $set = filled(config('services.stripe.secret')) && ! str_contains((string) config('services.stripe.secret'), 'replace');

        return match (true) {
            ! $set => ['Zahlungsschlüssel', 'skip', "{$mode}, keine Schlüssel in .env (Einstellungen › Zahlung)"],
            $production && $mode === 'Testmodus' => ['Zahlungsschlüssel', 'warn', 'Testmodus im Live-Shop: es wird kein Geld abgebucht'],
            default => ['Zahlungsschlüssel', 'ok', "{$mode}, Schlüssel …".substr((string) config('services.stripe.secret'), -4)],
        };
    }
}
