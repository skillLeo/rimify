<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Enums\FitmentStatus;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Payments\Payments;
use App\Services\Storage\MediaDisks;
use App\Services\Storage\S3Audit;
use App\Services\Storage\StorageSettings;
use App\Support\GermanFormat;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Console\Command;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
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
        {--tsn= : TSN of that car}';

    protected $description = 'Smoke test of the running shop over HTTP: pages, SSR, lookup, PDF, admin, test order, storage';

    /** @var list<array{0: string, 1: string, 2: string}> */
    private array $rows = [];

    private CookieJar $jar;

    private string $base;

    public function handle(FitmentResolver $resolver, StorageSettings $settings, S3Audit $audit, MediaDisks $disks): int
    {
        $this->base = rtrim((string) ($this->option('url') ?: config('app.url')), '/');
        $this->jar = new CookieJar;
        $this->line("Smoke-Test gegen {$this->base}");

        $pair = $this->pair($resolver);

        $this->check('Startseite', function (): string {
            $response = $this->get('/');
            $this->expect($response->status() === 200, "HTTP {$response->status()}");
            $this->expect(str_contains($response->body(), 'data-server-rendered'), 'ohne Server-Rendering ausgeliefert');

            return '200, auf dem Server gerendert';
        });

        if ($pair === null) {
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
                $this->post('/fahrzeug/schluesselnummern', ['hsn' => $vehicle->hsn, 'tsn' => $vehicle->tsn]);
                // Several cars behind one pair of numbers: the chooser, and this one is chosen (R-01).
                $this->post('/fahrzeug', ['fahrzeug' => (string) $vehicle->id]);
                $html = self::rendered($this->get('/felgen/'.$slug)->body());
                $this->expect((bool) preg_match('/(Mit Auflagen freigegeben|Freigegeben) für ([^<]+)/u', $html, $m), 'keine Freigabe auf der Produktseite');
                preg_match('#<a href="([^"]+)"[^>]*>\s*Gutachten öffnen#u', $html, $link);
                $pdf = isset($link[1]) ? html_entity_decode($link[1]) : null;

                return trim($m[0]).' ('.$vehicle->hsn.'/'.$vehicle->tsn.')';
            });

            $this->check('Gutachten-PDF', function () use (&$pdf): string {
                $this->expect(is_string($pdf), 'kein PDF-Link auf der Produktseite');
                $url = (string) preg_replace('/#.*$/', '', (string) $pdf);
                $response = Http::timeout(20)->get(Str::startsWith($url, 'http') ? $url : $this->base.$url);
                $this->expect($response->status() === 200, "HTTP {$response->status()}");
                $this->expect(str_starts_with($response->body(), '%PDF-'), 'die Antwort ist kein PDF');

                return 'öffnet, Seite '.(preg_match('/#page=(\d+)/', (string) $pdf, $page) ? $page[1] : '–');
            });

            if (Payments::sandbox()) {
                $this->check('Testbestellung (Sandbox)', fn (): string => $this->order($config));
            } else {
                $this->rows[] = ['Testbestellung', 'übersprungen', 'Keine Testzahlung in dieser Umgebung (im Live-Shop immer aus).'];
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
            ->whereHas('wheelConfig', static fn ($q) => $q->where('stock_qty', '>', 0))
            ->whereHas('wheelConfig.wheelModel', static fn ($q) => $q->where('status', 'published')->where('is_demo', false)
                ->when(is_string($slug) && $slug !== '', static fn ($q) => $q->where('slug', $slug)))
            ->whereHas('vehicle', static fn ($q) => $q->when(is_string($hsn) && $hsn !== '', static fn ($q) => $q->where('hsn', $hsn))
                ->when(is_string($tsn) && $tsn !== '', static fn ($q) => $q->where('tsn', strtoupper((string) $tsn))))
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        foreach ($rows as $row) {
            if ($row->wheelConfig === null || $row->vehicle === null) {
                continue;
            }

            if ($resolver->resolve((int) $row->vehicle_id, (int) $row->wheel_config_id)->isSellable()) {
                return ['config' => $row->wheelConfig, 'vehicle' => $row->vehicle];
            }
        }

        return null;
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
        $this->expect(preg_match('#/bestellung/(RMF-[0-9-]+)#', $confirmation, $number) === 1, 'keine Bestellbestätigung nach der Zahlung');
        $page = self::rendered($this->get($confirmation)->body());
        $this->expect(str_contains($page, $number[1]) && str_contains($page, 'Bezahlt'), 'die Bestätigung zeigt die bezahlte Bestellung nicht');

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
                $status = Http::timeout(10)->get($this->base.(string) parse_url($disk->url($probe), PHP_URL_PATH))->status();
                $this->expect($status === 200, "{$name}: öffentliche Datei antwortet HTTP {$status}");
                $seen[] = $name;
            } finally {
                $disk->delete($probe);
            }
        }

        $private = $disks->build('docs_private');
        $private->put($probe, 'rimify smoke');

        try {
            $status = Http::timeout(10)->get($this->base.'/storage/'.config('media.disks.docs_private.prefix').'/'.$probe)->status();
            $this->expect($status !== 200, 'invoices/ ist öffentlich lesbar');
        } finally {
            $private->delete($probe);
        }

        return 'lokal: '.count($seen).' öffentliche lesbar, invoices/ nicht';
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

    /** The page as a browser without JavaScript shows it: the page data (JSON) is taken out first. */
    private static function rendered(string $html): string
    {
        return (string) preg_replace('#<script\b[^>]*data-page[^>]*>.*?</script>#s', '', $html);
    }

    private function client(): PendingRequest
    {
        $xsrf = $this->jar->getCookieByName('XSRF-TOKEN')?->getValue();

        return Http::timeout(30)
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
