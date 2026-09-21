/*
 * RIMIFY — serve the design's photography from our own origin.
 *
 * THIS FILE IS OURS. Everything in ./shared/ is a verbatim copy of the design and is never
 * edited; this sits outside it and changes nothing about how anything looks.
 *
 * ── Why ──────────────────────────────────────────────────────────────────────────────────────
 *
 * `shared/art.js` builds its photo URLs as:
 *
 *     https://unsplash.com/photos/<id>/download?force=true&w=<width>
 *
 * That is Unsplash's *download* endpoint. It answers 302 and redirects to images.unsplash.com, so
 * every photograph costs two round trips to a third-party CDN before a byte of image arrives, and
 * the endpoint is rate-limited — when it throttles, `art.js` quietly swaps in its drawn fallback,
 * so the page does not look broken, it just silently shows different artwork.
 *
 * The Startseite asks for about twenty of these, plus eight marque logos from a third host, one of
 * which is a 1.5 MB Wikimedia SVG rendered at 38px.
 *
 * Every one of those files is already in this repository (design-export/images, with MANIFEST.md
 * recording which URL each came from), copied to public/prototype/images. Pointing the runtime at
 * them removes the redirect, the third-party DNS and TLS handshakes, and the throttling. Same
 * bytes, same pixels — they are the very files those URLs returned.
 *
 * It is also what production needs regardless: config/rimify.php already notes that Unsplash is
 * not a licence RIMIFY holds, so the images have to come from our own origin before launch.
 *
 * ── How ──────────────────────────────────────────────────────────────────────────────────────
 *
 * `ART.PHOTO` is a plain object on the exported `ART`, so its values are simply reassigned after
 * art.js has run and before app.js boots. `LOGO` is private to art.js, so `ART.makeLogo` is
 * wrapped instead and the URLs rewritten in the HTML it returns.
 *
 * Nothing about the markup's SHAPE changes — same <img>, same attributes, same fallback wiring.
 * Only the host in `src` differs, and tests/visual/signature.mjs maps both forms to the same file
 * name so the fidelity gate still compares them as equal.
 */
(function (w) {
    'use strict';

    var ART = w.ART;
    if (!ART || !ART.PHOTO) return;

    var BASE = '/prototype/images/';

    function u(id, width) {
        return 'https://unsplash.com/photos/' + id + '/download?force=true&w=' + width;
    }

    /* Straight from art.js's PHOTO and LOGO tables, in the same order, so this list can be
       checked against the source line by line. */
    var MAP = {};
    MAP[u('pQ0_oAtnDqI', 2000)] = 'hero.jpg';
    MAP[u('odmg2fspBBU', 1200)] = 'hero-mobile.jpg';
    MAP[u('7L2-sf19x78', 1600)] = 'check-car.jpg';
    MAP[u('ENHqkZBMTMA', 1400)] = 'lager.jpg';
    MAP['https://images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=1400&q=80'] = 'werkstatt.jpg';
    MAP[u('l9riyueOA2k', 900)] = 'tyre.jpg';
    MAP['https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1600&q=80'] = 'admin-panel.jpg';
    MAP['https://images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=900&q=80'] = 'wheel-1.jpg';
    MAP[u('zAfKgmZIbSU', 900)] = 'wheel-2.jpg';
    MAP[u('ENHqkZBMTMA', 900)] = 'wheel-4.jpg';
    MAP[u('m8zQivdifx8', 900)] = 'wheel-5.jpg';
    MAP[u('pQ0_oAtnDqI', 900)] = 'wheel-6.jpg';
    MAP[u('m8zQivdifx8', 1200)] = 'banner-1.jpg';
    MAP[u('zAfKgmZIbSU', 1200)] = 'banner-2.jpg';
    MAP[u('l9riyueOA2k', 1200)] = 'banner-3.jpg';
    MAP[u('ENHqkZBMTMA', 1200)] = 'banner-4.jpg';

    var LOGOS = {
        'https://cdn.simpleicons.org/bmw/0E1116': 'logo-bmw.svg',
        'https://cdn.simpleicons.org/audi/0E1116': 'logo-audi.svg',
        'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg': 'logo-mercedes.svg',
        'https://cdn.simpleicons.org/volkswagen/0E1116': 'logo-vw.svg',
        'https://cdn.simpleicons.org/porsche/0E1116': 'logo-porsche.svg',
        'https://cdn.simpleicons.org/opel/0E1116': 'logo-opel.svg',
        'https://cdn.simpleicons.org/ford/0E1116': 'logo-ford.svg',
        'https://cdn.simpleicons.org/skoda/0E1116': 'logo-skoda.svg'
    };

    function local(url) {
        var file = MAP[url];
        return file ? BASE + file : url;
    }

    var P = ART.PHOTO;
    ['hero', 'heroM', 'checkCar', 'lager', 'werkstatt', 'tyre', 'adminPanel'].forEach(function (key) {
        if (typeof P[key] === 'string') P[key] = local(P[key]);
    });
    ['wheels', 'banners'].forEach(function (key) {
        if (Object.prototype.toString.call(P[key]) === '[object Array]') {
            P[key] = P[key].map(local);
        }
    });

    // LOGO is not exported, so the marque marks are rewritten in makeLogo's output instead.
    var makeLogo = ART.makeLogo;
    if (typeof makeLogo === 'function') {
        ART.makeLogo = function (name, h) {
            var html = makeLogo(name, h);
            Object.keys(LOGOS).forEach(function (url) {
                html = html.split(url).join(BASE + LOGOS[url]);
            });
            return html;
        };
    }
})(window);
