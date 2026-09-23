@php
    /*
     * The page that needs nothing.
     *
     * It is rendered when the front end, the database or both may be gone: during a release
     * window (`artisan down` can pre-render it into a static file that is served before the
     * framework boots) and when the Inertia render of a 500 itself fails. So it names no asset
     * the build produces, reads no table, and carries its own stylesheet.
     *
     * The values in that stylesheet are the tokens from resources/css/tokens.css, copied as
     * literals for the same reason public/offline.html copies them: nothing here may depend on a
     * file the build writes. Change a token there, change it here.
     *
     * Three ways on, like every other failure state (R-09): try this page again, go to the shop,
     * write to us. Two of the three are plain links, so they work with no JavaScript at all.
     */
    $contact = $contact ?? \App\Services\Storefront\Chrome::contact();
    $status = $status ?? 503;
    $detail = $detail ?? null;

    $mailto = 'mailto:'.$contact['email']
        .'?subject='.rawurlencode('RIMIFY ist nicht erreichbar ('.$status.')')
        .'&body='.rawurlencode("Ich wollte die Seite öffnen und habe die Fehlerseite ".$status." bekommen.\r\n\r\nWas ich tun wollte:\r\n");
@endphp
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0b0f14">
    <meta name="robots" content="noindex">
    <title>{{ $title }} · RIMIFY</title>
    <style>
        :root {
            color-scheme: light;
            --c-ink: #0b0f14;
            --c-ink-2: #3a424d;
            --c-ink-3: #5f6875;
            --c-line: #e2e5e9;
            --c-line-2: #c9ced5;
            --c-surface: #ffffff;
            --c-band: #f3f4f6;
            --c-blue: #1a44d4;
            --r-control: 4px;
            --r-tile: 8px;
            --sp-4: 4px;
            --sp-8: 8px;
            --sp-12: 12px;
            --sp-16: 16px;
            --sp-20: 20px;
            --sp-24: 24px;
            --sp-32: 32px;
            --sp-40: 40px;
            --sp-64: 64px;
            --fs-h1: 34px;
            --lh-h1: 40px;
            --fs-body-l: 17px;
            --lh-body-l: 26px;
            --fs-body: 16px;
            --lh-body: 24px;
            --fs-small: 14px;
            --lh-small: 20px;
            --fs-micro: 12px;
            --lh-micro: 16px;
        }

        @media (min-width: 1024px) {
            :root {
                --fs-h1: 48px;
                --lh-h1: 54px;
                --fs-body-l: 18px;
                --lh-body-l: 28px;
            }
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100dvh;
            display: grid;
            align-content: center;
            padding: var(--sp-64) var(--sp-20) calc(var(--sp-64) + env(safe-area-inset-bottom));
            background: var(--c-surface);
            color: var(--c-ink);
            font-family: 'Archivo Variable', Arial, Helvetica, sans-serif;
            font-size: var(--fs-body);
            line-height: var(--lh-body);
            -webkit-font-smoothing: antialiased;
            hyphens: auto;
        }

        .page {
            width: 100%;
            max-width: 920px;
            margin-inline: auto;
            display: grid;
            gap: var(--sp-32);
            align-items: start;
        }

        @media (min-width: 900px) {
            .page {
                grid-template-columns: minmax(0, 1fr) 220px;
                gap: var(--sp-40);
            }
        }

        .brand {
            display: block;
            margin-bottom: var(--sp-32);
            font-size: var(--fs-body-l);
            line-height: var(--lh-body-l);
            font-weight: 700;
            letter-spacing: 0.06em;
            color: var(--c-ink);
            text-decoration: none;
        }

        .code {
            display: block;
            margin: 0 0 var(--sp-8);
            font-size: var(--fs-micro);
            line-height: var(--lh-micro);
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--c-ink-3);
            font-variant-numeric: tabular-nums;
        }

        h1 {
            margin: 0;
            font-size: var(--fs-h1);
            line-height: var(--lh-h1);
            font-weight: 700;
            letter-spacing: -0.005em;
            text-wrap: balance;
        }

        .lead {
            margin: var(--sp-16) 0 0;
            max-width: 54ch;
            font-size: var(--fs-body-l);
            line-height: var(--lh-body-l);
            color: var(--c-ink-2);
        }

        .detail {
            margin: var(--sp-12) 0 0;
            max-width: 54ch;
            color: var(--c-ink-2);
        }

        .routes {
            display: grid;
            gap: var(--sp-12);
            margin-top: var(--sp-32);
        }

        @media (min-width: 560px) {
            .routes {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
            }
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            padding-inline: var(--sp-20);
            border: 1px solid transparent;
            border-radius: var(--r-control);
            font: inherit;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
        }

        .btn--primary {
            background: var(--c-blue);
            color: var(--c-surface);
        }

        .btn--secondary {
            background: var(--c-surface);
            border-color: var(--c-line-2);
            color: var(--c-ink);
        }

        .btn--ghost {
            background: transparent;
            color: var(--c-blue);
        }

        .btn:focus-visible {
            outline: 2px solid var(--c-blue);
            outline-offset: 2px;
        }

        .note {
            margin: var(--sp-24) 0 0;
            max-width: 54ch;
            font-size: var(--fs-small);
            line-height: var(--lh-small);
            color: var(--c-ink-3);
        }

        .note a { color: var(--c-blue); }

        .mark {
            display: grid;
            place-items: center;
            padding: var(--sp-24);
            border-radius: var(--r-tile);
            background: var(--c-band);
            color: var(--c-line-2);
        }

        .mark svg {
            width: 100%;
            max-width: 156px;
            height: auto;
        }

        @media (max-width: 899px) {
            .mark { display: none; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div>
            <a class="brand" href="/">RIMIFY</a>
            <p class="code">Fehler <span translate="no">{{ $status }}</span></p>
            <h1>{{ $title }}</h1>
            <p class="lead">{{ $lead }}</p>
            @if ($detail)
                <p class="detail">{{ $detail }}</p>
            @endif

            <nav class="routes" aria-label="Wie es weitergeht">
                {{-- An empty href is the current document: "try this again" with no JavaScript. --}}
                <a class="btn btn--primary" href="">Diese Seite neu laden</a>
                <a class="btn btn--secondary" href="/">Zur Startseite</a>
                <a class="btn btn--ghost" href="{{ $mailto }}">Per E-Mail schreiben</a>
            </nav>

            <p class="note">
                Du erreichst uns unter
                <a href="{{ $mailto }}" translate="no">{{ $contact['email'] }}</a>,
                <span translate="no">{{ $contact['hours'] }}</span>.
            </p>
        </div>

        {{-- The shop's own drawn wheel, quietly: a designed page, not a stack of text. --}}
        <div class="mark" aria-hidden="true">
            <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="80" cy="80" r="72"/>
                <circle cx="80" cy="80" r="58"/>
                <circle cx="80" cy="80" r="17"/>
                <path d="M80 23V63M129.4 108.5 94.7 88.5M30.6 108.5 65.3 88.5"/>
                <path d="M80 137V97M30.6 51.5 65.3 71.5M129.4 51.5 94.7 71.5"/>
            </svg>
        </div>
    </div>
</body>
</html>
