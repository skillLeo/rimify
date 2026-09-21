/*
 * RIMIFY — feed the design's runtime from the real catalogue.
 *
 * THIS FILE IS OURS. It sits outside ./shared/, which stays a byte-identical copy of the design.
 *
 * `shared/data.js` defines `window.RMF` and fills it with the design's twelve demonstration
 * wheels. Every component the runtime draws reads from that object, so shipping the runtime
 * unmodified also ships its demo catalogue. This replaces the DATA on that object with ours while
 * leaving the object — and every function on it — exactly as the design wrote it.
 *
 * What is replaced:  wheels, tyres, makes, faq, legal, brands, tiles
 * What is kept:      eur(), dec(), warum, orders, aktivitaet, footerLine, kontaktIntro, pages
 *
 * `lookup()` is rebuilt rather than kept. In data.js it closes over a module-private `keyIndex`
 * built from the demo makes, so replacing `RMF.makes` alone would leave every HSN/TSN search
 * answering from the demonstration vehicles. The replacement uses the identical algorithm over
 * the real ones — which is also what makes R-01 real on the storefront: a key pair matching more
 * than one car returns more than one row, and the selector asks which.
 *
 * The payload is a JSON data block in the document rather than inline script, so nothing here
 * needs a CSP exception. Absent — on the visual-fixture routes, which must keep the design's own
 * data so the baselines stay valid — this does nothing at all.
 */
(function (w, d) {
    'use strict';

    var R = w.RMF;
    if (!R) return;

    var el = d.getElementById('rimify-live-data');
    if (!el) return; // fixture route, or live data deliberately off — keep the design's data.

    var data;
    try {
        data = JSON.parse(el.textContent || '{}');
    } catch (e) {
        // Never take the page down over this: the design's own data is a working fallback, and
        // the error stays visible rather than becoming a silently half-real catalogue.
        console.error('[rimify] live data could not be parsed; keeping the design data', e);
        return;
    }

    ['wheels', 'tyres', 'makes', 'faq', 'legal', 'brands', 'tiles'].forEach(function (key) {
        if (Object.prototype.toString.call(data[key]) === '[object Array]' && data[key].length) {
            R[key] = data[key];
        }
    });

    /* ── rebuild the key-number index ─────────────────────────────────────────────────────────
     *
     * Same construction as data.js, over the real vehicles. Kept deliberately identical so that
     * the id, label and short forms the header and the basket display are the ones the design's
     * own components expect.
     */
    var keyIndex = [];

    R.makes.forEach(function (mk) {
        (mk.models || []).forEach(function (md) {
            (md.variants || []).forEach(function (v) {
                if (!v.hsn) return;

                keyIndex.push({
                    id: (v.hsn + '-' + v.tsn + '-' + (v.vsn || md.name)).replace(/\s+/g, ''),
                    make: mk.name,
                    model: md.name,
                    variant: v.name,
                    label: mk.name + ' ' + md.name + ' ' + v.name.replace(mk.name + ' ', ''),
                    short: mk.name + ' ' + md.name,
                    hsn: v.hsn,
                    tsn: v.tsn,
                    vsn: v.vsn || null,
                    years: v.years,
                    kw: v.kw,
                    ps: v.ps,
                    body: v.body,
                    vmax: v.vmax
                });
            });
        });
    });

    R.keyIndex = keyIndex;

    /* data.js's `lookup` closes over its own index, so it has to be replaced rather than left in
       place. Same comparison rules: trimmed, upper-cased, and both keys must match — spec §3.5. */
    R.lookup = function (hsn, tsn) {
        var h = String(hsn || '').trim().toUpperCase();
        var t = String(tsn || '').trim().toUpperCase();

        return keyIndex.filter(function (v) {
            return v.hsn === h && v.tsn === t;
        });
    };
})(window, document);
