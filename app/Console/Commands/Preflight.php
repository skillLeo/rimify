<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Payments\PaymentConfig;
use App\Payments\Payments;
use App\Payments\StripeKeys;
use App\Providers\AppServiceProvider;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\InvoiceSeries;
use App\Services\Content\LegalTexts;
use App\Services\Demo\DemoTables;
use App\Services\Storage\S3Audit;
use App\Services\Storage\StorageSettings;
use App\Support\DatabaseEngine;
use App\Support\PreviewGate;
use App\Support\ScheduleBeat;
use App\Support\Seller;
use App\Support\Shipping;
use App\Support\Ssr\BoundedSsrGateway;
use App\Support\Ssr\SsrFallbacks;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
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
 * shipping and delivery time, the legal texts, GPSR per brand, and no credential in the code (Block G §8).
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
        $rows[] = $this->previewGate($production);

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
     * The preview's password (App\Support\PreviewGate): on the preview, in front of every page and of /storage; on the
     * live shop, nowhere — a customer asked for a password there is a customer lost.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function previewGate(bool $production): array
    {
        $files = is_file(PreviewGateFiles::htaccessPath()) && str_starts_with((string) file_get_contents(PreviewGateFiles::htaccessPath()), PreviewGateFiles::MARKER);

        if ($production) {
            return PreviewGate::enabled() || $files
                ? ['Vorschau-Schutz', 'warn', 'Der Live-Shop fragt nach einem Passwort – RIMIFY_PREVIEW_* aus .env nehmen, dann rimify:preview-gate']
                : ['Vorschau-Schutz', 'ok', 'aus – der Live-Shop ist offen'];
        }

        if (! app()->environment('staging')) {
            return ['Vorschau-Schutz', 'skip', PreviewGate::enabled() ? 'Passwort gesetzt' : 'kein Passwort (lokal)'];
        }

        if (! PreviewGate::enabled()) {
            return ['Vorschau-Schutz', 'warn', 'Die Vorschau ist ohne Passwort erreichbar – RIMIFY_PREVIEW_USER und RIMIFY_PREVIEW_PASSWORD in .env'];
        }

        return $files
            ? ['Vorschau-Schutz', 'ok', 'Passwort vor jeder Seite und vor /storage, noindex']
            : ['Vorschau-Schutz', 'warn', 'Seiten geschützt, /storage nicht – php artisan rimify:preview-gate'];
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
