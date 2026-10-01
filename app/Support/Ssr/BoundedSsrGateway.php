<?php

declare(strict_types=1);

namespace App\Support\Ssr;

use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\StrayRequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Vite;
use Inertia\Ssr\HttpGateway;
use Inertia\Ssr\Response;
use Inertia\Ssr\SsrException;

/**
 * Server-side rendering that can never make a page slow.
 *
 * Inertia asks the Node renderer with the HTTP client's defaults — up to 10 seconds to connect and
 * 30 to answer. On a shared host the renderer is one process that the host may stop at any time; a
 * stalled or queued renderer then held every page for seconds. Here it gets a short time to connect
 * and a bounded time to render. When it fails, pages are sent without server rendering for a short
 * while (the browser renders them, the first frame's data is the same, R-08), and it is asked again
 * after that — never once per page while it is down. Every page sent without it is counted and
 * logged with its URL (SsrFallbacks): a fallback is never invisible.
 */
class BoundedSsrGateway extends HttpGateway
{
    /** Set while the renderer is not asked. */
    public const PAUSE_KEY = 'ssr.paused';

    public function dispatch(array $page, ?Request $request = null): ?Response
    {
        $request ??= request();

        if (! $this->ssrIsEnabled($request)) {
            return null;
        }

        $isHot = Vite::isRunningHot();

        if (! $isHot && $this->shouldEnsureBundleExists() && ! $this->bundleExists()) {
            SsrFallbacks::record($request->fullUrl(), 'Das Renderer-Bundle fehlt.', 'bootstrap/ssr');

            return null;
        }

        if (self::paused()) {
            SsrFallbacks::record($request->fullUrl(), 'Der Renderer pausiert nach einem Fehler.');

            return null;
        }

        $socket = $isHot ? null : self::socket();
        $url = match (true) {
            $isHot => $this->getHotUrl('/__inertia_ssr'),
            $socket !== null => 'http://localhost/render',
            default => $this->getProductionUrl('/render'),
        };

        try {
            $response = self::client($socket)
                ->timeout((float) config('rimify.ssr.timeout', 2.5))
                ->post($url, $page);

            if ($response->failed()) {
                SsrFallbacks::record($request->fullUrl(), 'Der Renderer hat mit HTTP '.$response->status().' geantwortet.');
                $this->handleSsrFailure($page, $response->json());

                return null;
            }

            if (! $data = $response->json()) {
                SsrFallbacks::record($request->fullUrl(), 'Der Renderer hat leer geantwortet.');

                return null;
            }

            return new Response(implode("\n", $data['head'] ?? []), $data['body'] ?? '');
        } catch (Exception $e) {
            if ($e instanceof StrayRequestException || $e instanceof SsrException) {
                throw $e;
            }

            // Not reachable, or too slow: rest it, and let the browser render meanwhile.
            self::pause();
            SsrFallbacks::record($request->fullUrl(), 'Der Renderer war nicht erreichbar oder zu langsam.', mb_substr($e->getMessage(), 0, 300));
            $this->handleSsrFailure($page, ['error' => $e->getMessage(), 'type' => 'connection']);

            return null;
        }
    }

    /**
     * The renderer's socket file, where it listens on one (config rimify.ssr.socket): the shared host
     * reaches no port a customer's process opens (D-047). Null: the TCP address Inertia is given.
     */
    public static function socket(): ?string
    {
        $socket = config('rimify.ssr.socket');

        return is_string($socket) && $socket !== '' ? $socket : null;
    }

    /** The HTTP client for the renderer: through its socket where it has one, always with the short connect bound. */
    public static function client(?string $socket): PendingRequest
    {
        $client = Http::connectTimeout((float) config('rimify.ssr.connect_timeout', 0.5));

        return $socket === null ? $client : $client->withOptions(['curl' => [CURLOPT_UNIX_SOCKET_PATH => $socket]]);
    }

    public static function paused(): bool
    {
        try {
            return Cache::get(self::PAUSE_KEY) === true;
        } catch (Exception) {
            return false;
        }
    }

    public static function pause(): void
    {
        try {
            Cache::put(self::PAUSE_KEY, true, (int) config('rimify.ssr.pause', 30));
        } catch (Exception) {
            // Without a cache the next page asks again, within the same short bounds.
        }
    }
}
